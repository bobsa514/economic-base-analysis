"""Economic Diversification Index calculation.

Uses the Herfindahl-Hirschman Index (HHI) to measure how concentrated
or diversified a local economy is across industries.

Formula:
    HHI = sum(s_i^2) for all industries i
    Diversification Index = 1 - HHI

Where s_i = employment share of industry i (e_i / e_total).

A higher diversification index (closer to 1) means the economy is more
diversified. A lower index means it's more concentrated in fewer industries.
"""

from typing import Any

from app.census.client import CensusClient
from app.census.cbp import (
    fetch_cbp_county,
    fetch_cbp_msa,
    fetch_zbp_zip,
    filter_by_naics_level,
    get_naics_level,
)


async def calculate_diversification(
    client: CensusClient,
    fips: str,
    year: int,
    naics_level: int = 2,
    geo_type: str = "county",
) -> dict[str, Any]:
    """Calculate the Diversification Index for a region.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year: Data year.
        naics_level: NAICS digit level for industry grouping (default 2).
        geo_type: Geography type - "county" or "msa".

    Returns:
        Dict with hhi, diversification_index, industry_count,
        and per-industry employment shares.
    """
    if geo_type == "zip":
        county_data = await fetch_zbp_zip(client, fips, year)
    elif geo_type == "msa":
        county_data = await fetch_cbp_msa(client, fips, year)
    else:
        county_data = await fetch_cbp_county(client, fips, year)
    filtered = filter_by_naics_level(county_data, naics_level)

    # Get total employment
    total_emp = 0
    industry_records: list[dict[str, Any]] = []

    for record in filtered:
        naics = record["NAICS"]
        emp = record["EMP"]
        level = get_naics_level(naics)

        if emp is None:
            continue

        if level == 0:
            total_emp = emp
        elif level == naics_level:
            industry_records.append(record)

    if total_emp == 0:
        return {
            "hhi": 0.0,
            "diversification_index": 0.0,
            "industry_count": 0,
            "industries": [],
        }

    # Calculate employment shares and HHI
    hhi = 0.0
    industries: list[dict[str, Any]] = []

    for record in industry_records:
        emp = record["EMP"]
        if emp is None or emp == 0:
            continue

        share = emp / total_emp
        hhi += share ** 2

        industries.append({
            "naics": record["NAICS"],
            "naics_label": record.get("NAICS_LABEL", ""),
            "employment": emp,
            "share": round(share, 6),
        })

    # Sort by share descending
    industries.sort(key=lambda x: x["share"], reverse=True)

    diversification_index = 1 - hhi

    return {
        "hhi": round(hhi, 6),
        "diversification_index": round(diversification_index, 6),
        "total_employment": total_emp,
        "industry_count": len(industries),
        "industries": industries,
    }
