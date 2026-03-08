"""Shift-Share Analysis calculation.

Shift-Share decomposes regional employment change into three components:

1. National Growth (NG): How much the region would have grown if it
   followed the national economy's overall growth rate.

2. Industry Mix (IM): How much growth is attributable to the region's
   industry composition (being in fast/slow-growing industries nationally).

3. Regional Competitive (RC): How much growth is due to the region's
   competitive advantage (or disadvantage) in each industry.

Formulas for each industry i:
    NG_i = e_i(t0) * (E_total(t1)/E_total(t0) - 1)
    IM_i = e_i(t0) * (E_i(t1)/E_i(t0) - E_total(t1)/E_total(t0))
    RC_i = e_i(t0) * (e_i(t1)/e_i(t0) - E_i(t1)/E_i(t0))
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


async def _fetch_local_data(
    client: CensusClient,
    fips: str,
    year: int,
    geo_type: str,
) -> list[dict]:
    """Fetch local CBP/ZBP data for county, MSA, or ZIP geography."""
    if geo_type == "zip":
        return await fetch_zbp_zip(client, fips, year)
    if geo_type == "msa":
        return await fetch_cbp_msa(client, fips, year)
    return await fetch_cbp_county(client, fips, year)


async def calculate_shift_share(
    client: CensusClient,
    fips: str,
    year_start: int,
    year_end: int,
    naics_level: int,
    geo_type: str = "county",
) -> dict[str, Any]:
    """Calculate Shift-Share analysis between two years.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year_start: Base year (t0).
        year_end: Comparison year (t1).
        naics_level: NAICS digit level to analyze (2-6).
        geo_type: Geography type - "county" or "msa".

    Returns:
        Dict with:
        - summary: Aggregate NG, IM, RC, and total_change
        - industries: Per-industry breakdown with all three components
    """
    # Fetch data for both years
    county_t0 = filter_by_naics_level(
        await _fetch_local_data(client, fips, year_start, geo_type), naics_level
    )
    county_t1 = filter_by_naics_level(
        await _fetch_local_data(client, fips, year_end, geo_type), naics_level
    )
    national_t0 = filter_by_naics_level(
        await fetch_cbp_national(client, year_start), naics_level
    )
    national_t1 = filter_by_naics_level(
        await fetch_cbp_national(client, year_end), naics_level
    )

    # Build employment lookup dicts
    def emp_dict(records: list[dict]) -> dict[str, int]:
        return {
            r["NAICS"]: r["EMP"]
            for r in records
            if r["EMP"] is not None
        }

    def label_dict(records: list[dict]) -> dict[str, str]:
        return {r["NAICS"]: r.get("NAICS_LABEL", "") for r in records}

    e_t0 = emp_dict(county_t0)
    e_t1 = emp_dict(county_t1)
    big_e_t0 = emp_dict(national_t0)
    big_e_t1 = emp_dict(national_t1)
    labels = label_dict(national_t0)
    labels.update(label_dict(national_t1))

    # National totals
    e_total_t0 = big_e_t0.get("00", 0)
    e_total_t1 = big_e_t1.get("00", 0)

    if e_total_t0 == 0:
        return {"summary": {}, "industries": []}

    national_growth_rate = e_total_t1 / e_total_t0

    # Calculate components for each industry present in both years
    industries: list[dict[str, Any]] = []
    total_ng = 0.0
    total_im = 0.0
    total_rc = 0.0

    # Use industries from base year
    for naics_code, e_i_t0 in e_t0.items():
        if get_naics_level(naics_code) == 0:
            continue

        e_i_t1 = e_t1.get(naics_code)
        big_e_i_t0 = big_e_t0.get(naics_code)
        big_e_i_t1 = big_e_t1.get(naics_code)

        # Skip industries missing from any dataset
        if any(v is None or v == 0 for v in [e_i_t0, e_i_t1, big_e_i_t0, big_e_i_t1]):
            continue

        # National Growth component
        ng = e_i_t0 * (national_growth_rate - 1)

        # Industry Mix component
        industry_growth_rate = big_e_i_t1 / big_e_i_t0
        im = e_i_t0 * (industry_growth_rate - national_growth_rate)

        # Regional Competitive component
        local_growth_rate = e_i_t1 / e_i_t0
        rc = e_i_t0 * (local_growth_rate - industry_growth_rate)

        total_change = ng + im + rc

        total_ng += ng
        total_im += im
        total_rc += rc

        industries.append({
            "naics": naics_code,
            "naics_label": labels.get(naics_code, ""),
            "employment_t0": e_i_t0,
            "employment_t1": e_i_t1,
            "actual_change": e_i_t1 - e_i_t0,
            "national_growth": round(ng, 2),
            "industry_mix": round(im, 2),
            "regional_competitive": round(rc, 2),
            "total_change": round(total_change, 2),
        })

    # Sort by absolute total change (most impactful first)
    industries.sort(key=lambda x: abs(x["total_change"]), reverse=True)

    return {
        "summary": {
            "national_growth": round(total_ng, 2),
            "industry_mix": round(total_im, 2),
            "regional_competitive": round(total_rc, 2),
            "total_change": round(total_ng + total_im + total_rc, 2),
            "year_start": year_start,
            "year_end": year_end,
        },
        "industries": industries,
    }
