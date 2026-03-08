"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MapDataResponse } from "@/types";

/**
 * Dynamically import USCountyMap with SSR disabled.
 * The map component uses browser-only APIs (d3, SVG manipulation).
 */
const USCountyMap = dynamic(() => import("@/components/map/us-county-map"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[500px] items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      Loading map...
    </div>
  ),
});

interface IndustryMapProps {
  /** Map data response from the API */
  mapData: MapDataResponse | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message, if any */
  error?: string | null;
  /** Industry label for the header */
  industryLabel: string;
}

/**
 * Wrapper for the US county choropleth map, specialized for the Industry page.
 * Always shows LQ metric with a diverging color scale (red-yellow-green).
 */
export default function IndustryMap({
  mapData,
  isLoading,
  error,
  industryLabel,
}: IndustryMapProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">
          Geographic Distribution
        </CardTitle>
        <p className="text-sm text-slate-500">
          Location Quotient for {industryLabel} across all U.S. counties.
          Green = high specialization, Red = low.
        </p>
      </CardHeader>
      <CardContent>
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching map data...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Map — always use LQ metric */}
        <div className="min-h-[500px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <USCountyMap
            mapData={mapData}
            metric="lq"
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
