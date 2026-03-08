"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { EducationEntry } from "@/types";

interface EducationDonutProps {
  data: EducationEntry[];
}

// Group granular education levels into 5 broad categories
// Based on standard ACS education attainment groupings
const EDUCATION_GROUPS: { label: string; keywords: string[] }[] = [
  {
    label: "Less than HS",
    keywords: [
      "no schooling",
      "nursery",
      "kindergarten",
      "1st grade",
      "2nd grade",
      "3rd grade",
      "4th grade",
      "5th grade",
      "6th grade",
      "7th grade",
      "8th grade",
      "9th grade",
      "10th grade",
      "11th grade",
      "12th grade, no diploma",
    ],
  },
  {
    label: "High School",
    keywords: [
      "regular high school diploma",
      "ged or alternative credential",
    ],
  },
  {
    label: "Some College",
    keywords: [
      "some college",
      "associate",
    ],
  },
  {
    label: "Bachelor's",
    keywords: ["bachelor"],
  },
  {
    label: "Graduate+",
    keywords: ["master", "professional school", "doctorate"],
  },
];

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6"];

function groupEducation(data: EducationEntry[]) {
  const grouped = EDUCATION_GROUPS.map((group) => ({
    name: group.label,
    value: 0,
  }));

  for (const entry of data) {
    if (entry.count == null) continue;
    const lowerLevel = entry.level.toLowerCase();
    let matched = false;
    for (let i = 0; i < EDUCATION_GROUPS.length; i++) {
      if (EDUCATION_GROUPS[i].keywords.some((kw) => lowerLevel.includes(kw))) {
        grouped[i].value += entry.count;
        matched = true;
        break;
      }
    }
    // If no keyword matched, put it in "Some College" as fallback
    if (!matched) {
      grouped[2].value += entry.count;
    }
  }

  return grouped.filter((g) => g.value > 0);
}

/**
 * Donut chart showing education attainment grouped into 5 broad categories.
 */
export default function EducationDonut({ data }: EducationDonutProps) {
  const grouped = groupEducation(data);
  const total = grouped.reduce((sum, g) => sum + g.value, 0);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={grouped}
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={2}
          dataKey="value"
          animationDuration={800}
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {grouped.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { name: string; value: number };
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-md">
                <p className="font-semibold text-slate-900">{d.name}</p>
                <p className="text-slate-600">
                  {d.value.toLocaleString()} ({pct}%)
                </p>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-xs text-slate-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
