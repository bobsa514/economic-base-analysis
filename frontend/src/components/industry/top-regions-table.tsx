"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRegionInfo } from "@/hooks/use-api";
import type { MapDataPoint } from "@/types";

interface TopRegionsTableProps {
  /** Top regions sorted by LQ descending */
  topRegions: MapDataPoint[];
  /** Whether the parent is still loading map data */
  isLoading: boolean;
}

/**
 * Small component that fetches and displays a county name from its FIPS code.
 * Uses React Query caching so repeated lookups are instant.
 */
function CountyName({ fips }: { fips: string }) {
  const { data, isLoading } = useRegionInfo(fips);
  if (isLoading) return <Skeleton className="h-4 w-32" />;
  if (!data) return <span className="text-slate-400">{fips}</span>;
  return (
    <Link
      href={`/explore/${fips}`}
      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
    >
      {data.county_name}
    </Link>
  );
}

/**
 * Small component that fetches and displays a state name from FIPS.
 */
function StateName({ fips }: { fips: string }) {
  const { data, isLoading } = useRegionInfo(fips);
  if (isLoading) return <Skeleton className="h-4 w-16" />;
  if (!data) return <span className="text-slate-400">--</span>;
  return <span className="text-slate-600">{data.state_name}</span>;
}

/**
 * Table showing the top 20 counties/regions with highest LQ for a specific industry.
 * County names are fetched individually via React Query (cached).
 */
export default function TopRegionsTable({
  topRegions,
  isLoading,
}: TopRegionsTableProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Top Regions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">
          Top 20 Counties by LQ
        </CardTitle>
        <p className="text-sm text-slate-500">
          Counties with highest specialization in this industry
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left font-medium text-slate-500">
                  #
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-500">
                  County
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-500">
                  State
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">
                  Employment
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">
                  LQ
                </th>
              </tr>
            </thead>
            <tbody>
              {topRegions.map((region, i) => (
                <tr
                  key={region.fips}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <CountyName fips={region.fips} />
                  </td>
                  <td className="px-3 py-2">
                    <StateName fips={region.fips} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                    {region.employment != null
                      ? region.employment.toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {region.value != null ? (
                      <Badge
                        className={`${
                          region.value >= 1.5
                            ? "bg-green-100 text-green-800"
                            : region.value >= 1.0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                        } hover:bg-current`}
                      >
                        {region.value.toFixed(2)}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
