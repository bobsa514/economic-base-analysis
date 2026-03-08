"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useNAICSCodes, useTrends } from "@/hooks/use-api";

interface TrendsTabProps {
  fips: string;
  geoType?: string;
}

// Year range for trends
const START_YEAR = 2012;
const END_YEAR = 2023;
// Colors for multi-line overlay (up to 3 industries)
const LINE_COLORS = ["#3b82f6", "#f59e0b", "#22c55e"];

type MetricView = "employment" | "establishments" | "payroll";

/**
 * Industry Trends tab.
 * Shows employment, establishments, and payroll trends over time.
 * Supports overlaying up to 3 industries for comparison.
 */
export default function TrendsTab({ fips, geoType }: TrendsTabProps) {
  const [naicsLevel, setNaicsLevel] = useState(2);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [metricView, setMetricView] = useState<MetricView>("employment");

  // Fetch NAICS code list for the dropdown
  const { data: naicsList } = useNAICSCodes(naicsLevel);

  // Fetch trends for each selected industry (up to 3)
  const trend1 = useTrends(
    fips,
    selectedCodes[0] ?? "",
    START_YEAR,
    END_YEAR,
    geoType
  );
  const trend2 = useTrends(
    fips,
    selectedCodes[1] ?? "",
    START_YEAR,
    END_YEAR,
    geoType
  );
  const trend3 = useTrends(
    fips,
    selectedCodes[2] ?? "",
    START_YEAR,
    END_YEAR,
    geoType
  );

  const trends = [trend1, trend2, trend3].slice(0, selectedCodes.length);
  const isLoading = trends.some((t) => t.isLoading);
  const hasError = trends.some((t) => t.isError);

  // Build combined chart data: one row per year, with columns for each industry
  const chartData = useMemo(() => {
    if (selectedCodes.length === 0) return [];

    // Collect all years across all trends
    const yearSet = new Set<number>();
    trends.forEach((t) => {
      t.data?.data.forEach((p) => yearSet.add(p.year));
    });

    const years = Array.from(yearSet).sort((a, b) => a - b);

    return years.map((year) => {
      const row: Record<string, number | null | string> = { year: String(year) };
      trends.forEach((t, i) => {
        const point = t.data?.data.find((p) => p.year === year);
        if (metricView === "employment") {
          row[`industry_${i}`] = point?.employment ?? null;
        } else if (metricView === "establishments") {
          row[`industry_${i}`] = point?.establishments ?? null;
        } else {
          row[`industry_${i}`] = point?.annual_payroll ?? null;
        }
      });
      return row;
    });
  }, [selectedCodes.length, trends, metricView]);

  // Labels for the legend
  const industryLabels = trends.map(
    (t, i) => t.data?.naics_label ?? selectedCodes[i] ?? ""
  );

  const addIndustry = (code: string) => {
    if (selectedCodes.length >= 3 || selectedCodes.includes(code)) return;
    setSelectedCodes([...selectedCodes, code]);
  };

  const removeIndustry = (code: string) => {
    setSelectedCodes(selectedCodes.filter((c) => c !== code));
  };

  const metricLabel =
    metricView === "employment"
      ? "Employment"
      : metricView === "establishments"
        ? "Establishments"
        : "Annual Payroll ($)";

  const NAICS_LEVELS = [
    { value: "2", label: "2-digit (Sector)" },
    { value: "3", label: "3-digit (Subsector)" },
    { value: "4", label: "4-digit (Industry Group)" },
    { value: "5", label: "5-digit (Industry)" },
    { value: "6", label: "6-digit (National Industry)" },
  ];

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* NAICS Level */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            NAICS Level
          </label>
          <Select
            value={String(naicsLevel)}
            onValueChange={(v) => {
              setNaicsLevel(Number(v));
              setSelectedCodes([]); // Reset selections when level changes
            }}
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

        {/* Industry selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            Add Industry
          </label>
          <Select
            value=""
            onValueChange={(v) => { if (v) addIndustry(v); }}
            disabled={selectedCodes.length >= 3}
          >
            <SelectTrigger className="w-72">
              <SelectValue
                placeholder={
                  selectedCodes.length >= 3
                    ? "Max 3 industries"
                    : "Select an industry..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {naicsList?.codes
                .filter((c) => !selectedCodes.includes(c.code))
                .map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metric toggle */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Metric</label>
          <Select
            value={metricView}
            onValueChange={(v) => setMetricView(v as MetricView)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employment">Employment</SelectItem>
              <SelectItem value="establishments">Establishments</SelectItem>
              <SelectItem value="payroll">Annual Payroll</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected industries as removable badges */}
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCodes.map((code, i) => (
            <Badge
              key={code}
              className="gap-1 px-3 py-1 text-white"
              style={{ backgroundColor: LINE_COLORS[i] }}
            >
              {code} - {industryLabels[i] || code}
              <button
                onClick={() => removeIndustry(code)}
                className="ml-1 rounded-full hover:bg-white/20"
                aria-label={`Remove ${code}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Empty state when no industry selected */}
      {selectedCodes.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
          <p className="text-base font-medium">Select an industry to view trends</p>
          <p className="mt-1 text-sm">
            You can compare up to 3 industries at once
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && selectedCodes.length > 0 && (
        <Skeleton className="h-[400px] w-full rounded-lg" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load trend data for one or more industries.
        </div>
      )}

      {/* Chart */}
      {selectedCodes.length > 0 && !isLoading && chartData.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {metricLabel} Over Time ({START_YEAR}-{END_YEAR})
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(v: number) => {
                  if (metricView === "payroll") {
                    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
                    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
                    return `$${v}`;
                  }
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                  return String(v);
                }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-md">
                      <p className="font-semibold text-slate-900">{label}</p>
                      {payload.map((entry, i) => (
                        <p key={i} style={{ color: entry.color }}>
                          {industryLabels[i]}:{" "}
                          {metricView === "payroll"
                            ? `$${(entry.value as number)?.toLocaleString() ?? "N/A"}`
                            : (entry.value as number)?.toLocaleString() ?? "N/A"}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(_, __, index) => (
                  <span className="text-xs text-slate-600">
                    {industryLabels[index] ?? `Industry ${index + 1}`}
                  </span>
                )}
              />
              {selectedCodes.map((_, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={`industry_${i}`}
                  stroke={LINE_COLORS[i]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: LINE_COLORS[i] }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  animationDuration={800}
                  name={industryLabels[i]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data tables for each selected industry */}
      {trends.map(
        (t, i) =>
          t.data && (
            <div
              key={selectedCodes[i]}
              className="overflow-x-auto rounded-lg border border-slate-200"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
                <h4 className="text-sm font-semibold text-slate-700">
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[i] }}
                  />
                  {t.data.naics} - {t.data.naics_label}
                </h4>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left font-medium text-slate-600">
                      Year
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">
                      Employment
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">
                      Establishments
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">
                      Annual Payroll
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {t.data.data.map((point) => (
                    <tr
                      key={point.year}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {point.year}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                        {point.employment?.toLocaleString() ?? "N/A"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                        {point.establishments?.toLocaleString() ?? "N/A"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                        {point.annual_payroll != null
                          ? `$${point.annual_payroll.toLocaleString()}`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}
    </div>
  );
}
