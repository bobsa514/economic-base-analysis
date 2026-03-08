"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { REGION_COLORS } from "./region-selector";
import type {
  CountyInfo,
  DemographicsResponse,
  DiversificationResponse,
  MultiplierResponse,
} from "@/types";

interface RegionData {
  region: CountyInfo;
  demographics?: DemographicsResponse | null;
  diversification?: DiversificationResponse | null;
  multiplier?: MultiplierResponse | null;
  isLoading: boolean;
}

interface ComparisonTableProps {
  regionsData: RegionData[];
}

/**
 * Side-by-side metrics comparison table.
 * Shows key indicators (population, employment, income, diversification, multiplier)
 * for each selected region in a card-based layout.
 */
export default function ComparisonTable({ regionsData }: ComparisonTableProps) {
  // Format helpers
  const fmt = (v: number | null | undefined) =>
    v != null ? v.toLocaleString() : "N/A";
  const fmtDollar = (v: number | null | undefined) =>
    v != null ? `$${v.toLocaleString()}` : "N/A";
  const fmtDecimal = (v: number | null | undefined, digits = 2) =>
    v != null ? v.toFixed(digits) : "N/A";

  const metrics = [
    {
      label: "Population",
      getValue: (d: RegionData) => fmt(d.demographics?.total_population),
    },
    {
      label: "Employment",
      getValue: (d: RegionData) => fmt(d.diversification?.total_employment),
    },
    {
      label: "Median Income",
      getValue: (d: RegionData) =>
        fmtDollar(d.demographics?.median_household_income),
    },
    {
      label: "Diversification",
      getValue: (d: RegionData) =>
        fmtDecimal(d.diversification?.diversification_index, 3),
    },
    {
      label: "Multiplier",
      getValue: (d: RegionData) => fmtDecimal(d.multiplier?.multiplier, 1),
    },
    {
      label: "Median Age",
      getValue: (d: RegionData) => fmtDecimal(d.demographics?.median_age, 1),
    },
    {
      label: "Unemployment Rate",
      getValue: (d: RegionData) =>
        d.demographics?.unemployment_rate != null
          ? `${d.demographics.unemployment_rate.toFixed(1)}%`
          : "N/A",
    },
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">
          Overview Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Metric
                </th>
                {regionsData.map((rd, i) => (
                  <th
                    key={rd.region.fips}
                    className="px-4 py-3 text-right font-semibold"
                    style={{ color: REGION_COLORS[i] }}
                  >
                    {rd.region.county_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr
                  key={metric.label}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    {metric.label}
                  </td>
                  {regionsData.map((rd) => (
                    <td
                      key={rd.region.fips}
                      className="px-4 py-2.5 text-right tabular-nums text-slate-900"
                    >
                      {rd.isLoading ? (
                        <Skeleton className="ml-auto h-5 w-20" />
                      ) : (
                        metric.getValue(rd)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
