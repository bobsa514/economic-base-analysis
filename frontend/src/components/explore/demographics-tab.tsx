"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemographics } from "@/hooks/use-api";
import PopulationPyramid from "@/components/charts/population-pyramid";
import IncomeDistribution from "@/components/charts/income-distribution";
import EducationDonut from "@/components/charts/education-donut";

interface DemographicsTabProps {
  fips: string;
  geoType?: string;
}

// ACS years available — typically 2012-2023
const ACS_YEARS = Array.from({ length: 12 }, (_, i) => 2023 - i);

/**
 * Demographics tab showing population pyramid, income distribution,
 * and education attainment charts sourced from the American Community Survey.
 */
export default function DemographicsTab({ fips, geoType }: DemographicsTabProps) {
  const [year, setYear] = useState(2023);
  // ACS demographics not available at ZIP level — pass empty fips to disable the query
  const { data, isLoading, isError, error } = useDemographics(
    geoType === "zip" ? "" : fips,
    year,
    geoType
  );

  if (geoType === "zip") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-base font-medium text-amber-800">
          Demographics data is not available at the ZIP code level
        </p>
        <p className="mt-2 text-sm text-amber-600">
          The American Community Survey (ACS) provides demographic data at the
          county and metropolitan area level. Try searching for the county or
          metro area that contains this ZIP code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Year</label>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACS_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
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
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[350px] rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load demographics:{" "}
          {(error as Error)?.message || "Unknown error"}
        </div>
      )}

      {data && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Population"
              value={
                data.total_population != null
                  ? data.total_population.toLocaleString()
                  : "N/A"
              }
            />
            <StatCard
              label="Median Age"
              value={
                data.median_age != null ? data.median_age.toFixed(1) : "N/A"
              }
            />
            <StatCard
              label="Median Household Income"
              value={
                data.median_household_income != null
                  ? `$${data.median_household_income.toLocaleString()}`
                  : "N/A"
              }
            />
            <StatCard
              label="Unemployment Rate"
              value={
                data.unemployment_rate != null
                  ? `${data.unemployment_rate.toFixed(1)}%`
                  : "N/A"
              }
            />
          </div>

          {/* Additional stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              label="Employment-Population Ratio"
              value={
                data.employment_population_ratio != null
                  ? `${data.employment_population_ratio.toFixed(1)}%`
                  : "N/A"
              }
              small
            />
            <StatCard
              label="Graduate Degree (%)"
              value={
                data.pct_graduate_degree != null
                  ? `${data.pct_graduate_degree.toFixed(1)}%`
                  : "N/A"
              }
              small
            />
            <StatCard
              label="Data Year"
              value={String(data.year)}
              small
            />
          </div>

          {/* Chart sections: 3 columns on desktop, stacked on mobile */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Population Pyramid */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Population by Age & Sex
              </h3>
              {data.population_pyramid && data.population_pyramid.length > 0 ? (
                <PopulationPyramid data={data.population_pyramid} />
              ) : (
                <p className="py-12 text-center text-sm text-slate-400">
                  No population pyramid data available.
                </p>
              )}
            </div>

            {/* Education Donut */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Education Attainment
              </h3>
              {data.education && data.education.length > 0 ? (
                <EducationDonut data={data.education} />
              ) : (
                <p className="py-12 text-center text-sm text-slate-400">
                  No education data available.
                </p>
              )}
            </div>
          </div>

          {/* Income Distribution - full width */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Household Income Distribution
            </h3>
            {data.income_distribution && data.income_distribution.length > 0 ? (
              <IncomeDistribution data={data.income_distribution} />
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">
                No income distribution data available.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Simple stat card for demographic summary values */
function StatCard({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 font-bold text-slate-800 ${
          small ? "text-lg" : "text-xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
