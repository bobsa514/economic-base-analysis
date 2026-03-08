"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ArrowUpDown, ChevronUp, ChevronDown, HelpCircle } from "lucide-react";
import { useLQAnalysis } from "@/hooks/use-api";
import LQBarChart from "@/components/charts/lq-bar-chart";
import type { LQIndustry } from "@/types";

interface LQTabProps {
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

// Explanatory tooltips for column headers
const COLUMN_TOOLTIPS: Record<string, string> = {
  local_share:
    "The percentage of local employment in this industry. Local Share = Industry Employment / Total Local Employment.",
  national_share:
    "The percentage of national employment in this industry. National Share = National Industry Employment / Total National Employment.",
  lq: 'Measures industry concentration vs national average. LQ = Local Share / National Share. LQ > 1 means more concentrated locally (a "basic" industry that exports goods/services).',
};

// Preset LQ filter options
const LQ_PRESETS = [
  { value: "all", label: "All LQ Values" },
  { value: "basic", label: "LQ > 1 (Basic)" },
  { value: "specialized", label: "LQ > 1.5 (Highly Specialized)" },
  { value: "non-basic", label: "LQ < 1 (Non-Basic)" },
];

type SortField =
  | "naics_label"
  | "naics"
  | "employment"
  | "lq"
  | "local_share"
  | "national_share";
type SortDir = "asc" | "desc";

/**
 * LQ Tab content: year/NAICS selectors, filters, horizontal bar chart, and sortable data table.
 * Includes explanatory tooltips on column headers and employment/LQ filters.
 */
export default function LQTab({ fips, geoType }: LQTabProps) {
  const [year, setYear] = useState(2023);
  const [naicsLevel, setNaicsLevel] = useState(2);
  const [sortField, setSortField] = useState<SortField>("lq");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filter state
  const [minEmployment, setMinEmployment] = useState<string>("");
  const [lqPreset, setLqPreset] = useState("all");
  const [minLQ, setMinLQ] = useState<string>("");
  const [maxLQ, setMaxLQ] = useState<string>("");

  const { data, isLoading, isError, error } = useLQAnalysis(
    fips,
    year,
    naicsLevel,
    geoType
  );

  // Apply filters then sort
  const filteredAndSortedIndustries = useMemo(() => {
    if (!data?.industries) return [];

    let filtered = [...data.industries];

    // Min employment filter
    const minEmp = Number(minEmployment);
    if (minEmployment && !isNaN(minEmp)) {
      filtered = filtered.filter((ind) => ind.employment >= minEmp);
    }

    // LQ filter — preset takes precedence over manual min/max
    if (lqPreset === "basic") {
      filtered = filtered.filter((ind) => ind.lq > 1);
    } else if (lqPreset === "specialized") {
      filtered = filtered.filter((ind) => ind.lq > 1.5);
    } else if (lqPreset === "non-basic") {
      filtered = filtered.filter((ind) => ind.lq < 1);
    } else {
      // Manual LQ range when preset is "all"
      const minLQVal = Number(minLQ);
      const maxLQVal = Number(maxLQ);
      if (minLQ && !isNaN(minLQVal)) {
        filtered = filtered.filter((ind) => ind.lq >= minLQVal);
      }
      if (maxLQ && !isNaN(maxLQVal)) {
        filtered = filtered.filter((ind) => ind.lq <= maxLQVal);
      }
    }

    // Sort
    return filtered.sort((a, b) => {
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
  }, [data?.industries, sortField, sortDir, minEmployment, lqPreset, minLQ, maxLQ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-slate-400" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3 text-blue-600" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3 text-blue-600" />
    );
  };

  /** Color badge for LQ value */
  const lqBadge = (lq: number) => {
    if (lq >= 1.5)
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {lq.toFixed(2)}
        </Badge>
      );
    if (lq >= 1.0)
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          {lq.toFixed(2)}
        </Badge>
      );
    if (lq >= 0.5)
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          {lq.toFixed(2)}
        </Badge>
      );
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        {lq.toFixed(2)}
      </Badge>
    );
  };

  /** Renders a column header label, optionally with an info tooltip */
  const ColumnHeader = ({
    field,
    label,
    tooltip,
  }: {
    field: SortField;
    label: string;
    tooltip?: string;
  }) => (
    <th
      className="cursor-pointer px-4 py-3 text-left font-medium text-slate-600 select-none hover:text-slate-900"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger
              onClick={(e) => e.stopPropagation()}
              className="inline-flex"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-blue-500" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
        <SortIcon field={field} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Selectors row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="year-select"
            className="text-sm font-medium text-slate-700"
          >
            Year
          </label>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger id="year-select" className="w-28">
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
          <label
            htmlFor="naics-select"
            className="text-sm font-medium text-slate-700"
          >
            NAICS Level
          </label>
          <Select
            value={String(naicsLevel)}
            onValueChange={(v) => setNaicsLevel(Number(v))}
          >
            <SelectTrigger id="naics-select" className="w-56">
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

        {data && (
          <span className="ml-auto text-sm text-slate-500">
            Total employment:{" "}
            <strong className="text-slate-700">
              {data.total_employment.toLocaleString()}
            </strong>
          </span>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            Min Employment
          </label>
          <Input
            type="number"
            placeholder="e.g. 100"
            value={minEmployment}
            onChange={(e) => setMinEmployment(e.target.value)}
            className="h-8 w-32 bg-white text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            LQ Filter
          </label>
          <Select value={lqPreset} onValueChange={(v) => setLqPreset(v ?? "all")}>
            <SelectTrigger className="h-8 w-52 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LQ_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Manual LQ range — only visible when preset is "All" */}
        {lqPreset === "all" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                Min LQ
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={minLQ}
                onChange={(e) => setMinLQ(e.target.value)}
                className="h-8 w-24 bg-white text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                Max LQ
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="10.0"
                value={maxLQ}
                onChange={(e) => setMaxLQ(e.target.value)}
                className="h-8 w-24 bg-white text-sm"
              />
            </div>
          </>
        )}

        {data && (
          <span className="ml-auto text-xs text-slate-400">
            Showing {filteredAndSortedIndustries.length} of{" "}
            {data.industries.length} industries
          </span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load LQ data:{" "}
          {(error as Error)?.message || "Unknown error"}
        </div>
      )}

      {/* Data suppression warning for ZIP codes */}
      {data &&
        geoType === "zip" &&
        data.industries.length > 0 &&
        data.industries.every((ind) => ind.employment === 0) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">
              Industry-level employment data is suppressed for this ZIP code
            </p>
            <p className="mt-1 text-amber-600">
              The Census Bureau suppresses individual industry employment at the
              ZIP code level to protect business confidentiality. Total
              employment ({data.total_employment.toLocaleString()}) is available
              but individual industry breakdowns are not. Try searching for the
              county or metro area that contains this ZIP for detailed industry
              data.
            </p>
          </div>
        )}

      {/* Chart — uses filtered data */}
      {data && filteredAndSortedIndustries.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Top Industries by Location Quotient
          </h3>
          <LQBarChart industries={filteredAndSortedIndustries} maxItems={15} />
        </div>
      )}

      {/* Data table */}
      {data && filteredAndSortedIndustries.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <ColumnHeader field="naics_label" label="Industry" />
                <ColumnHeader field="naics" label="NAICS" />
                <ColumnHeader field="employment" label="Employment" />
                <ColumnHeader
                  field="lq"
                  label="LQ"
                  tooltip={COLUMN_TOOLTIPS.lq}
                />
                <ColumnHeader
                  field="local_share"
                  label="Local Share %"
                  tooltip={COLUMN_TOOLTIPS.local_share}
                />
                <ColumnHeader
                  field="national_share"
                  label="National Share %"
                  tooltip={COLUMN_TOOLTIPS.national_share}
                />
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedIndustries.map((ind: LQIndustry) => (
                <tr
                  key={ind.naics}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="max-w-xs truncate px-4 py-2.5 font-medium text-slate-900">
                    {ind.naics_label}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                    {ind.naics}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {ind.employment.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {lqBadge(ind.lq)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {(ind.local_share * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {(ind.national_share * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state — after filtering */}
      {data &&
        data.industries.length > 0 &&
        filteredAndSortedIndustries.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No industries match the current filters. Try adjusting your criteria.
          </div>
        )}

      {/* Empty state — no data at all */}
      {data && data.industries.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          No industry data available for this selection.
        </div>
      )}
    </div>
  );
}
