/**
 * React Query hooks wrapping the API client.
 * Each hook manages caching, loading, and error states automatically.
 *
 * Hooks that support geographic level switching accept an optional `geoType`
 * parameter ("msa" for metro areas, undefined for counties).
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchGeography,
  getRegionInfo,
  getLQAnalysis,
  getShiftShare,
  getDiversification,
  getMultiplier,
  getDemographics,
  getTrends,
  getAvailableYears,
  getNAICSCodes,
  getMapData,
} from "@/lib/api";

/** Autocomplete search for geography — only fires when query is 2+ chars. */
export function useGeographySearch(query: string, geoType?: string) {
  return useQuery({
    queryKey: ["geography-search", query, geoType],
    queryFn: () => searchGeography(query, geoType),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}

/** Fetch county/MSA info by FIPS (returns CountyInfo). */
export function useRegionInfo(fips: string, geoType?: string) {
  return useQuery({
    queryKey: ["region-info", fips, geoType],
    queryFn: () => getRegionInfo(fips, geoType),
    enabled: !!fips,
  });
}

/** Fetch LQ analysis for a given FIPS, year, and NAICS digit level. */
export function useLQAnalysis(
  fips: string,
  year: number,
  naicsLevel: number,
  geoType?: string
) {
  return useQuery({
    queryKey: ["lq-analysis", fips, year, naicsLevel, geoType],
    queryFn: () => getLQAnalysis(fips, year, naicsLevel, geoType),
    enabled: !!fips && !!year,
    staleTime: 5 * 60_000,
  });
}

/** Fetch diversification index for a region. */
export function useDiversification(fips: string, year: number, geoType?: string) {
  return useQuery({
    queryKey: ["diversification", fips, year, geoType],
    queryFn: () => getDiversification(fips, year, geoType),
    enabled: !!fips && !!year,
  });
}

/** Fetch economic base multiplier. */
export function useMultiplier(fips: string, year: number, geoType?: string) {
  return useQuery({
    queryKey: ["multiplier", fips, year, geoType],
    queryFn: () => getMultiplier(fips, year, geoType),
    enabled: !!fips && !!year,
  });
}

/** Fetch demographics (ACS) for a region. */
export function useDemographics(fips: string, year?: number, geoType?: string) {
  return useQuery({
    queryKey: ["demographics", fips, year, geoType],
    queryFn: () => getDemographics(fips, year, geoType),
    enabled: !!fips,
  });
}

/** Fetch Shift-Share analysis for a county between two years. */
export function useShiftShare(
  fips: string,
  yearStart: number,
  yearEnd: number,
  naicsLevel: number,
  geoType?: string
) {
  return useQuery({
    queryKey: ["shift-share", fips, yearStart, yearEnd, naicsLevel, geoType],
    queryFn: () => getShiftShare(fips, yearStart, yearEnd, naicsLevel, geoType),
    enabled: !!fips && !!yearStart && !!yearEnd,
    staleTime: 5 * 60_000,
  });
}

/** Fetch industry trends over time for a specific NAICS code. */
export function useTrends(
  fips: string,
  naics: string,
  startYear: number,
  endYear: number,
  geoType?: string
) {
  return useQuery({
    queryKey: ["trends", fips, naics, startYear, endYear, geoType],
    queryFn: () => getTrends(fips, naics, startYear, endYear, geoType),
    enabled: !!fips && !!naics && !!startYear && !!endYear,
    staleTime: 5 * 60_000,
  });
}

/** Fetch NAICS codes at a specific digit level. */
export function useNAICSCodes(level: number, year: number = 2023) {
  return useQuery({
    queryKey: ["naics-codes", level, year],
    queryFn: () => getNAICSCodes(level, year),
    staleTime: Infinity, // NAICS codes don't change within a session
  });
}

/** Fetch choropleth map data for all counties — expensive query, cached aggressively. */
export function useMapData(year: number, naics: string, metric: string) {
  return useQuery({
    queryKey: ["map-data", year, naics, metric],
    queryFn: () => getMapData(year, naics, metric),
    staleTime: 10 * 60_000, // 10 minutes — this data is expensive to fetch
    enabled: !!year,
    retry: 2, // Retry twice on failure (cold Census API calls can be slow)
    retryDelay: 2000,
  });
}

/** Fetch available years for CBP and ACS datasets. */
export function useAvailableYears() {
  return useQuery({
    queryKey: ["available-years"],
    queryFn: getAvailableYears,
    staleTime: Infinity,
  });
}
