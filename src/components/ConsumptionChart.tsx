"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";

export type HistoryPoint = { date: string; calories: number; sugar: number; sodium: number };
type Metric = "calories" | "sugar" | "sodium";

const metrics: Record<Metric, { label: string; unit: string; target: number; color: string }> = {
  calories: { label: "Calories", unit: "kcal", target: 2000, color: "#e879f9" },
  sugar: { label: "Sugar", unit: "g", target: 50, color: "#fb923c" },
  sodium: { label: "Sodium", unit: "mg", target: 2300, color: "#38bdf8" },
};

export default function ConsumptionChart({ data }: { data: HistoryPoint[] }) {
  const [metric, setMetric] = useState<Metric>("calories");
  const [hovered, setHovered] = useState<number | null>(null);
  const config = metrics[metric];
  const max = Math.max(config.target, ...data.map((point) => point[metric]), 1);
  const width = 760;
  const height = 250;
  const chartHeight = 184;
  const barWidth = Math.min(46, Math.max(20, (width - 80) / Math.max(data.length, 1) - 14));

  return (
    <section className="panel p-5 md:p-7" aria-label="Consumption trend">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow"><BarChart3 size={14} /> Seven day trend</p>
          <h2 className="section-title mt-2">Your rhythm, at a glance</h2>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Chart metric">
          {(Object.keys(metrics) as Metric[]).map((key) => (
            <button key={key} className={metric === key ? "active" : ""} onClick={() => setMetric(key)} role="tab" aria-selected={metric === key}>
              {metrics[key].label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 overflow-x-auto pb-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] min-w-[620px] w-full" role="img" aria-label={`${config.label} over the last seven days`}>
          <line x1="40" x2={width - 10} y1={chartHeight * (1 - config.target / max) + 8} y2={chartHeight * (1 - config.target / max) + 8} stroke="#64748b" strokeDasharray="5 5" strokeWidth="1" />
          <text x={width - 10} y={chartHeight * (1 - config.target / max) + 3} textAnchor="end" className="chart-label">target</text>
          {data.map((point, index) => {
            const value = point[metric];
            const barHeight = (value / max) * chartHeight;
            const x = 50 + index * ((width - 70) / Math.max(data.length, 1));
            const y = chartHeight - barHeight + 8;
            return (
              <g key={point.date} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} className="chart-bar">
                <rect x={x} y={8} width={barWidth} height={chartHeight} rx="6" fill="transparent" />
                <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 3)} rx="6" fill={config.color} opacity={hovered === index ? 1 : 0.78} />
                <text x={x + barWidth / 2} y={height - 12} textAnchor="middle" className="chart-label">{new Date(`${point.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</text>
                {hovered === index && <g className="chart-tooltip"><rect x={x - 18} y={Math.max(10, y - 42)} width="92" height="30" rx="6" fill="#172033" /><text x={x + 28} y={Math.max(29, y - 22)} textAnchor="middle" className="chart-tooltip-text">{value.toLocaleString()} {config.unit}</text></g>}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
