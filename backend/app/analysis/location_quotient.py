"""Location Quotient (LQ) calculation.

The Location Quotient measures the relative concentration of an industry
in a local economy compared to the national economy.

Formula:
    LQ_i = (e_i / e_total) / (E_i / E_total)

Where:
    e_i     = local employment in industry i
    e_total = total local employment
    E_i     = national employment in industry i
    E_total = total national employment

An LQ > 1 indicates the industry is more concentrated locally than nationally
(a "basic" or export-oriented industry).
"""

from typing import Any

from app.census.client import CensusClient
from app.census.cbp import (
    fetch_cbp_county,
    fetch_cbp_msa,
    fetch_zbp_zip,
    fetch_cbp_national,
    filter_by_naics_level,
    get_naics_level,
)


async def calculate_lq(
    client: CensusClient,
    fips: str,
    year: int,
    naics_level: int,
    geo_type: str = "county",
) -> dict[str, Any]:
    """Calculate Location Quotients for all industries at a given NAICS level.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year: Data year.
        naics_level: NAICS digit level to analyze (2, 3, 4, 5, or 6).
        geo_type: Geography type - "county" or "msa".

    Returns:
        List of industry records sorted by LQ descending, each containing:
        - naics: NAICS code
        - naics_label: Industry name
        - employment: Local employment count
        - national_employment: National employment count
        - local_share: e_i / e_total
        - national_share: E_i / E_total
        - lq: Location Quotient value
    """
    # Fetch local and national data (these may hit cache)
    if geo_type == "zip":
        local_data = await fetch_zbp_zip(client, fips, year)
    elif geo_type == "msa":
        local_data = await fetch_cbp_msa(client, fips, year)
    else:
        local_data = await fetch_cbp_county(client, fips, year)
    national_data = await fetch_cbp_national(client, year)

    # Filter to the requested NAICS level (keeping totals)
    local_filtered = filter_by_naics_level(local_data, naics_level)
    national_filtered = filter_by_naics_level(national_data, naics_level)

    # Build lookup dicts
    county_emp: dict[str, int] = {}
    for record in local_filtered:
        naics = record["NAICS"]
        emp = record["EMP"]
        if emp is not None:
            county_emp[naics] = emp

    national_emp: dict[str, int] = {}
    national_labels: dict[str, str] = {}
    for record in national_filtered:
        naics = record["NAICS"]
        emp = record["EMP"]
        if emp is not None:
            national_emp[naics] = emp
        national_labels[naics] = record.get("NAICS_LABEL", "")

    # Get totals (NAICS "00")
    e_total = county_emp.get("00", 0)
    big_e_total = national_emp.get("00", 0)

    if e_total == 0 or big_e_total == 0:
        return {"total_employment": 0, "industries": []}

    # Calculate LQ for each industry
    results: list[dict[str, Any]] = []

    for naics_code, e_i in county_emp.items():
        # Skip the total row itself
        if get_naics_level(naics_code) == 0:
            continue

        big_e_i = national_emp.get(naics_code)
        if big_e_i is None or big_e_i == 0:
            continue

        local_share = e_i / e_total
        national_share = big_e_i / big_e_total
        lq = local_share / national_share if national_share > 0 else 0.0

        results.append({
            "naics": naics_code,
            "naics_label": national_labels.get(naics_code, ""),
            "employment": e_i,
            "national_employment": big_e_i,
            "local_share": round(local_share, 6),
            "national_share": round(national_share, 6),
            "lq": round(lq, 4),
        })

    # Sort by LQ descending
    results.sort(key=lambda x: x["lq"], reverse=True)
    return {"total_employment": e_total, "industries": results}
