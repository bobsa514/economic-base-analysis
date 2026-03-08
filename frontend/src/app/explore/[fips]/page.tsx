"use client";

import { use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import OverviewCards from "@/components/explore/overview-cards";
import LQTab from "@/components/explore/lq-tab";
import ShiftShareTab from "@/components/explore/shift-share-tab";
import TrendsTab from "@/components/explore/trends-tab";
import DemographicsTab from "@/components/explore/demographics-tab";
import { useRegionInfo, useDemographics, useDiversification } from "@/hooks/use-api";

/**
 * Inner component that reads geo type from URL search params.
 * Needs to be wrapped in Suspense because useSearchParams requires it.
 */
function ExplorePageInner({ fips }: { fips: string }) {
  const searchParams = useSearchParams();
  // Read geo_type from URL: ?geo=msa for Metro Areas, ?geo=zip for ZIP Codes
  const geoParam = searchParams.get("geo");
  const geoType =
    geoParam === "msa" ? "msa" : geoParam === "zip" ? "zip" : undefined;

  const { data: regionInfo, isLoading: regionLoading } = useRegionInfo(fips, geoType);
  // ACS demographics not available at ZIP level — disable the query by passing empty fips
  const { data: demographics, isLoading: demoLoading } =
    useDemographics(geoType === "zip" ? "" : fips, undefined, geoType);
  const { data: diversification, isLoading: divLoading } =
    useDiversification(fips, 2023, geoType);

  const isLoading = regionLoading || demoLoading || divLoading;

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
        {regionLoading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <span className="font-medium text-slate-900">
            {regionInfo
              ? regionInfo.full_name
              : geoType === "zip"
                ? `ZIP Code ${fips}`
                : `FIPS ${fips}`}
          </span>
        )}
      </nav>

      {/* Page title with geo type badge */}
      <div className="mb-6">
        {regionLoading ? (
          <>
            <Skeleton className="mb-2 h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {geoType === "zip"
                  ? regionInfo
                    ? regionInfo.full_name
                    : `ZIP Code ${fips}`
                  : regionInfo
                    ? regionInfo.full_name
                    : `Region ${fips}`}
              </h1>
              {/* Show geo type badge when viewing an MSA or ZIP */}
              {geoType === "msa" && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 hover:bg-purple-100"
                >
                  Metro Area
                </Badge>
              )}
              {geoType === "zip" && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                >
                  ZIP Code
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {geoType === "zip" ? `ZIP: ${fips}` : `FIPS: ${fips}`} &middot;
              Economic profile and analysis
              {geoType === "msa" && " (Metropolitan Statistical Area)"}
              {geoType === "zip" && " (ZIP Code)"}
            </p>
          </>
        )}
      </div>

      {/* Overview cards */}
      <div className="mb-8">
        <OverviewCards
          population={demographics?.total_population}
          totalEmployment={diversification?.total_employment}
          medianIncome={demographics?.median_household_income}
          diversificationIndex={diversification?.diversification_index}
          isLoading={isLoading}
        />
      </div>

      {/* Analysis tabs */}
      <Tabs defaultValue="economic-base" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger
            value="economic-base"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600"
          >
            Economic Base
          </TabsTrigger>
          <TabsTrigger
            value="shift-share"
            className="data-[state=active]:bg-white"
          >
            Shift-Share
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="data-[state=active]:bg-white"
          >
            Industry Trends
          </TabsTrigger>
          <TabsTrigger
            value="demographics"
            className="data-[state=active]:bg-white"
          >
            Demographics
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Economic Base (LQ) */}
        <TabsContent value="economic-base">
          <LQTab fips={fips} geoType={geoType} />
        </TabsContent>

        {/* Tab 2: Shift-Share Analysis */}
        <TabsContent value="shift-share">
          <ShiftShareTab fips={fips} geoType={geoType} />
        </TabsContent>

        {/* Tab 3: Industry Trends */}
        <TabsContent value="trends">
          <TrendsTab fips={fips} geoType={geoType} />
        </TabsContent>

        {/* Tab 4: Demographics */}
        <TabsContent value="demographics">
          <DemographicsTab fips={fips} geoType={geoType} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Explore page for a specific county or MSA.
 * Shows overview cards, and tabbed analysis sections.
 *
 * Reads ?geo=msa from URL search params to determine geographic level.
 * Wrapped in Suspense for Next.js useSearchParams compatibility.
 */
export default function ExplorePage({
  params,
}: {
  params: Promise<{ fips: string }>;
}) {
  const { fips } = use(params);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-4 w-40" />
          <Skeleton className="mb-2 h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
      }
    >
      <ExplorePageInner fips={fips} />
    </Suspense>
  );
}
