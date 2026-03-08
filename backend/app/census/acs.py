"""American Community Survey (ACS) data service.

Fetches demographic data from ACS 5-year profile and detailed tables.
Handles population pyramids, income distribution, and education breakdowns.
"""

import logging
from typing import Any

from app.config import settings
from app.census.client import CensusClient

logger = logging.getLogger(__name__)


# --- Variable definitions ---

# ACS 5-year Profile variables for summary statistics
PROFILE_VARS = {
    "DP05_0001E": "total_population",
    "DP05_0018E": "median_age",
    "DP03_0062E": "median_household_income",
    "DP03_0004PE": "employment_population_ratio",
    "DP03_0009PE": "unemployment_rate",
    "DP02_0068PE": "pct_graduate_degree",
}

# Male age groups from table B01001 (vars 003-025)
MALE_AGE_VARS = [f"B01001_{str(i).zfill(3)}E" for i in range(3, 26)]

# Female age groups from table B01001 (vars 027-049)
FEMALE_AGE_VARS = [f"B01001_{str(i).zfill(3)}E" for i in range(27, 50)]

# Age group labels corresponding to B01001 subdivisions
AGE_GROUP_LABELS = [
    "Under 5", "5-9", "10-14", "15-17", "18-19", "20",
    "21", "22-24", "25-29", "30-34", "35-39", "40-44",
    "45-49", "50-54", "55-59", "60-61", "62-64", "65-66",
    "67-69", "70-74", "75-79", "80-84", "85+",
]

# Income distribution from table B19001 (vars 002-017)
INCOME_VARS = [f"B19001_{str(i).zfill(3)}E" for i in range(2, 18)]

INCOME_LABELS = [
    "Less than $10,000", "$10,000-$14,999", "$15,000-$19,999",
    "$20,000-$24,999", "$25,000-$29,999", "$30,000-$34,999",
    "$35,000-$39,999", "$40,000-$44,999", "$45,000-$49,999",
    "$50,000-$59,999", "$60,000-$74,999", "$75,000-$99,999",
    "$100,000-$124,999", "$125,000-$149,999", "$150,000-$199,999",
    "$200,000 or more",
]

# Education attainment from table B15003 (vars 002-025)
EDUCATION_VARS = [f"B15003_{str(i).zfill(3)}E" for i in range(2, 26)]

EDUCATION_LABELS = [
    "No schooling", "Nursery school", "Kindergarten",
    "1st grade", "2nd grade", "3rd grade", "4th grade",
    "5th grade", "6th grade", "7th grade", "8th grade",
    "9th grade", "10th grade", "11th grade", "12th grade no diploma",
    "Regular HS diploma", "GED/alternative", "Some college <1 yr",
    "Some college 1+ yr no degree", "Associate's degree",
    "Bachelor's degree", "Master's degree",
    "Professional school degree", "Doctorate degree",
]


# Census API geography identifier for MSA
MSA_GEO_KEY = "metropolitan statistical area/micropolitan statistical area"


def _build_geo_params(fips: str, geo_type: str = "county") -> dict[str, str]:
    """Build Census API geography parameters.

    Args:
        fips: Geographic code - 5-digit county FIPS or 5-digit MSA code.
        geo_type: Geography type - "county" or "msa".

    Returns:
        Dict with 'for' (and optionally 'in') parameters for the query.
    """
    if geo_type == "msa":
        return {
            "for": f"{MSA_GEO_KEY}:{fips}",
        }
    else:
        # Default: county-level
        return {
            "for": f"county:{fips[2:]}",
            "in": f"state:{fips[:2]}",
        }


def _safe_float(value: Any) -> float | None:
    """Convert a Census value to float, handling suppressed/missing data."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _safe_int(value: Any) -> int | None:
    """Convert a Census value to int, handling suppressed/missing data."""
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


async def fetch_summary_stats(
    client: CensusClient,
    fips: str,
    year: int,
    geo_type: str = "county",
) -> dict[str, Any]:
    """Fetch summary demographic statistics from the ACS profile table.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year: Data year.
        geo_type: Geography type - "county" or "msa".

    Returns:
        Dictionary with named demographic statistics.
    """
    url = settings.census_acs_profile_base.format(year=year)
    var_list = ",".join(PROFILE_VARS.keys())

    params = {"get": var_list, **_build_geo_params(fips, geo_type)}
    records = await client.fetch(url, params)

    if not records:
        return {}

    row = records[0]
    result: dict[str, Any] = {}
    for census_var, friendly_name in PROFILE_VARS.items():
        raw_value = row.get(census_var)
        # Median age and percentages are floats; population and income are ints
        if friendly_name in ("total_population", "median_household_income"):
            result[friendly_name] = _safe_int(raw_value)
        else:
            result[friendly_name] = _safe_float(raw_value)

    return result


async def fetch_population_pyramid(
    client: CensusClient,
    fips: str,
    year: int,
    geo_type: str = "county",
) -> list[dict[str, Any]]:
    """Fetch population pyramid data from ACS detailed table B01001.

    Returns male and female counts for each age group.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year: Data year.
        geo_type: Geography type - "county" or "msa".

    Returns:
        List of dicts with age_group, male, and female counts.
    """
    url = settings.census_acs_detail_base.format(year=year)
    all_vars = MALE_AGE_VARS + FEMALE_AGE_VARS
    var_list = ",".join(all_vars)

    params = {"get": var_list, **_build_geo_params(fips, geo_type)}
    records = await client.fetch(url, params)

    if not records:
        return []

    row = records[0]
    pyramid: list[dict[str, Any]] = []

    for i, label in enumerate(AGE_GROUP_LABELS):
        male_var = MALE_AGE_VARS[i]
        female_var = FEMALE_AGE_VARS[i]
        pyramid.append({
            "age_group": label,
            "male": _safe_int(row.get(male_var)),
            "female": _safe_int(row.get(female_var)),
        })

    return pyramid


async def fetch_income_distribution(
    client: CensusClient,
    fips: str,
    year: int,
    geo_type: str = "county",
) -> list[dict[str, Any]]:
    """Fetch household income distribution from ACS table B19001.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year: Data year.
        geo_type: Geography type - "county" or "msa".

    Returns:
        List of dicts with bracket label and household count.
    """
    url = settings.census_acs_detail_base.format(year=year)
    var_list = ",".join(INCOME_VARS)

    params = {"get": var_list, **_build_geo_params(fips, geo_type)}
    records = await client.fetch(url, params)

    if not records:
        return []

    row = records[0]
    distribution: list[dict[str, Any]] = []

    for i, label in enumerate(INCOME_LABELS):
        var = INCOME_VARS[i]
        distribution.append({
            "bracket": label,
            "households": _safe_int(row.get(var)),
        })

    return distribution


async def fetch_education(
    client: CensusClient,
    fips: str,
    year: int,
    geo_type: str = "county",
) -> list[dict[str, Any]]:
    """Fetch educational attainment from ACS table B15003.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year: Data year.
        geo_type: Geography type - "county" or "msa".

    Returns:
        List of dicts with education level and count.
    """
    url = settings.census_acs_detail_base.format(year=year)
    var_list = ",".join(EDUCATION_VARS)

    params = {"get": var_list, **_build_geo_params(fips, geo_type)}
    records = await client.fetch(url, params)

    if not records:
        return []

    row = records[0]
    education: list[dict[str, Any]] = []

    for i, label in enumerate(EDUCATION_LABELS):
        var = EDUCATION_VARS[i]
        education.append({
            "level": label,
            "count": _safe_int(row.get(var)),
        })

    return education
