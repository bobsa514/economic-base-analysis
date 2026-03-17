"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ChevronRight, Factory, MapPin, BarChart3, Hash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMapData, useNAICSCodes } from "@/hooks/use-api";
import IndustryMap from "@/components/industry/industry-map";
import TopRegionsTable from "@/components/industry/top-regions-table";

/** Default year for industry data */
const DEFAULT_YEAR = 2023;

/** Available NAICS digit levels */
const NAICS_LEVELS = [2, 3, 4, 5, 6] as const;

/** Determine NAICS hierarchy level from a code string.
 *  Mirrors backend logic in cbp.py:get_naics_level. */
function getNaicsLevel(code: string): 2 | 3 | 4 | 5 | 6 {
  if (code.includes("-") || code.includes("/")) return 2;
  const len = code.length;
  if (len >= 2 && len <= 6) return len as 2 | 3 | 4 | 5 | 6;
  return 2; // fallback
}

/**
 * Industry page — shows how a specific NAICS industry is distributed
 * geographically across all U.S. counties.
 *
 * Displays:
 * 1. NAICS level selector and industry picker
 * 2. Choropleth map colored by LQ
 * 3. National overview cards (total employment, counties with LQ > 1, avg LQ)
 * 4. Top 20 counties by LQ
 */
export default function IndustryPage({
  params,
}: {
  params: Promise<{ naics: string }>;
}) {
  const { naics } = use(params);
  const router = useRouter();

  // Determine the current NAICS level from the code (handles hyphenated sectors like "31-33")
  const currentLevel = getNaicsLevel(naics);

  // Track the selected NAICS level for the level selector
  // Default to the level matching the current NAICS code
  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel);

  // Fetch NAICS codes for the current level (used by the industry switcher dropdown)
  const { data: naicsList } = useNAICSCodes(selectedLevel, DEFAULT_YEAR);

  // Also fetch 2-digit codes if the current level is different,
  // so we can still look up the industry label for the current code
  const { data: currentLevelList } = useNAICSCodes(currentLevel, DEFAULT_YEAR);

  // Fetch map data for this specific industry (LQ metric)
  const {
    data: mapData,
    isLoading: mapLoading,
    isError: mapError,
    error: mapErrorObj,
  } = useMapData(DEFAULT_YEAR, naics, "lq");

  // Look up the industry label from the appropriate NAICS codes list.
  // First try the list matching the current code's level, then fall back to
  // the selectedLevel list (in case the user just switched levels).
  const industryLabel = useMemo(() => {
    const lists = [currentLevelList, naicsList].filter(Boolean);
    for (const list of lists) {
      const found = list!.codes.find((c) => c.code === naics);
      if (found) return found.label;
    }
    return `NAICS ${naics}`;
  }, [currentLevelList, naicsList, naics]);

  // Compute summary stats from map data
  const summary = useMemo(() => {
    if (!mapData?.data) {
      return {
        totalEmployment: null,
        countiesAboveOne: null,
        avgLQ: null,
        totalCounties: null,
      };
    }

    let totalEmployment = 0;
    let countiesAboveOne = 0;
    let lqSum = 0;
    let lqCount = 0;

    for (const d of mapData.data) {
      if (d.employment != null) totalEmployment += d.employment;
      if (d.value != null) {
        lqSum += d.value;
        lqCount += 1;
        if (d.value > 1) countiesAboveOne += 1;
      }
    }

    return {
      totalEmployment,
      countiesAboveOne,
      avgLQ: lqCount > 0 ? lqSum / lqCount : null,
      totalCounties: mapData.data.length,
    };
  }, [mapData]);

  // Get top 20 counties by LQ
  const topRegions = useMemo(() => {
    if (!mapData?.data) return [];
    return [...mapData.data]
      .filter((d) => d.value != null && d.value > 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, 20);
  }, [mapData]);

  const handleIndustryChange = (newNaics: string | null) => {
    if (newNaics) router.push(`/industry/${newNaics}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-1 text-sm text-slate-500"
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Industry</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">{industryLabel}</span>
      </nav>

      {/* Page header with industry switcher */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-50 p-2">
            <Factory className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {industryLabel}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              NAICS {naics} &middot; Geographic distribution and specialization
            </p>
          </div>
        </div>

        {/* NAICS level selector + industry switcher */}
        <div className="flex flex-wrap items-end gap-3">
          {/* NAICS level (digit) selector */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              NAICS Level
            </label>
            <Select
              value={String(selectedLevel)}
              onValueChange={(val) => setSelectedLevel(Number(val))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {NAICS_LEVELS.map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    {level}-digit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Industry picker — populated by the selected NAICS level */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Switch Industry
            </label>
            <Select
              value={selectedLevel === currentLevel ? naics : ""}
              onValueChange={handleIndustryChange}
            >
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Select an industry..." />
              </SelectTrigger>
              <SelectContent>
                {naicsList?.codes.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* National Overview Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          title="National Employment"
          value={
            summary.totalEmployment != null
              ? summary.totalEmployment.toLocaleString()
              : undefined
          }
          isLoading={mapLoading}
          icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <OverviewCard
          title="Counties with LQ > 1"
          value={
            summary.countiesAboveOne != null
              ? summary.countiesAboveOne.toLocaleString()
              : undefined
          }
          isLoading={mapLoading}
          icon={<MapPin className="h-4 w-4 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <OverviewCard
          title="Average LQ"
          value={summary.avgLQ != null ? summary.avgLQ.toFixed(2) : undefined}
          isLoading={mapLoading}
          icon={<Hash className="h-4 w-4 text-amber-600" />}
          bgColor="bg-amber-50"
        />
        <OverviewCard
          title="Total Counties"
          value={
            summary.totalCounties != null
              ? summary.totalCounties.toLocaleString()
              : undefined
          }
          isLoading={mapLoading}
          icon={<MapPin className="h-4 w-4 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Map + Top Regions side by side on large screens */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map takes 2/3 width */}
        <div className="lg:col-span-2">
          <IndustryMap
            mapData={mapData ?? null}
            isLoading={mapLoading}
            error={
              mapError
                ? (mapErrorObj instanceof Error
                    ? mapErrorObj.message
                    : "Failed to load map data")
                : null
            }
            industryLabel={industryLabel}
          />
        </div>

        {/* Top Regions table takes 1/3 width */}
        <div>
          <TopRegionsTable
            topRegions={topRegions}
            isLoading={mapLoading}
          />
        </div>
      </div>
    </div>
  );
}

/** Overview card for national-level stats */
function OverviewCard({
  title,
  value,
  isLoading,
  icon,
  bgColor,
}: {
  title: string;
  value?: string;
  isLoading: boolean;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div className={`rounded-md p-2 ${bgColor}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : value != null ? (
          <span className="text-2xl font-bold text-slate-900">{value}</span>
        ) : (
          <span className="text-sm text-slate-400">N/A</span>
        )}
      </CardContent>
    </Card>
  );
}
