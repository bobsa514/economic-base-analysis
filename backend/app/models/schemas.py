"""Pydantic response models for the EconBase API.

All API responses use these typed models to ensure consistent
serialization and automatic OpenAPI documentation.
"""

from pydantic import BaseModel, Field


# --- Geography ---

class CountyInfo(BaseModel):
    """Basic county information."""
    fips: str = Field(description="5-digit FIPS code")
    county_name: str = Field(description="County name")
    state_name: str = Field(description="State name")
    full_name: str = Field(description="County, State format")


class MSAInfo(BaseModel):
    """Basic MSA (Metropolitan Statistical Area) information."""
    code: str = Field(description="5-digit MSA code")
    name: str = Field(description="MSA name (e.g., 'San Diego-Chula Vista-Carlsbad, CA Metro Area')")


class ZIPInfo(BaseModel):
    """Basic ZIP code information."""
    zip_code: str = Field(description="5-digit ZIP code")
    name: str = Field(description="ZIP code label (e.g., 'ZIP 92101')")


class GeographySearchResponse(BaseModel):
    """Response for geography search endpoint (county, MSA, or ZIP)."""
    query: str
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    count: int
    results: list[CountyInfo] | list[MSAInfo] | list[ZIPInfo]


# --- Location Quotient ---

class LQIndustry(BaseModel):
    """Single industry's Location Quotient result."""
    naics: str
    naics_label: str
    employment: int
    national_employment: int
    local_share: float
    national_share: float
    lq: float


class LQResponse(BaseModel):
    """Response for Location Quotient analysis."""
    fips: str = Field(description="County FIPS or MSA code")
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    year: int
    naics_level: int
    total_employment: int
    total_industries: int
    industries: list[LQIndustry]


# --- Shift-Share ---

class ShiftShareSummary(BaseModel):
    """Aggregate shift-share components."""
    national_growth: float
    industry_mix: float
    regional_competitive: float
    total_change: float
    year_start: int
    year_end: int


class ShiftShareIndustry(BaseModel):
    """Single industry's shift-share decomposition."""
    naics: str
    naics_label: str
    employment_t0: int
    employment_t1: int
    actual_change: int
    national_growth: float
    industry_mix: float
    regional_competitive: float
    total_change: float


class ShiftShareResponse(BaseModel):
    """Response for Shift-Share analysis."""
    fips: str = Field(description="County FIPS or MSA code")
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    summary: ShiftShareSummary
    industries: list[ShiftShareIndustry]


# --- Diversification ---

class DiversificationIndustry(BaseModel):
    """Industry share for diversification analysis."""
    naics: str
    naics_label: str
    employment: int
    share: float


class DiversificationResponse(BaseModel):
    """Response for Diversification Index analysis."""
    fips: str = Field(description="County FIPS or MSA code")
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    year: int
    hhi: float = Field(description="Herfindahl-Hirschman Index")
    diversification_index: float = Field(description="1 - HHI")
    total_employment: int
    industry_count: int
    industries: list[DiversificationIndustry]


# --- Multiplier ---

class BasicIndustry(BaseModel):
    """Industry identified as part of the economic base."""
    naics: str
    naics_label: str
    employment: int
    lq: float
    basic_employment: float


class MultiplierResponse(BaseModel):
    """Response for Economic Base Multiplier analysis."""
    fips: str = Field(description="County FIPS or MSA code")
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    year: int
    multiplier: float | None = Field(description="Total Emp / Basic Emp")
    total_employment: int
    basic_employment: float
    non_basic_employment: float
    basic_industry_count: int
    basic_industries: list[BasicIndustry]


# --- Trends ---

class TrendPoint(BaseModel):
    """Single data point in a time series."""
    year: int
    employment: int | None
    establishments: int | None
    annual_payroll: int | None


class TrendsResponse(BaseModel):
    """Response for employment trends over time."""
    fips: str = Field(description="County FIPS or MSA code")
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    naics: str
    naics_label: str
    data: list[TrendPoint]


# --- Demographics ---

class PopulationPyramidEntry(BaseModel):
    """Single age group in a population pyramid."""
    age_group: str
    male: int | None
    female: int | None


class IncomeDistributionEntry(BaseModel):
    """Single income bracket."""
    bracket: str
    households: int | None


class EducationEntry(BaseModel):
    """Single education level."""
    level: str
    count: int | None


class DemographicsResponse(BaseModel):
    """Response for ACS demographic profile."""
    fips: str = Field(description="County FIPS or MSA code")
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    year: int
    total_population: int | None = None
    median_age: float | None = None
    median_household_income: int | None = None
    employment_population_ratio: float | None = None
    unemployment_rate: float | None = None
    pct_graduate_degree: float | None = None
    population_pyramid: list[PopulationPyramidEntry]
    income_distribution: list[IncomeDistributionEntry]
    education: list[EducationEntry]


# --- Metadata ---

class YearsResponse(BaseModel):
    """Available data years."""
    cbp_years: list[int]
    acs_years: list[int]


class NAICSCode(BaseModel):
    """A single NAICS code with its description."""
    code: str
    label: str


class NAICSListResponse(BaseModel):
    """List of NAICS codes at a given level."""
    level: int
    count: int
    codes: list[NAICSCode]


# --- Map Data ---

class MapDataPoint(BaseModel):
    """Single county data point for choropleth mapping."""
    fips: str
    value: float | None
    employment: int | None


class MapDataResponse(BaseModel):
    """Response for choropleth map data."""
    year: int
    naics: str
    metric: str
    geo_type: str = Field(default="county", description="Geography type: 'county', 'msa', or 'zip'")
    count: int
    data: list[MapDataPoint]


# --- Error ---

class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
