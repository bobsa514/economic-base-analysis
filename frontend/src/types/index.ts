// TypeScript interfaces matching the FastAPI backend Pydantic schemas exactly.

// --- Geography ---

export interface CountyInfo {
  fips: string;
  county_name: string;
  state_name: string;
  full_name: string;
}

export interface GeographySearchResponse {
  query: string;
  count: number;
  results: CountyInfo[];
}

export interface ZIPInfo {
  zip_code: string;
  name: string;
}

// --- Location Quotient ---

export interface LQIndustry {
  naics: string;
  naics_label: string;
  employment: number;
  national_employment: number;
  local_share: number;
  national_share: number;
  lq: number;
}

export interface LQResponse {
  fips: string;
  year: number;
  naics_level: number;
  total_employment: number;
  total_industries: number;
  industries: LQIndustry[];
}

// --- Shift-Share ---

export interface ShiftShareSummary {
  national_growth: number;
  industry_mix: number;
  regional_competitive: number;
  total_change: number;
  year_start: number;
  year_end: number;
}

export interface ShiftShareIndustry {
  naics: string;
  naics_label: string;
  employment_t0: number;
  employment_t1: number;
  actual_change: number;
  national_growth: number;
  industry_mix: number;
  regional_competitive: number;
  total_change: number;
}

export interface ShiftShareResponse {
  fips: string;
  summary: ShiftShareSummary;
  industries: ShiftShareIndustry[];
}

// --- Diversification ---

export interface DiversificationIndustry {
  naics: string;
  naics_label: string;
  employment: number;
  share: number;
}

export interface DiversificationResponse {
  fips: string;
  year: number;
  hhi: number;
  diversification_index: number;
  total_employment: number;
  industry_count: number;
  industries: DiversificationIndustry[];
}

// --- Multiplier ---

export interface BasicIndustry {
  naics: string;
  naics_label: string;
  employment: number;
  lq: number;
  basic_employment: number;
}

export interface MultiplierResponse {
  fips: string;
  year: number;
  multiplier: number | null;
  total_employment: number;
  basic_employment: number;
  non_basic_employment: number;
  basic_industry_count: number;
  basic_industries: BasicIndustry[];
}

// --- Trends ---

export interface TrendPoint {
  year: number;
  employment: number | null;
  establishments: number | null;
  annual_payroll: number | null;
}

export interface TrendsResponse {
  fips: string;
  naics: string;
  naics_label: string;
  data: TrendPoint[];
}

// --- Demographics ---

export interface PopulationPyramidEntry {
  age_group: string;
  male: number | null;
  female: number | null;
}

export interface IncomeDistributionEntry {
  bracket: string;
  households: number | null;
}

export interface EducationEntry {
  level: string;
  count: number | null;
}

export interface DemographicsResponse {
  fips: string;
  year: number;
  total_population: number | null;
  median_age: number | null;
  median_household_income: number | null;
  employment_population_ratio: number | null;
  unemployment_rate: number | null;
  pct_graduate_degree: number | null;
  population_pyramid: PopulationPyramidEntry[];
  income_distribution: IncomeDistributionEntry[];
  education: EducationEntry[];
}

// --- Metadata ---

export interface YearsResponse {
  cbp_years: number[];
  acs_years: number[];
}

export interface NAICSCode {
  code: string;
  label: string;
}

export interface NAICSListResponse {
  level: number;
  count: number;
  codes: NAICSCode[];
}

// --- Map Data ---

export interface MapDataPoint {
  fips: string;
  value: number | null;
  employment: number | null;
}

export interface MapDataResponse {
  year: number;
  naics: string;
  metric: string;
  count: number;
  data: MapDataPoint[];
}
