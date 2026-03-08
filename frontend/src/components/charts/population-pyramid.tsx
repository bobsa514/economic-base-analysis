"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { PopulationPyramidEntry } from "@/types";

interface PopulationPyramidProps {
  data: PopulationPyramidEntry[];
}

/**
 * Population Pyramid chart: horizontal bar chart mirrored around center.
 * Males extend to the left (shown as negative values), females to the right.
 */
export default function PopulationPyramid({ data }: PopulationPyramidProps) {
  // Transform data: negate male values so they extend left
  // Reverse so youngest age groups appear at the bottom (standard pyramid convention)
  const chartData = data
    .filter((d) => d.male != null || d.female != null)
    .map((d) => ({
      age_group: d.age_group,
      male: d.male != null ? -d.male : 0,
      female: d.female ?? 0,
      maleRaw: d.male ?? 0,
      femaleRaw: d.female ?? 0,
    }))
    .reverse();

  // Find max absolute value for symmetric axis
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(Math.abs(d.male), d.female))
  );

  return (
    <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 24)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        barGap={0}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          domain={[-maxVal * 1.1, maxVal * 1.1]}
          tickFormatter={(v: number) => Math.abs(v).toLocaleString()}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis
          type="category"
          dataKey="age_group"
          width={70}
          tick={{ fontSize: 11, fill: "#334155" }}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as {
              age_group: string;
              maleRaw: number;
              femaleRaw: number;
            };
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-md">
                <p className="font-semibold text-slate-900">{d.age_group}</p>
                <p className="text-blue-600">
                  Male: {d.maleRaw.toLocaleString()}
                </p>
                <p className="text-rose-500">
                  Female: {d.femaleRaw.toLocaleString()}
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine x={0} stroke="#94a3b8" />
        <Bar
          dataKey="male"
          fill="#3b82f6"
          radius={[4, 0, 0, 4]}
          animationDuration={800}
          name="Male"
        />
        <Bar
          dataKey="female"
          fill="#f43f5e"
          radius={[0, 4, 4, 0]}
          animationDuration={800}
          name="Female"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
