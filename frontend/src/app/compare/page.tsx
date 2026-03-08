"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, ChevronRight, GitCompareArrows } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRegionInfo,
  useDemographics,
  useDiversification,
  useMultiplier,
  useLQAnalysis,
} from "@/hooks/use-api";
import RegionSelector from "@/components/compare/region-selector";
import ComparisonTable from "@/components/compare/comparison-table";
import LQComparisonChart from "@/components/compare/lq-comparison-chart";
import type { CountyInfo } from "@/types";

/** Default year for all analysis queries */
const DEFAULT_YEAR = 2023;
/** Default NAICS level for LQ comparison */
const DEFAULT_NAICS_LEVEL = 2;

/** A region entry with its geographic type */
interface RegionEntry {
  fips: string;
  geoType?: string;
}

/**
 * Hook that fetches all comparison data for a single region.
 * Returns demographics, diversification, multiplier, and LQ data.
 * Passes geoType through so MSA/ZIP queries use the correct Census API geography.
 */
function useRegionCompareData(fips: string, naicsLevel: number, geoType?: string) {
  const regionInfo = useRegionInfo(fips, geoType);
  // ACS demographics not available at ZIP level — disable query
  const demographics = useDemographics(
    geoType === "zip" ? "" : fips,
    undefined,
    geoType
  );
  const diversification = useDiversification(fips, DEFAULT_YEAR, geoType);
  const multiplier = useMultiplier(fips, DEFAULT_YEAR, geoType);
  const lq = useLQAnalysis(fips, DEFAULT_YEAR, naicsLevel, geoType);

  return {
    regionInfo,
    demographics,
    diversification,
    multiplier,
    lq,
    isLoading:
      regionInfo.isLoading ||
      demographics.isLoading ||
      diversification.isLoading ||
      multiplier.isLoading ||
      lq.isLoading,
  };
}

/**
 * Inner component that uses searchParams (needs Suspense boundary).
 */
function ComparePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse initial region entries from URL (format: fips or fips:geo)
  const [regionEntries, setRegionEntries] = useState<RegionEntry[]>(() => {
    const param = searchParams.get("regions");
    if (param) {
      return param
        .split(",")
        .filter(Boolean)
        .slice(0, 4)
        .map((s) => {
          const [fips, geo] = s.split(":");
          return { fips, geoType: geo || undefined };
        });
    }
    return [];
  });

  // Track resolved region info from the API
  const [regions, setRegions] = useState<CountyInfo[]>([]);

  // Fetch data for each region slot (up to 4), passing geoType
  const r0 = useRegionCompareData(regionEntries[0]?.fips ?? "", DEFAULT_NAICS_LEVEL, regionEntries[0]?.geoType);
  const r1 = useRegionCompareData(regionEntries[1]?.fips ?? "", DEFAULT_NAICS_LEVEL, regionEntries[1]?.geoType);
  const r2 = useRegionCompareData(regionEntries[2]?.fips ?? "", DEFAULT_NAICS_LEVEL, regionEntries[2]?.geoType);
  const r3 = useRegionCompareData(regionEntries[3]?.fips ?? "", DEFAULT_NAICS_LEVEL, regionEntries[3]?.geoType);
  const allData = [r0, r1, r2, r3].slice(0, regionEntries.length);

  // Sync region info from API responses back into the regions list
  useEffect(() => {
    const newRegions: CountyInfo[] = [];
    for (let i = 0; i < regionEntries.length; i++) {
      const data = [r0, r1, r2, r3][i];
      if (data?.regionInfo.data) {
        newRegions.push(data.regionInfo.data);
      }
    }
    if (
      newRegions.length > 0 &&
      newRegions.length >= regions.length
    ) {
      setRegions(newRegions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    r0.regionInfo.data,
    r1.regionInfo.data,
    r2.regionInfo.data,
    r3.regionInfo.data,
    regionEntries.length,
  ]);

  // Update URL when regions change (encode geoType as fips:geo)
  const updateURL = useCallback(
    (entries: RegionEntry[]) => {
      if (entries.length === 0) {
        router.replace("/compare");
      } else {
        const param = entries
          .map((e) => (e.geoType ? `${e.fips}:${e.geoType}` : e.fips))
          .join(",");
        router.replace(`/compare?regions=${param}`);
      }
    },
    [router]
  );

  const handleAddRegion = useCallback(
    (region: CountyInfo, geoType?: string) => {
      if (regionEntries.some((e) => e.fips === region.fips) || regionEntries.length >= 4) return;
      const newEntries = [...regionEntries, { fips: region.fips, geoType }];
      setRegionEntries(newEntries);
      setRegions((prev) => [...prev, region]);
      updateURL(newEntries);
    },
    [regionEntries, updateURL]
  );

  const handleRemoveRegion = useCallback(
    (fips: string) => {
      const newEntries = regionEntries.filter((e) => e.fips !== fips);
      setRegionEntries(newEntries);
      setRegions((prev) => prev.filter((r) => r.fips !== fips));
      updateURL(newEntries);
    },
    [regionEntries, updateURL]
  );

  // Build data arrays for child components
  const regionsForTable = allData
    .filter((_, i) => i < regions.length)
    .map((d, i) => ({
      region: regions[i],
      demographics: d.demographics.data ?? null,
      diversification: d.diversification.data ?? null,
      multiplier: d.multiplier.data ?? null,
      isLoading: d.isLoading,
    }));

  const regionsForLQ = allData
    .filter((_, i) => i < regions.length)
    .map((d, i) => ({
      region: regions[i],
      lqData: d.lq.data ?? null,
      isLoading: d.lq.isLoading,
    }));

  const hasEnoughRegions = regions.length >= 2;

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
        <span className="font-medium text-slate-900">Compare</span>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-50 p-2">
            <GitCompareArrows className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Multi-Region Comparison
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Compare economic profiles across up to 4 regions side by side
            </p>
          </div>
        </div>
      </div>

      {/* Region selector */}
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <RegionSelector
          regions={regions}
          onAdd={handleAddRegion}
          onRemove={handleRemoveRegion}
        />
      </div>

      {/* Comparison content — only shown when 2+ regions */}
      {!hasEnoughRegions && regions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
          <p className="text-base font-medium">Add at least 2 regions to compare</p>
          <p className="mt-1 text-sm">
            Use the search bar above to add more regions
          </p>
        </div>
      )}

      {regions.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
          <p className="text-base font-medium">
            Select regions to start comparing
          </p>
          <p className="mt-1 text-sm">
            Click &quot;Add Region&quot; above to search and add counties
          </p>
        </div>
      )}

      {/* Loading indicator while resolving regions from URL params */}
      {regionEntries.length > 0 && regions.length === 0 && (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      )}

      {hasEnoughRegions && (
        <div className="space-y-6">
          {/* Overview comparison table */}
          <ComparisonTable regionsData={regionsForTable} />

          {/* LQ comparison + industry structure charts */}
          <LQComparisonChart regionsLQData={regionsForLQ} />
        </div>
      )}
    </div>
  );
}

/**
 * Compare page — allows side-by-side comparison of up to 4 regions.
 * Wrapped in Suspense because useSearchParams requires it in Next.js 14+.
 */
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <ComparePageInner />
    </Suspense>
  );
}
