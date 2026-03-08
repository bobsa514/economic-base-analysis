"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useMapData, useNAICSCodes, useAvailableYears } from "@/hooks/use-api";
import { Loader2 } from "lucide-react";

/**
 * Client-side wrapper that dynamically imports the US county map with SSR disabled.
 * Also provides map controls (metric selector, NAICS industry picker, year selector)
 * and handles data fetching via React Query.
 */
const USCountyMap = dynamic(() => import("@/components/map/us-county-map"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[500px] items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      Loading map...
    </div>
  ),
});

type Metric = "employment" | "lq";

export default function MapSection() {
  // Control state
  const [metric, setMetric] = useState<Metric>("employment");
  const [selectedNaics, setSelectedNaics] = useState<string>("00"); // "00" = total/all industries
  const [selectedYear, setSelectedYear] = useState<number>(2023);

  // Fetch available years so the year selector has valid options
  const { data: yearsData } = useAvailableYears();
  const cbpYears = useMemo(
    () => (yearsData?.cbp_years ?? [2023]).sort((a, b) => b - a),
    [yearsData]
  );

  // Fetch 2-digit NAICS codes for the industry dropdown
  const { data: naicsData } = useNAICSCodes(2, selectedYear);
  const naicsCodes = useMemo(() => naicsData?.codes ?? [], [naicsData]);

  // Fetch map data from the backend
  const {
    data: mapData,
    isLoading,
    isError,
    error,
  } = useMapData(selectedYear, selectedNaics, metric);

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        {/* Metric selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Metric</label>
          <div className="flex rounded-md border border-slate-200">
            <button
              onClick={() => {
                setMetric("employment");
                setSelectedNaics("00"); // reset to total for employment
              }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                metric === "employment"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              } rounded-l-md`}
            >
              Employment
            </button>
            <button
              onClick={() => setMetric("lq")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                metric === "lq"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              } rounded-r-md`}
            >
              Location Quotient
            </button>
          </div>
        </div>

        {/* Industry selector — shown for LQ, or employment with specific industry */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="naics-select"
            className="text-xs font-medium text-slate-500"
          >
            Industry
          </label>
          <select
            id="naics-select"
            value={selectedNaics}
            onChange={(e) => setSelectedNaics(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          >
            <option value="00">All Industries</option>
            {naicsCodes.map((n) => (
              <option key={n.code} value={n.code}>
                {n.code} - {n.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="year-select"
            className="text-xs font-medium text-slate-500"
          >
            Year
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          >
            {cbpYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Loading indicator in the controls bar */}
        {isLoading && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Fetching...</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {isError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
          Failed to load map data: {error instanceof Error ? error.message : "Unknown error"}.
          The map shows county boundaries without data coloring.
        </div>
      )}

      {/* Map */}
      <USCountyMap
        mapData={mapData ?? null}
        metric={metric}
        isLoading={isLoading}
      />
    </div>
  );
}
