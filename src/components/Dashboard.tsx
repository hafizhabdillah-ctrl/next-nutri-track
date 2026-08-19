"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MealType } from "@prisma/client";
import { CalendarDays, ChevronLeft, ChevronRight, Coffee, Edit3, Plus, Trash2, Utensils, X } from "lucide-react";
import Swal from "sweetalert2";
import { createFoodLog, deleteAllFoodLogs, deleteFoodLog, updateFoodLog } from "@/app/actions";
import ConsumptionChart, { HistoryPoint } from "@/components/ConsumptionChart";

type FoodLog = { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; sugar: number; sodium: number; mealType: MealType; loggedAt: Date | string };
type FoodForm = Omit<FoodLog, "id" | "loggedAt"> & { loggedAt: string };
const mealTypes: MealType[] = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];
const targets = { calories: 2000, sugar: 50, sodium: 2300 };
const emptyForm: FoodForm = { name: "", calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, mealType: MealType.BREAKFAST, loggedAt: "" };
const swalTheme = { popup: "nutri-swal", title: "nutri-swal-title", htmlContainer: "nutri-swal-text", icon: "nutri-swal-icon", confirmButton: "nutri-swal-confirm", cancelButton: "nutri-swal-cancel" };
const Toast = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 2600, timerProgressBar: true, customClass: swalTheme });

function localDate(date: Date) { return date.toISOString().slice(0, 10); }
function formatNumber(value: number) { return Number.isInteger(value) ? value.toString() : value.toFixed(1); }

export default function Dashboard({ initialLogs, initialHistory, selectedDate }: { initialLogs: FoodLog[]; initialHistory: HistoryPoint[]; selectedDate: string }) {
  const router = useRouter();
  const [date, setDate] = useState(selectedDate);
  const [logs, setLogs] = useState(initialLogs);
  const [history] = useState(initialHistory);
  const [form, setForm] = useState<FoodForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    setDate(selectedDate);
    setLogs(initialLogs);
  }, [initialLogs, selectedDate]);
  const totals = useMemo(() => logs.reduce((sum, log) => ({ calories: sum.calories + log.calories, sugar: sum.sugar + log.sugar, sodium: sum.sodium + log.sodium, protein: sum.protein + log.protein }), { calories: 0, sugar: 0, sodium: 0, protein: 0 }), [logs]);
  const grouped = mealTypes.map((mealType) => ({ mealType, logs: logs.filter((log) => log.mealType === mealType) })).filter((group) => group.logs.length > 0);
  const todayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const changeDate = (offset: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + offset);
    const nextDate = localDate(next);
    setDate(nextDate);
    router.push(`/?date=${nextDate}`);
  };

  const openForm = (log?: FoodLog) => {
    setEditingId(log?.id || null);
    setForm(log ? { ...log, loggedAt: new Date(log.loggedAt).toISOString().slice(0, 16) } : { ...emptyForm, loggedAt: `${date}T12:00` });
    setError("");
    setModalOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || form.calories < 0) { setError("Add a food name and a valid calorie amount."); return; }
    startTransition(async () => {
      const response = editingId ? await updateFoodLog(editingId, form) : await createFoodLog(form);
      if (!response.success) { setError(response.error || "Unable to save this entry."); await Toast.fire({ icon: "error", title: response.error || "Unable to save this entry." }); return; }
      setModalOpen(false);
      await Toast.fire({ icon: "success", title: editingId ? "Entry updated" : "Food logged" });
      router.refresh();
    });
  };

  const remove = (id: string) => startTransition(async () => {
    const confirmation = await Swal.fire({ title: "Delete this entry?", text: "This cannot be undone.", icon: "warning", position: "center", showCancelButton: true, confirmButtonText: "Delete", cancelButtonText: "Keep it", customClass: swalTheme });
    if (!confirmation.isConfirmed) return;
    const response = await deleteFoodLog(id);
    if (!response.success) { await Toast.fire({ icon: "error", title: response.error || "Unable to delete entry." }); return; }
    setLogs((current) => current.filter((log) => log.id !== id));
    await Toast.fire({ icon: "success", title: "Entry deleted" });
    router.refresh();
  });

  const removeAll = () => startTransition(async () => {
    const confirmation = await Swal.fire({ title: "Delete all food logs?", text: "Every entry will be permanently removed.", icon: "warning", position: "top-end", showCancelButton: true, confirmButtonText: "Delete all", cancelButtonText: "Cancel", customClass: swalTheme });
    if (!confirmation.isConfirmed) return;
    const response = await deleteAllFoodLogs();
    if (!response.success) {
      await Toast.fire({ icon: "error", title: response.error || "Unable to delete logs." });
      return;
    }
    setLogs([]);
    await Toast.fire({ icon: "success", title: `${response.count} logs deleted` });
    router.refresh();
  });
  const ring = (value: number, target: number) => Math.min(100, (value / target) * 100);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div><p className="eyebrow">Daily nutrition companion</p><h1 className="display-title">Eat with intention.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">A calmer view of the numbers that shape how you feel, one meal at a time.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={removeAll} className="secondary-button"><Trash2 size={16} /> Delete all</button><button onClick={() => openForm()} className="primary-button"><Plus size={18} /> Log food</button></div>
      </header>

      <section className="mb-6 flex flex-col gap-4 border-y border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={18} className="text-orange-300" />
          <span className="text-sm font-semibold text-white">
            {todayLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="icon-button" title="Previous day" onClick={() => changeDate(-1)}>
            <ChevronLeft size={18} />
          </button>

          <label className="date-picker" aria-label="Choose a date">
            <CalendarDays size={16} />
            <input
              type="date"
              value={date}
              onChange={(event) => {
                const nextDate = event.target.value;
                if (nextDate) {
                  setDate(nextDate);
                  router.push(`/?date=${nextDate}`);
                }
              }}
            />
          </label>

          <button className="icon-button" title="Next day" onClick={() => changeDate(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ProgressCard label="Calories" value={totals.calories} target={targets.calories} unit="kcal" color="#f97316" percent={ring(totals.calories, targets.calories)} />
        <ProgressCard label="Sugar" value={totals.sugar} target={targets.sugar} unit="g" color="#e879f9" percent={ring(totals.sugar, targets.sugar)} />
        <ProgressCard label="Sodium" value={totals.sodium} target={targets.sodium} unit="mg" color="#38bdf8" percent={ring(totals.sodium, targets.sodium)} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><ConsumptionChart data={history} /><section className="panel p-5 md:p-7"><p className="eyebrow"><Utensils size={14} /> Macro snapshot</p><h2 className="section-title mt-2">What is on the plate</h2><div className="mt-7 space-y-5">{[["Protein", totals.protein, "g", "bg-orange-400"], ["Carbs", logs.reduce((sum, log) => sum + log.carbs, 0), "g", "bg-fuchsia-400"], ["Fat", logs.reduce((sum, log) => sum + log.fat, 0), "g", "bg-sky-400"]].map(([label, value, unit, color]) => <div key={label as string}><div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">{label}</span><strong className="text-white">{formatNumber(value as number)}{unit}</strong></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value as number) / 2)}%` }} /></div></div>)}</div></section></div>

      <section className="mt-6 panel p-5 md:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">
              <Coffee size={14} /> Food journal
              </p>
              <h2 className="section-title mt-2">{todayLabel} entries</h2>
          </div>
          <span className="text-sm text-slate-500">{logs.length} {logs.length === 1 ? "item" : "items"}</span>
        </div>
        <div className="mt-6 space-y-7">{grouped.length ? grouped.map(({ mealType, logs: mealLogs }) => 
          <div key={mealType}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">{mealType.toLowerCase()}</h3>
            <div className="divide-y divide-white/10">{mealLogs.map((log) => 
              <div key={log.id} className="group flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <h4 className="truncate font-semibold text-white">{log.name}</h4>
                  <p className="mt-1 text-xs text-slate-500">{formatNumber(log.protein)}g protein · {formatNumber(log.carbs)}g carbs · {formatNumber(log.fat)}g fat</p>
                </div>
                  <div className="flex shrink-0 items-center gap-4"><span className="text-right"><strong className="block text-sm text-white">{log.calories} kcal</strong><small className="text-xs text-slate-500">{formatNumber(log.sugar)}g sugar</small></span><div className="flex gap-1 opacity-0 transition group-hover:opacity-100"><button className="icon-button" title="Edit entry" onClick={() => openForm(log)}><Edit3 size={15} /></button><button className="icon-button danger" title="Delete entry" onClick={() => remove(log.id)}><Trash2 size={15} /></button></div></div>
              </div>)}
            </div>
          </div>) : 
          
          <div className="empty-state">
            <Utensils size={24} />
            <p>No entries for this day yet.</p>
            <button onClick={() => openForm()} className="text-sm font-semibold text-orange-300 hover:text-orange-200">
              Add your first meal
            </button>
          </div>}
        </div>
      </section>

      {modalOpen && 
      <div className="modal-backdrop">
        <div className="modal-panel">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <p className="eyebrow">{editingId ? "Update entry" : "New entry"}</p>
              <h2 className="text-xl font-bold text-white">Fuel your day</h2>
            </div>
            <button className="icon-button" title="Close" onClick={() => setModalOpen(false)}><X size={18} /></button>
          </div>
          
          <form onSubmit={submit} className="space-y-4 p-6">{error && <p className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
            <label className="field">Food or drink<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Avocado toast" /></label>

            <div className="grid grid-cols-2 gap-4">
              <label className="field">Meal<select value={form.mealType} onChange={(event) => setForm({ ...form, mealType: event.target.value as MealType })}>{mealTypes.map((type) => <option key={type} value={type}>{type.toLowerCase()}</option>)}</select></label>
              <label className="field">Logged at<input type="datetime-local" required value={form.loggedAt} onChange={(event) => setForm({ ...form, loggedAt: event.target.value })} /></label>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{(["calories", "protein", "carbs", "fat", "sugar", "sodium"] as const).map((field) => 
              <label className="field" key={field}>{field === "sodium" ? "Sodium (mg)" : `${field[0].toUpperCase()}${field.slice(1)}${field === "calories" ? " (kcal)" : " (g)"}`}
              <input type="number" min="0" step="0.1" required={field === "calories"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} />
              </label>)}
            </div>
            <button disabled={isPending} className="primary-button w-full justify-center">{isPending ? "Saving..." : editingId ? "Save changes" : "Add to journal"}</button>
          </form>
        </div>
      </div>}
    </main>
  );
}

function ProgressCard({ label, value, target, unit, color, percent }: { label: string; value: number; target: number; unit: string; color: string; percent: number }) {
  return <div className="panel flex items-center gap-5 p-5">
    <div className="progress-ring" style={{ background: `conic-gradient(${color} ${percent}%, rgba(255,255,255,.09) 0)` }}>
      <div className="progress-ring-inner">
        <span>{Math.round(percent)}%</span>
      </div>
    </div>
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{formatNumber(value)}
        <small className="ml-1 text-xs font-medium text-slate-500">{unit}</small>
      </p>
      <p className="mt-1 text-xs text-slate-500">of {formatNumber(target)} {unit}</p>
    </div>
  </div>;
}
