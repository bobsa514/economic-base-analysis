"""County/ZIP Business Patterns (CBP/ZBP) data service.

Handles fetching employment, establishment, and payroll data
from the Census CBP and ZBP APIs for county-level, MSA-level,
ZIP code-level, and national-level geographies.
Manages NAICS version differences across years.
"""

import logging
from typing import Any

import httpx

from app.config import settings
from app.census.client import CensusClient

logger = logging.getLogger(__name__)

# NAICS variable names vary by year
# Years 2017+ use NAICS2017; earlier years may use NAICS2012
NAICS_VERSIONS = ["NAICS2017", "NAICS2012"]


def get_naics_level(code: str) -> int:
    """Determine the NAICS hierarchy level from a code string.

    The Census CBP data uses these conventions:
    - "00" → total for all sectors
    - 2-char numeric or hyphenated range ("31-33") → 2-digit sector
    - 3-char → 3-digit subsector
    - 4-char → 4-digit industry group
    - 5-char → 5-digit NAICS industry
    - 6-char → 6-digit national industry

    Args:
        code: The NAICS code string from the Census API.

    Returns:
        Integer representing the level (0 for total, 2-6 for digit levels).
    """
    if code == "00":
        return 0  # Total across all sectors

    # Hyphenated ranges like "31-33" are 2-digit sectors
    if "-" in code:
        return 2

    # Codes with slashes like "31-33" variants are also 2-digit
    if "/" in code:
        return 2

    code_len = len(code)
    if code_len in (2, 3, 4, 5, 6):
        return code_len

    return -1  # Unknown/unrecognized format


async def _detect_naics_variable(
    client: CensusClient,
    year: int,
) -> str:
    """Detect which NAICS variable name works for a given year.

    CBP years 2017+ use NAICS2017, earlier years may use NAICS2012.
    We try NAICS2017 first, then fall back to NAICS2012.

    Args:
        client: The Census API client.
        year: The data year to check.

    Returns:
        The working NAICS variable name (e.g., "NAICS2017").

    Raises:
        RuntimeError: If no NAICS variable works for the given year.
    """
    url = settings.census_cbp_base.format(year=year)

    for naics_var in NAICS_VERSIONS:
        try:
            params = {
                "get": f"{naics_var},EMP",
                "for": "us:*",
                # Only fetch total row to minimize data
                f"{naics_var}": "00",
            }
            await client.fetch(url, params)
            logger.info("Year %d uses %s", year, naics_var)
            return naics_var
        except httpx.HTTPStatusError:
            logger.debug("Year %d does not support %s, trying next", year, naics_var)
            continue

    raise RuntimeError(
        f"Could not determine NAICS variable for year {year}. "
        f"Tried: {NAICS_VERSIONS}"
    )


# In-memory cache for detected NAICS variable names per year
_naics_var_cache: dict[int, str] = {}


async def get_naics_variable(client: CensusClient, year: int) -> str:
    """Get the correct NAICS variable name for a year, with caching.

    Args:
        client: The Census API client.
        year: The data year.

    Returns:
        The NAICS variable name to use for API requests.
    """
    if year not in _naics_var_cache:
        _naics_var_cache[year] = await _detect_naics_variable(client, year)
    return _naics_var_cache[year]


async def fetch_cbp_county(
    client: CensusClient,
    fips: str,
    year: int,
) -> list[dict[str, Any]]:
    """Fetch CBP data for a specific county.

    Args:
        client: The Census API client.
        fips: 5-digit FIPS code (e.g., "06073" for San Diego County).
        year: Data year (2012-2023).

    Returns:
        List of industry records with NAICS code, label, EMP, ESTAB, PAYANN.
    """
    state_fips = fips[:2]
    county_fips = fips[2:]
    naics_var = await get_naics_variable(client, year)
    url = settings.census_cbp_base.format(year=year)

    params = {
        "get": f"{naics_var},{naics_var}_LABEL,EMP,ESTAB,PAYANN",
        "for": f"county:{county_fips}",
        "in": f"state:{state_fips}",
    }

    records = await client.fetch(url, params)

    # Normalize NAICS field name to a consistent "NAICS" key
    normalized: list[dict[str, Any]] = []
    for record in records:
        normalized.append({
            "NAICS": record.get(naics_var, ""),
            "NAICS_LABEL": record.get(f"{naics_var}_LABEL", ""),
            "EMP": record.get("EMP"),
            "ESTAB": record.get("ESTAB"),
            "PAYANN": record.get("PAYANN"),
            "state": record.get("state", state_fips),
            "county": record.get("county", county_fips),
        })
    return normalized


# Census API geography identifier for MSA (must match exactly)
MSA_GEO_KEY = "metropolitan statistical area/micropolitan statistical area"


async def fetch_cbp_msa(
    client: CensusClient,
    msa_code: str,
    year: int,
) -> list[dict[str, Any]]:
    """Fetch CBP data for a specific Metropolitan Statistical Area.

    Args:
        client: The Census API client.
        msa_code: 5-digit MSA code (e.g., "41740" for San Diego).
        year: Data year (2012-2023).

    Returns:
        List of industry records with NAICS code, label, EMP, ESTAB, PAYANN.
    """
    naics_var = await get_naics_variable(client, year)
    url = settings.census_cbp_base.format(year=year)

    params = {
        "get": f"{naics_var},{naics_var}_LABEL,EMP,ESTAB,PAYANN",
        "for": f"{MSA_GEO_KEY}:{msa_code}",
    }

    records = await client.fetch(url, params)

    # Normalize NAICS field name to a consistent "NAICS" key
    normalized: list[dict[str, Any]] = []
    for record in records:
        normalized.append({
            "NAICS": record.get(naics_var, ""),
            "NAICS_LABEL": record.get(f"{naics_var}_LABEL", ""),
            "EMP": record.get("EMP"),
            "ESTAB": record.get("ESTAB"),
            "PAYANN": record.get("PAYANN"),
            "msa": record.get(MSA_GEO_KEY, msa_code),
        })
    return normalized


async def fetch_zbp_zip(
    client: CensusClient,
    zip_code: str,
    year: int,
) -> list[dict[str, Any]]:
    """Fetch ZBP (ZIP Code Business Patterns) data for a specific ZIP code.

    ZIP code data is available through the CBP endpoint itself (not a
    separate ZBP endpoint). The geography key is "zip code" (with space).

    Args:
        client: The Census API client.
        zip_code: 5-digit ZIP code (e.g., "92101" for downtown San Diego).
        year: Data year (2012-2023).

    Returns:
        List of industry records with NAICS code, label, EMP, ESTAB, PAYANN.
    """
    naics_var = await get_naics_variable(client, year)
    # ZIP code data lives within the CBP endpoint, not a separate ZBP endpoint
    url = settings.census_cbp_base.format(year=year)

    params = {
        "get": f"{naics_var},{naics_var}_LABEL,EMP,ESTAB,PAYANN",
        "for": f"zip code:{zip_code}",
    }

    records = await client.fetch(url, params)

    # Normalize NAICS field name to a consistent "NAICS" key
    normalized: list[dict[str, Any]] = []
    for record in records:
        normalized.append({
            "NAICS": record.get(naics_var, ""),
            "NAICS_LABEL": record.get(f"{naics_var}_LABEL", ""),
            "EMP": record.get("EMP"),
            "ESTAB": record.get("ESTAB"),
            "PAYANN": record.get("PAYANN"),
            "zipcode": record.get("zip code", zip_code),
        })
    return normalized


async def fetch_cbp_all_msas(
    client: CensusClient,
    year: int,
    naics_code: str,
) -> list[dict[str, Any]]:
    """Fetch CBP data for all MSAs for a specific NAICS code.

    Useful for map data - fetches a single industry across all MSAs.

    Args:
        client: The Census API client.
        year: Data year (2012-2023).
        naics_code: NAICS code to query (e.g., "72" or "00" for total).

    Returns:
        List of records with MSA code, NAICS, EMP fields.
    """
    naics_var = await get_naics_variable(client, year)
    url = settings.census_cbp_base.format(year=year)

    params = {
        "get": f"{naics_var},{naics_var}_LABEL,EMP",
        "for": f"{MSA_GEO_KEY}:*",
        naics_var: naics_code,
    }

    records = await client.fetch(url, params)

    normalized: list[dict[str, Any]] = []
    for record in records:
        normalized.append({
            "NAICS": record.get(naics_var, ""),
            "NAICS_LABEL": record.get(f"{naics_var}_LABEL", ""),
            "EMP": record.get("EMP"),
            "msa": record.get(MSA_GEO_KEY, ""),
        })
    return normalized


async def fetch_cbp_national(
    client: CensusClient,
    year: int,
) -> list[dict[str, Any]]:
    """Fetch CBP data for the entire United States.

    Args:
        client: The Census API client.
        year: Data year (2012-2023).

    Returns:
        List of national industry records with NAICS code, label, EMP, ESTAB, PAYANN.
    """
    naics_var = await get_naics_variable(client, year)
    url = settings.census_cbp_base.format(year=year)

    params = {
        "get": f"{naics_var},{naics_var}_LABEL,EMP,ESTAB,PAYANN",
        "for": "us:*",
    }

    records = await client.fetch(url, params)

    normalized: list[dict[str, Any]] = []
    for record in records:
        normalized.append({
            "NAICS": record.get(naics_var, ""),
            "NAICS_LABEL": record.get(f"{naics_var}_LABEL", ""),
            "EMP": record.get("EMP"),
            "ESTAB": record.get("ESTAB"),
            "PAYANN": record.get("PAYANN"),
        })
    return normalized


def filter_by_naics_level(
    records: list[dict[str, Any]],
    level: int,
) -> list[dict[str, Any]]:
    """Filter CBP records to a specific NAICS digit level.

    Keeps the total ("00") row plus all rows matching the requested level.

    Args:
        records: Raw CBP records from fetch_cbp_county or fetch_cbp_national.
        level: NAICS digit level to keep (2, 3, 4, 5, or 6).

    Returns:
        Filtered records containing only the total and requested level.
    """
    return [
        r for r in records
        if get_naics_level(r["NAICS"]) in (0, level)
    ]
