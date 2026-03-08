"""Economic Base Multiplier calculation.

The Economic Base Multiplier estimates the total economic impact of
basic (export-oriented) industries in a region.

Methodology:
1. Calculate LQ for each industry.
2. Industries with LQ > 1 have "basic" (export) employment.
3. Basic employment = emp_i * (1 - 1/LQ_i) for each basic industry.
4. Multiplier = Total Employment / Total Basic Employment.

Interpretation: A multiplier of 2.5 means that for every basic sector
job, the region supports 2.5 total jobs (including non-basic/service jobs).
"""

from typing import Any

from app.census.client import CensusClient
from app.analysis.location_quotient import calculate_lq


async def calculate_multiplier(
    client: CensusClient,
    fips: str,
    year: int,
    naics_level: int = 2,
    geo_type: str = "county",
) -> dict[str, Any]:
    """Calculate the Economic Base Multiplier for a region.

    Args:
        client: The Census API client.
        fips: Geographic code (county FIPS or MSA code).
        year: Data year.
        naics_level: NAICS digit level (default 2).
        geo_type: Geography type - "county" or "msa".

    Returns:
        Dict with multiplier, total/basic/non-basic employment,
        and per-industry basic employment breakdown.
    """
    # Get LQ results (dict with "total_employment" and "industries" keys)
    lq_result = await calculate_lq(client, fips, year, naics_level, geo_type)
    lq_industries = lq_result.get("industries", [])

    if not lq_industries:
        return {
            "multiplier": None,
            "total_employment": 0,
            "basic_employment": 0,
            "non_basic_employment": 0,
            "basic_industries": [],
        }

    # Use the total from the LQ calculation (sum of all sectors at NAICS "00")
    total_employment = lq_result.get("total_employment", 0)

    # Identify basic industries (LQ > 1) and calculate basic employment
    basic_industries: list[dict[str, Any]] = []
    total_basic = 0.0

    for record in lq_industries:
        lq = record["lq"]
        emp = record["employment"]

        if lq > 1.0 and emp > 0:
            # Basic employment = emp * (1 - 1/LQ)
            basic_emp = emp * (1 - 1 / lq)
            total_basic += basic_emp

            basic_industries.append({
                "naics": record["naics"],
                "naics_label": record["naics_label"],
                "employment": emp,
                "lq": lq,
                "basic_employment": round(basic_emp, 2),
            })

    # Sort by basic employment descending
    basic_industries.sort(key=lambda x: x["basic_employment"], reverse=True)

    # Calculate multiplier
    multiplier = (
        total_employment / total_basic if total_basic > 0 else None
    )

    return {
        "multiplier": round(multiplier, 4) if multiplier else None,
        "total_employment": total_employment,
        "basic_employment": round(total_basic, 2),
        "non_basic_employment": round(total_employment - total_basic, 2),
        "basic_industry_count": len(basic_industries),
        "basic_industries": basic_industries,
    }
