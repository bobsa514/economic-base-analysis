"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { LQIndustry } from "@/types";

interface LQBarChartProps {
  industries: LQIndustry[];
  maxItems?: number;
}

/**
 * Returns a color based on Location Quotient value:
 * - Red for LQ < 0.5 (under-represented)
 * - Amber for LQ ~ 1.0 (proportional)
 * - Green for LQ > 1.5 (specialized / export-base)
 */
function lqColor(lq: number): string {
  if (lq < 0.5) return "#ef4444"; // red-500
  if (lq < 0.8) return "#f97316"; // orange-500
  if (lq < 1.2) return "#f59e0b"; // amber-500
  if (lq < 1.5) return "#84cc16"; // lime-500
  return "#22c55e"; // green-500
}

/**
 * Horizontal bar chart showing top industries by Location Quotient.
 * Bars are colored by LQ value, with a reference line at LQ = 1.0.
 */
export default function LQBarChart({
  industries,
  maxItems = 15,
}: LQBarChartProps) {
  // Sort by LQ descending and take top N
  const sorted = [...industries]
    .sort((a, b) => b.lq - a.lq)
    .slice(0, maxItems);

  // Reverse so highest LQ appears at top in horizontal bar chart
  const data = [...sorted].reverse().map((ind) => ({
    ...ind,
    // Truncate long labels for chart readability
    shortName:
      ind.naics_label.length > 35
        ? ind.naics_label.slice(0, 32) + "..."
        : ind.naics_label,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(400, data.length * 32)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 180, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          domain={[0, "auto"]}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={170}
          tick={{ fontSize: 11, fill: "#334155" }}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as LQIndustry & {
              shortName: string;
            };
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-md">
                <p className="font-semibold text-slate-900">
                  {d.naics_label}
                </p>
                <p className="text-slate-500">NAICS: {d.naics}</p>
                <p className="mt-1">
                  <span className="font-medium">LQ:</span>{" "}
                  <span
                    className="font-bold"
                    style={{ color: lqColor(d.lq) }}
                  >
                    {d.lq.toFixed(2)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Employment:</span>{" "}
                  {d.employment.toLocaleString()}
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine
          x={1}
          stroke="#2563eb"
          strokeDasharray="4 4"
          strokeWidth={2}
          label={{
            value: "LQ = 1.0",
            position: "top",
            fill: "#2563eb",
            fontSize: 12,
          }}
        />
        <Bar dataKey="lq" radius={[0, 4, 4, 0]} animationDuration={800}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={lqColor(entry.lq)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
