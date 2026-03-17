/**
 * API client for the EconBase FastAPI backend.
 * All paths and types match the backend exactly.
 *
 * Many analysis functions accept an optional `geoType` parameter.
 * When set to "msa", the backend returns data for Metropolitan Statistical Areas
 * instead of individual counties.
 */
import type {
  CountyInfo,
  LQResponse,
  ShiftShareResponse,
  DiversificationResponse,
  MultiplierResponse,
  DemographicsResponse,
  MapDataResponse,
  YearsResponse,
  NAICSListResponse,
  TrendsResponse,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string): Promise<T> {
  // Use AbortController for 60s timeout (map-data can be slow on cold start)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        if (body.detail) detail = body.detail;
      } catch {
        // Response body not JSON — use statusText
      }
      throw new Error(`API error ${res.status}: ${detail}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- Geography ---

/**
 * Normalize any geography response (county, MSA, or ZIP) to a
 * consistent CountyInfo shape so all components can use the same fields.
 *
 * Backend returns different schemas per geo_type:
 * - county: { fips, county_name, state_name, full_name }
 * - msa:    { code, name }
 * - zip:    { zip_code, name }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeToCountyInfo(item: any): CountyInfo {
  // Already CountyInfo shape (county results)
  if (item.fips && item.county_name) return item as CountyInfo;

  // MSA result: { code, name }
  if (item.code != null) {
    return {
      fips: item.code,
      county_name: item.name ?? `MSA ${item.code}`,
      state_name: "",
      full_name: item.name ?? `MSA ${item.code}`,
    };
  }

  // ZIP result: { zip_code, name }
  if (item.zip_code != null) {
    return {
      fips: item.zip_code,
      county_name: item.name ?? `ZIP ${item.zip_code}`,
      state_name: "",
      full_name: item.name ?? `ZIP ${item.zip_code}`,
    };
  }

  // Fallback
  return item as CountyInfo;
}

/** Search counties/MSAs/ZIPs by name (autocomplete). Returns normalized results. */
export async function searchGeography(
  query: string,
  geoType?: string
): Promise<CountyInfo[]> {
  const geoParam = geoType ? `&geo_type=${geoType}` : "";
  // Backend wraps results: { query, geo_type, count, results: [...] }
  const data = await fetchJSON<{ results: unknown[] }>(
    `/api/geography/search?q=${encodeURIComponent(query)}${geoParam}`
  );
  return data.results.map(normalizeToCountyInfo);
}

/** Get county/MSA/ZIP info by code. Returns normalized CountyInfo. */
export async function getRegionInfo(
  fips: string,
  geoType?: string
): Promise<CountyInfo> {
  const geoParam = geoType ? `?geo_type=${geoType}` : "";
  const raw = await fetchJSON<unknown>(`/api/geography/${fips}${geoParam}`);
  return normalizeToCountyInfo(raw);
}

// --- Analysis ---

/** Location Quotient analysis for a county/MSA. */
export async function getLQAnalysis(
  fips: string,
  year: number,
  naicsLevel: number,
  geoType?: string
): Promise<LQResponse> {
  const geoParam = geoType ? `&geo_type=${geoType}` : "";
  return fetchJSON<LQResponse>(
    `/api/analysis/lq?fips=${fips}&year=${year}&naics_level=${naicsLevel}${geoParam}`
  );
}

/** Shift-Share analysis comparing two years. */
export async function getShiftShare(
  fips: string,
  yearStart: number,
  yearEnd: number,
  naicsLevel: number,
  geoType?: string
): Promise<ShiftShareResponse> {
  const geoParam = geoType ? `&geo_type=${geoType}` : "";
  return fetchJSON<ShiftShareResponse>(
    `/api/analysis/shift-share?fips=${fips}&year_start=${yearStart}&year_end=${yearEnd}&naics_level=${naicsLevel}${geoParam}`
  );
}

/** Economic diversification index (1 - HHI). */
export async function getDiversification(
  fips: string,
  year: number,
  geoType?: string
): Promise<DiversificationResponse> {
  const geoParam = geoType ? `&geo_type=${geoType}` : "";
  return fetchJSON<DiversificationResponse>(
    `/api/analysis/diversification?fips=${fips}&year=${year}${geoParam}`
  );
}

/** Economic base multiplier. */
export async function getMultiplier(
  fips: string,
  year: number,
  geoType?: string
): Promise<MultiplierResponse> {
  const geoParam = geoType ? `&geo_type=${geoType}` : "";
  return fetchJSON<MultiplierResponse>(
    `/api/analysis/multiplier?fips=${fips}&year=${year}${geoParam}`
  );
}

/** Employment trends over time for a specific industry. */
export async function getTrends(
  fips: string,
  naics: string,
  startYear: number,
  endYear: number,
  geoType?: string
): Promise<TrendsResponse> {
  const geoParam = geoType ? `&geo_type=${geoType}` : "";
  return fetchJSON<TrendsResponse>(
    `/api/analysis/trends?fips=${fips}&naics=${encodeURIComponent(naics)}&start_year=${startYear}&end_year=${endYear}${geoParam}`
  );
}

/** Choropleth map data for all counties. */
export async function getMapData(
  year: number,
  naics: string,
  metric: string
): Promise<MapDataResponse> {
  return fetchJSON<MapDataResponse>(
    `/api/analysis/map-data?year=${year}&naics=${encodeURIComponent(naics)}&metric=${metric}`
  );
}

// --- Demographics ---

/** ACS demographic profile for a county/MSA. */
export async function getDemographics(
  fips: string,
  year?: number,
  geoType?: string
): Promise<DemographicsResponse> {
  const params: string[] = [];
  if (year) params.push(`year=${year}`);
  if (geoType) params.push(`geo_type=${geoType}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return fetchJSON<DemographicsResponse>(
    `/api/demographics/${fips}${queryString}`
  );
}

// --- Metadata ---

/** Available data years for CBP and ACS. */
export async function getAvailableYears(): Promise<YearsResponse> {
  return fetchJSON<YearsResponse>("/api/metadata/years");
}

/** NAICS codes at a specific digit level. */
export async function getNAICSCodes(
  level: number,
  year: number = 2023
): Promise<NAICSListResponse> {
  return fetchJSON<NAICSListResponse>(
    `/api/metadata/naics?level=${level}&year=${year}`
  );
}
