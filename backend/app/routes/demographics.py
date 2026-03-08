"""Demographics API routes for ACS data.

Provides a comprehensive demographic profile for a county or MSA,
including summary statistics, population pyramid, income distribution,
and educational attainment.
"""

import logging

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.dependencies import get_census_client
from app.census.acs import (
    fetch_summary_stats,
    fetch_population_pyramid,
    fetch_income_distribution,
    fetch_education,
)
from app.config import settings
from app.models.schemas import (
    DemographicsResponse,
    PopulationPyramidEntry,
    IncomeDistributionEntry,
    EducationEntry,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/demographics", tags=["Demographics"])


@router.get(
    "/{fips}",
    response_model=DemographicsResponse,
    summary="Demographic profile for a county or MSA",
)
async def demographics(
    fips: str,
    year: int = Query(2022, description="ACS data year"),
    geo_type: str = Query("county", description="Geography type: 'county' or 'msa'"),
) -> DemographicsResponse:
    """Get a comprehensive demographic profile from ACS 5-year estimates.

    Includes:
    - Summary stats (population, median age, income, employment rates)
    - Population pyramid by age and sex
    - Household income distribution
    - Educational attainment levels

    Examples:
    - `/api/demographics/06073?year=2022` (county, default)
    - `/api/demographics/41740?year=2022&geo_type=msa` (MSA)
    """
    if geo_type not in ("county", "msa"):
        raise HTTPException(
            status_code=400,
            detail="geo_type must be 'county' or 'msa'",
        )

    # Validate the code format based on geo_type
    if geo_type == "county":
        if len(fips) != 5 or not fips.isdigit():
            raise HTTPException(
                status_code=400,
                detail="FIPS code must be exactly 5 digits",
            )
    else:  # msa
        if not fips.isdigit() or len(fips) != 5:
            raise HTTPException(
                status_code=400,
                detail="MSA code must be exactly 5 digits",
            )

    if year < settings.acs_year_start or year > settings.acs_year_end:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Year must be between {settings.acs_year_start} "
                f"and {settings.acs_year_end}"
            ),
        )

    client = get_census_client()

    # Fetch all demographic data, passing geo_type through to ACS functions
    try:
        summary = await fetch_summary_stats(client, fips, year, geo_type)
        pyramid = await fetch_population_pyramid(client, fips, year, geo_type)
        income = await fetch_income_distribution(client, fips, year, geo_type)
        education = await fetch_education(client, fips, year, geo_type)
    except httpx.HTTPStatusError as e:
        logger.error("Census ACS API error: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Census ACS API error: {e.response.status_code}",
        )

    return DemographicsResponse(
        fips=fips,
        geo_type=geo_type,
        year=year,
        total_population=summary.get("total_population"),
        median_age=summary.get("median_age"),
        median_household_income=summary.get("median_household_income"),
        employment_population_ratio=summary.get("employment_population_ratio"),
        unemployment_rate=summary.get("unemployment_rate"),
        pct_graduate_degree=summary.get("pct_graduate_degree"),
        population_pyramid=[PopulationPyramidEntry(**p) for p in pyramid],
        income_distribution=[IncomeDistributionEntry(**i) for i in income],
        education=[EducationEntry(**e) for e in education],
    )
