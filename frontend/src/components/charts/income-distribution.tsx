"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { IncomeDistributionEntry } from "@/types";

interface IncomeDistributionProps {
  data: IncomeDistributionEntry[];
}

/**
 * Vertical bar chart showing household income distribution by bracket.
 */
export default function IncomeDistribution({ data }: IncomeDistributionProps) {
  const chartData = data
    .filter((d) => d.households != null)
    .map((d) => ({
      bracket: d.bracket,
      // Shorten bracket labels for chart readability
      shortBracket: d.bracket
        .replace("Less than ", "<")
        .replace(" to ", "-")
        .replace(",000", "k")
        .replace(",999", "k")
        .replace("$", "$")
        .replace(" or more", "+"),
      households: d.households ?? 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 10, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="shortBracket"
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={{ stroke: "#cbd5e1" }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as {
              bracket: string;
              households: number;
            };
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-md">
                <p className="font-semibold text-slate-900">{d.bracket}</p>
                <p className="text-emerald-600">
                  Households: {d.households.toLocaleString()}
                </p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="households"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
