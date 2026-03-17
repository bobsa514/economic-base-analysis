"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { REGION_COLORS } from "./region-selector";
import type { CountyInfo, LQResponse } from "@/types";

interface RegionLQData {
  region: CountyInfo;
  lqData?: LQResponse | null;
  isLoading: boolean;
}

interface LQComparisonChartProps {
  regionsLQData: RegionLQData[];
  naicsLevel: number;
  onNaicsLevelChange: (level: number) => void;
}

const NAICS_LEVELS = [
  { value: "2", label: "2-digit (Sector)" },
  { value: "3", label: "3-digit (Subsector)" },
  { value: "4", label: "4-digit (Industry Group)" },
];

/**
 * Grouped bar chart comparing Location Quotients across regions.
 * Shows top 10 industries by average LQ across all selected regions.
 * Each industry has one bar per region, color-coded consistently.
 *
 * Also includes a stacked bar chart showing employment share by industry
 * to visualize structural differences between regions.
 */
export default function LQComparisonChart({
  regionsLQData,
  naicsLevel,
  onNaicsLevelChange,
}: LQComparisonChartProps) {

  const isLoading = regionsLQData.some((r) => r.isLoading);

  // Build grouped bar data: top 10 industries by average LQ
  const groupedData = useMemo(() => {
    const validData = regionsLQData.filter((r) => r.lqData);
    if (validData.length === 0) return [];

    // Collect all unique industries across regions
    const industryMap = new Map<
      string,
      {
        naics: string;
        label: string;
        lqs: Record<string, number>;
        totalLQ: number;
        count: number;
      }
    >();

    for (const rd of validData) {
      if (!rd.lqData) continue;
      for (const ind of rd.lqData.industries) {
        const existing = industryMap.get(ind.naics);
        if (existing) {
          existing.lqs[rd.region.fips] = ind.lq;
          existing.totalLQ += ind.lq;
          existing.count += 1;
        } else {
          industryMap.set(ind.naics, {
            naics: ind.naics,
            label: ind.naics_label,
            lqs: { [rd.region.fips]: ind.lq },
            totalLQ: ind.lq,
            count: 1,
          });
        }
      }
    }

    // Sort by average LQ descending, take top 10
    const sorted = Array.from(industryMap.values())
      .map((item) => ({
        ...item,
        avgLQ: item.totalLQ / item.count,
      }))
      .sort((a, b) => b.avgLQ - a.avgLQ)
      .slice(0, 10);

    // Convert to Recharts format
    return sorted.map((item) => {
      const row: Record<string, string | number> = {
        name:
          item.label.length > 30
            ? item.label.slice(0, 27) + "..."
            : item.label,
        fullName: item.label,
        naics: item.naics,
      };
      for (const rd of regionsLQData) {
        row[rd.region.fips] = item.lqs[rd.region.fips] ?? 0;
      }
      return row;
    });
  }, [regionsLQData]);

  // Build stacked bar data for employment structure
  const structureData = useMemo(() => {
    const validData = regionsLQData.filter((r) => r.lqData);
    if (validData.length === 0) return [];

    return validData.map((rd) => {
      if (!rd.lqData) return { name: rd.region.county_name };
      const total = rd.lqData.total_employment;
      const row: Record<string, string | number> = {
        name: rd.region.county_name,
      };
      // Get top industries by employment share
      const industries = [...rd.lqData.industries]
        .sort((a, b) => b.employment - a.employment)
        .slice(0, 8);
      let otherShare = 1;
      for (const ind of industries) {
        const share = total > 0 ? (ind.employment / total) * 100 : 0;
        row[ind.naics_label] = Number(share.toFixed(1));
        otherShare -= ind.employment / total;
      }
      row["Other"] = Number((Math.max(0, otherShare) * 100).toFixed(1));
      return row;
    });
  }, [regionsLQData]);

  // Get unique industry labels for the stacked chart
  const structureIndustries = useMemo(() => {
    if (structureData.length === 0) return [];
    const keys = new Set<string>();
    for (const row of structureData) {
      for (const key of Object.keys(row)) {
        if (key !== "name") keys.add(key);
      }
    }
    return Array.from(keys);
  }, [structureData]);

  // Color palette for industry structure stacked chart
  const STRUCTURE_COLORS = [
    "#3b82f6",
    "#f59e0b",
    "#22c55e",
    "#a855f7",
    "#ef4444",
    "#06b6d4",
    "#f97316",
    "#84cc16",
    "#94a3b8",
  ];

  return (
    <div className="space-y-6">
      {/* LQ Comparison - Grouped Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              LQ Comparison
            </CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">
                NAICS Level
              </label>
              <Select
                value={String(naicsLevel)}
                onValueChange={(v) => onNaicsLevelChange(Number(v))}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAICS_LEVELS.map((lvl) => (
                    <SelectItem key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Top 10 industries by average LQ across selected regions
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full rounded-lg" />
          ) : groupedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={groupedData}
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
                  dataKey="name"
                  width={170}
                  tick={{ fontSize: 11, fill: "#334155" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload as Record<string, string | number>;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-md">
                        <p className="font-semibold text-slate-900">
                          {d.fullName}
                        </p>
                        <p className="mb-1 text-xs text-slate-500">
                          NAICS: {d.naics}
                        </p>
                        {regionsLQData.map((rd, i) => (
                          <p
                            key={rd.region.fips}
                            style={{ color: REGION_COLORS[i] }}
                          >
                            {rd.region.county_name}: LQ{" "}
                            {typeof d[rd.region.fips] === "number"
                              ? (d[rd.region.fips] as number).toFixed(2)
                              : "N/A"}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend
                  formatter={(_, __, index) => (
                    <span className="text-xs text-slate-600">
                      {regionsLQData[index]?.region.county_name ?? ""}
                    </span>
                  )}
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
                {regionsLQData.map((rd, i) => (
                  <Bar
                    key={rd.region.fips}
                    dataKey={rd.region.fips}
                    fill={REGION_COLORS[i]}
                    name={rd.region.county_name}
                    radius={[0, 2, 2, 0]}
                    animationDuration={800}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              No LQ data available for comparison.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Industry Structure - Stacked Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Industry Structure
          </CardTitle>
          <p className="text-sm text-slate-500">
            Employment share by industry — compare how each region&apos;s
            economy is composed
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : structureData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={structureData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12, fill: "#334155" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}%`,
                    String(name),
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                />
                {structureIndustries.map((industry, i) => (
                  <Bar
                    key={industry}
                    dataKey={industry}
                    stackId="structure"
                    fill={STRUCTURE_COLORS[i % STRUCTURE_COLORS.length]}
                    name={
                      industry.length > 25
                        ? industry.slice(0, 22) + "..."
                        : industry
                    }
                    animationDuration={800}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              No industry structure data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
