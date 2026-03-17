"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { useShiftShare } from "@/hooks/use-api";
import type { ShiftShareIndustry } from "@/types";

interface ShiftShareTabProps {
  fips: string;
  geoType?: string;
}

// Available years for CBP data
const YEARS = Array.from({ length: 12 }, (_, i) => 2023 - i);
const NAICS_LEVELS = [
  { value: "2", label: "2-digit (Sector)" },
  { value: "3", label: "3-digit (Subsector)" },
  { value: "4", label: "4-digit (Industry Group)" },
  { value: "5", label: "5-digit (Industry)" },
  { value: "6", label: "6-digit (National Industry)" },
];

type SortField =
  | "naics_label"
  | "naics"
  | "employment_t0"
  | "employment_t1"
  | "actual_change"
  | "national_growth"
  | "industry_mix"
  | "regional_competitive";
type SortDir = "asc" | "desc";

/** Sort direction indicator icon for shift-share table */
function ShiftShareSortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown className="ml-1 inline h-3 w-3 text-slate-400" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-blue-600" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-blue-600" />
  );
}

/**
 * Formats a number with sign and commas for display.
 * e.g., 12345 -> "+12,345", -500 -> "-500"
 */
function formatChange(value: number): string {
  const formatted = Math.abs(value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Shift-Share Analysis tab.
 * Decomposes employment changes into:
 * - National Growth: how much local employment would have changed if it grew at the national rate
 * - Industry Mix: effect of the local industry composition vs national average
 * - Competitive Effect: the region's unique competitive advantage/disadvantage
 */
export default function ShiftShareTab({ fips, geoType }: ShiftShareTabProps) {
  const [yearStart, setYearStart] = useState(2018);
  const [yearEnd, setYearEnd] = useState(2023);
  const [naicsLevel, setNaicsLevel] = useState(2);
  const [sortField, setSortField] = useState<SortField>("actual_change");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading, isError, error } = useShiftShare(
    fips,
    yearStart,
    yearEnd,
    naicsLevel,
    geoType
  );

  // Sort the table data
  const sortedIndustries = useMemo(() => {
    if (!data?.industries) return [];
    return [...data.industries].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = aVal as number;
      const bNum = bVal as number;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [data, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Prepare stacked bar chart data (top 15 by absolute actual_change)
  const stackedData = useMemo(() => {
    if (!data?.industries) return [];
    return [...data.industries]
      .sort((a, b) => Math.abs(b.actual_change) - Math.abs(a.actual_change))
      .slice(0, 15)
      .map((ind) => ({
        name:
          ind.naics_label.length > 30
            ? ind.naics_label.slice(0, 27) + "..."
            : ind.naics_label,
        fullName: ind.naics_label,
        naics: ind.naics,
        national_growth: Math.round(ind.national_growth),
        industry_mix: Math.round(ind.industry_mix),
        regional_competitive: Math.round(ind.regional_competitive),
        actual_change: ind.actual_change,
      }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Selectors row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            Start Year
          </label>
          <Select
            value={String(yearStart)}
            onValueChange={(v) => setYearStart(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            End Year
          </label>
          <Select
            value={String(yearEnd)}
            onValueChange={(v) => setYearEnd(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            NAICS Level
          </label>
          <Select
            value={String(naicsLevel)}
            onValueChange={(v) => setNaicsLevel(Number(v))}
          >
            <SelectTrigger className="w-56">
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

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load shift-share data:{" "}
          {(error as Error)?.message || "Unknown error"}
        </div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              label="National Growth"
              value={data.summary.national_growth}
              color="text-blue-600"
              bgColor="bg-blue-50"
              description="If region grew at national rate"
            />
            <SummaryCard
              label="Industry Mix"
              value={data.summary.industry_mix}
              color="text-amber-600"
              bgColor="bg-amber-50"
              description="Effect of industry composition"
            />
            <SummaryCard
              label="Competitive Effect"
              value={data.summary.regional_competitive}
              color={
                data.summary.regional_competitive >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
              bgColor={
                data.summary.regional_competitive >= 0
                  ? "bg-green-50"
                  : "bg-red-50"
              }
              description="Regional competitive advantage"
            />
            <SummaryCard
              label="Total Change"
              value={data.summary.total_change}
              color="text-slate-800"
              bgColor="bg-slate-50"
              description={`${data.summary.year_start} to ${data.summary.year_end}`}
            />
          </div>

          {/* Waterfall chart: summary components */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Shift-Share Decomposition (Summary)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  {
                    name: "National Growth",
                    value: Math.round(data.summary.national_growth),
                    fill: "#3b82f6",
                  },
                  {
                    name: "Industry Mix",
                    value: Math.round(data.summary.industry_mix),
                    fill: "#f59e0b",
                  },
                  {
                    name: "Competitive Effect",
                    value: Math.round(data.summary.regional_competitive),
                    fill:
                      data.summary.regional_competitive >= 0
                        ? "#22c55e"
                        : "#ef4444",
                  },
                  {
                    name: "Total Change",
                    value: Math.round(data.summary.total_change),
                    fill: "#64748b",
                  },
                ]}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(v: number) =>
                    v >= 1000 || v <= -1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : String(v)
                  }
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip
                  formatter={(value) => [
                    formatChange(Number(value)),
                    "Employment",
                  ]}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800}>
                  {[
                    { fill: "#3b82f6" },
                    { fill: "#f59e0b" },
                    {
                      fill:
                        data.summary.regional_competitive >= 0
                          ? "#22c55e"
                          : "#ef4444",
                    },
                    { fill: "#64748b" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stacked bar chart by industry */}
          {stackedData.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Shift-Share Components by Industry (Top 15)
              </h3>
              <ResponsiveContainer
                width="100%"
                height={Math.max(400, stackedData.length * 32)}
              >
                <BarChart
                  data={stackedData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 180, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v: number) =>
                      v >= 1000 || v <= -1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : String(v)
                    }
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
                      const d = payload[0].payload as {
                        fullName: string;
                        naics: string;
                        national_growth: number;
                        industry_mix: number;
                        regional_competitive: number;
                        actual_change: number;
                      };
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-md">
                          <p className="font-semibold text-slate-900">
                            {d.fullName}
                          </p>
                          <p className="text-slate-500">NAICS: {d.naics}</p>
                          <div className="mt-1 space-y-0.5">
                            <p className="text-blue-600">
                              National Growth: {formatChange(d.national_growth)}
                            </p>
                            <p className="text-amber-600">
                              Industry Mix: {formatChange(d.industry_mix)}
                            </p>
                            <p
                              className={
                                d.regional_competitive >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              Competitive: {formatChange(d.regional_competitive)}
                            </p>
                            <p className="font-medium text-slate-800">
                              Total: {formatChange(d.actual_change)}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value: string) => (
                      <span className="text-xs text-slate-600">{value}</span>
                    )}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <Bar
                    dataKey="national_growth"
                    stackId="a"
                    fill="#3b82f6"
                    name="National Growth"
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="industry_mix"
                    stackId="a"
                    fill="#f59e0b"
                    name="Industry Mix"
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="regional_competitive"
                    stackId="a"
                    fill="#22c55e"
                    name="Competitive Effect"
                    radius={[0, 4, 4, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data table */}
          {data.industries.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {(
                      [
                        { field: "naics_label" as SortField, label: "Industry" },
                        { field: "naics" as SortField, label: "NAICS" },
                        {
                          field: "employment_t0" as SortField,
                          label: `Emp. ${data.summary.year_start}`,
                        },
                        {
                          field: "employment_t1" as SortField,
                          label: `Emp. ${data.summary.year_end}`,
                        },
                        {
                          field: "actual_change" as SortField,
                          label: "Change",
                        },
                        {
                          field: "national_growth" as SortField,
                          label: "Nat. Growth",
                        },
                        {
                          field: "industry_mix" as SortField,
                          label: "Ind. Mix",
                        },
                        {
                          field: "regional_competitive" as SortField,
                          label: "Competitive",
                        },
                      ] as { field: SortField; label: string }[]
                    ).map((col) => (
                      <th
                        key={col.field}
                        className="cursor-pointer px-3 py-3 text-left font-medium text-slate-600 select-none hover:text-slate-900"
                        onClick={() => handleSort(col.field)}
                      >
                        {col.label}
                        <ShiftShareSortIcon field={col.field} sortField={sortField} sortDir={sortDir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedIndustries.map((ind: ShiftShareIndustry) => (
                    <tr
                      key={ind.naics}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="max-w-xs truncate px-3 py-2.5 font-medium text-slate-900">
                        {ind.naics_label}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                        {ind.naics}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                        {ind.employment_t0.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                        {ind.employment_t1.toLocaleString()}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right tabular-nums font-medium ${
                          ind.actual_change >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatChange(ind.actual_change)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">
                        {formatChange(Math.round(ind.national_growth))}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-amber-700">
                        {formatChange(Math.round(ind.industry_mix))}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right tabular-nums ${
                          ind.regional_competitive >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatChange(Math.round(ind.regional_competitive))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {data.industries.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No industry data available for this selection.
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Summary card for shift-share components */
function SummaryCard({
  label,
  value,
  color,
  bgColor,
  description,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  description: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 ${bgColor} p-4`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>
        {formatChange(Math.round(value))}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{description}</p>
    </div>
  );
}
