import { getFoodLogs, getHistoricalData } from "@/app/actions";
import Dashboard from "@/components/Dashboard";
import { AlertCircle, Terminal, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || new Date().toISOString().slice(0, 10);
  const [logsResult, historyResult] = await Promise.all([getFoodLogs(selectedDate), getHistoricalData(7)]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 md:py-20 min-h-screen">
      {logsResult.success && logsResult.data && historyResult.success && historyResult.data ? (
        <Dashboard initialLogs={logsResult.data} initialHistory={historyResult.data} selectedDate={selectedDate} />
      ) : (
        <div className="max-w-2xl mx-auto mt-10 p-6 md:p-8 glass rounded-2xl border border-rose-500/20 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl shrink-0">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight">Database Connection Error</h2>
                <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                  The application was unable to connect to your PostgreSQL database. This is expected before running the database initialization command.
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Terminal size={14} className="text-indigo-400" />
                  Quick Troubleshooting Steps:
                </h4>
                <ol className="text-xs text-slate-400 list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    Verify your credentials in the <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">.env</code> file.
                  </li>
                  <li>
                    Make sure your local PostgreSQL database server is active and running.
                  </li>
                  <li>
                    Run the commands below to install dependencies and sync the schema:
                  </li>
                </ol>
                <div className="bg-slate-900/90 rounded-lg p-3 text-xs text-slate-300 font-mono select-all overflow-x-auto border border-slate-800">
                  npm install && npx prisma db push && npm run dev
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg border border-slate-900">
                <HelpCircle size={14} className="shrink-0" />
                <span>Prisma Client requires the schema to be pushed to the database first.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
