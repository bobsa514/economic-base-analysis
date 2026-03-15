"""Analysis API routes for economic base analysis calculations.

Provides endpoints for Location Quotient, Shift-Share, Diversification,
Multiplier, Time Series Trends, and Choropleth Map Data.

Supports both county-level and MSA-level geography via the `geo_type`
query parameter (default: "county").
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.dependencies import get_census_client
from app.analysis.location_quotient import calculate_lq
from app.analysis.shift_share import calculate_shift_share
from app.analysis.diversification import calculate_diversification
from app.analysis.multiplier import calculate_multiplier
from app.census.cbp import (
    fetch_cbp_county,
    fetch_cbp_msa,
    fetch_cbp_all_msas,
    fetch_cbp_national,
    get_naics_variable,
    get_naics_level,
    MSA_GEO_KEY,
)
from app.config import settings
from app.models.schemas import (
    LQResponse,
    LQIndustry,
    ShiftShareResponse,
    ShiftShareSummary,
    ShiftShareIndustry,
    DiversificationResponse,
    DiversificationIndustry,
    MultiplierResponse,
    BasicIndustry,
    TrendsResponse,
    TrendPoint,
    MapDataResponse,
    MapDataPoint,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


def _validate_year(year: int) -> None:
    """Raise HTTPException if year is out of CBP range."""
    if year < settings.cbp_year_start or year > settings.cbp_year_end:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Year must be between {settings.cbp_year_start} "
                f"and {settings.cbp_year_end}"
            ),
        )


def _validate_naics_level(level: int) -> None:
    """Raise HTTPException if NAICS level is invalid."""
    if level not in (2, 3, 4, 5, 6):
        raise HTTPException(
            status_code=400,
            detail="NAICS level must be 2, 3, 4, 5, or 6",
        )


def _validate_geo_type(geo_type: str) -> None:
    """Raise HTTPException if geo_type is invalid."""
    if geo_type not in ("county", "msa", "zip"):
        raise HTTPException(
            status_code=400,
            detail="geo_type must be 'county', 'msa', or 'zip'",
        )


@router.get(
    "/lq",
    response_model=LQResponse,
    summary="Location Quotient analysis",
)
async def location_quotient(
    fips: str = Query(..., description="5-digit FIPS code, MSA code, or ZIP code"),
    year: int = Query(..., description="Data year"),
    naics_level: int = Query(2, description="NAICS digit level (2-6)"),
    geo_type: str = Query("county", description="Geography type: 'county', 'msa', or 'zip'"),
) -> LQResponse:
    """Calculate Location Quotients for all industries in a county or MSA.

    LQ > 1 means the industry is more concentrated locally than nationally.

    Examples:
    - `/api/analysis/lq?fips=06073&year=2021&naics_level=2` (county)
    - `/api/analysis/lq?fips=41740&year=2021&naics_level=2&geo_type=msa` (MSA)
    """
    _validate_year(year)
    _validate_naics_level(naics_level)
    _validate_geo_type(geo_type)

    client = get_census_client()

    try:
        result = await calculate_lq(client, fips, year, naics_level, geo_type)
    except httpx.HTTPStatusError as e:
        logger.error("Census API error for LQ: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Census API error: {e.response.status_code}",
        )

    industries = result["industries"]
    return LQResponse(
        fips=fips,
        geo_type=geo_type,
        year=year,
        naics_level=naics_level,
        total_employment=result["total_employment"],
        total_industries=len(industries),
        industries=[LQIndustry(**r) for r in industries],
    )


@router.get(
    "/shift-share",
    response_model=ShiftShareResponse,
    summary="Shift-Share analysis",
)
async def shift_share(
    fips: str = Query(..., description="5-digit FIPS code, MSA code, or ZIP code"),
    year_start: int = Query(..., description="Base year"),
    year_end: int = Query(..., description="Comparison year"),
    naics_level: int = Query(2, description="NAICS digit level (2-6)"),
    geo_type: str = Query("county", description="Geography type: 'county', 'msa', or 'zip'"),
) -> ShiftShareResponse:
    """Decompose employment change into national, industry, and competitive effects.

    Examples:
    - `/api/analysis/shift-share?fips=06073&year_start=2015&year_end=2021&naics_level=2`
    - `/api/analysis/shift-share?fips=41740&year_start=2015&year_end=2021&geo_type=msa`
    """
    _validate_year(year_start)
    _validate_year(year_end)
    _validate_naics_level(naics_level)
    _validate_geo_type(geo_type)

    if year_start >= year_end:
        raise HTTPException(
            status_code=400,
            detail="year_start must be before year_end",
        )

    client = get_census_client()

    try:
        results = await calculate_shift_share(
            client, fips, year_start, year_end, naics_level, geo_type
        )
    except httpx.HTTPStatusError as e:
        logger.error("Census API error for shift-share: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Census API error: {e.response.status_code}",
        )

    return ShiftShareResponse(
        fips=fips,
        geo_type=geo_type,
        summary=ShiftShareSummary(**results["summary"]),
        industries=[ShiftShareIndustry(**ind) for ind in results["industries"]],
    )


@router.get(
    "/diversification",
    response_model=DiversificationResponse,
    summary="Diversification Index",
)
async def diversification(
    fips: str = Query(..., description="5-digit FIPS code, MSA code, or ZIP code"),
    year: int = Query(..., description="Data year"),
    naics_level: int = Query(2, description="NAICS digit level (2-6)"),
    geo_type: str = Query("county", description="Geography type: 'county', 'msa', or 'zip'"),
) -> DiversificationResponse:
    """Calculate the economic diversification index (1 - HHI).

    Higher values mean a more diversified economy.

    Examples:
    - `/api/analysis/diversification?fips=06073&year=2021`
    - `/api/analysis/diversification?fips=41740&year=2021&geo_type=msa`
    """
    _validate_year(year)
    _validate_naics_level(naics_level)
    _validate_geo_type(geo_type)

    client = get_census_client()

    try:
        results = await calculate_diversification(
            client, fips, year, naics_level, geo_type
        )
    except httpx.HTTPStatusError as e:
        logger.error("Census API error for diversification: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Census API error: {e.response.status_code}",
        )

    return DiversificationResponse(
        fips=fips,
        geo_type=geo_type,
        year=year,
        hhi=results["hhi"],
        diversification_index=results["diversification_index"],
        total_employment=results["total_employment"],
        industry_count=results["industry_count"],
        industries=[
            DiversificationIndustry(**ind) for ind in results["industries"]
        ],
    )


@router.get(
    "/multiplier",
    response_model=MultiplierResponse,
    summary="Economic Base Multiplier",
)
async def multiplier(
    fips: str = Query(..., description="5-digit FIPS code, MSA code, or ZIP code"),
    year: int = Query(..., description="Data year"),
    naics_level: int = Query(2, description="NAICS digit level (2-6)"),
    geo_type: str = Query("county", description="Geography type: 'county', 'msa', or 'zip'"),
) -> MultiplierResponse:
    """Calculate the Economic Base Multiplier.

    Shows how many total jobs are supported per basic-sector job.

    Examples:
    - `/api/analysis/multiplier?fips=06073&year=2021`
    - `/api/analysis/multiplier?fips=41740&year=2021&geo_type=msa`
    """
    _validate_year(year)
    _validate_naics_level(naics_level)
    _validate_geo_type(geo_type)

    client = get_census_client()

    try:
        results = await calculate_multiplier(
            client, fips, year, naics_level, geo_type
        )
    except httpx.HTTPStatusError as e:
        logger.error("Census API error for multiplier: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Census API error: {e.response.status_code}",
        )

    return MultiplierResponse(
        fips=fips,
        geo_type=geo_type,
        year=year,
        multiplier=results["multiplier"],
        total_employment=results["total_employment"],
        basic_employment=results["basic_employment"],
        non_basic_employment=results["non_basic_employment"],
        basic_industry_count=results["basic_industry_count"],
        basic_industries=[
            BasicIndustry(**ind) for ind in results["basic_industries"]
        ],
    )


async def _fetch_trend_year(client, year, fips, naics, geo_type):
    """Fetch trend data for a single year."""
    try:
        naics_var = await get_naics_variable(client, year)
        url = settings.census_cbp_base.format(year=year)

        # Build geography params based on geo_type
        if geo_type == "zip":
            params = {
                "get": f"{naics_var},{naics_var}_LABEL,EMP,ESTAB,PAYANN",
                "for": f"zip code:{fips}",
                naics_var: naics,
            }
        elif geo_type == "msa":
            params = {
                "get": f"{naics_var},{naics_var}_LABEL,EMP,ESTAB,PAYANN",
                "for": f"{MSA_GEO_KEY}:{fips}",
                naics_var: naics,
            }
        else:
            state_fips = fips[:2]
            county_fips = fips[2:]
            params = {
                "get": f"{naics_var},{naics_var}_LABEL,EMP,ESTAB,PAYANN",
                "for": f"county:{county_fips}",
                "in": f"state:{state_fips}",
                naics_var: naics,
            }

        records = await client.fetch(url, params)
        if records:
            row = records[0]
            naics_var_label = f"{naics_var}_LABEL"
            return year, row.get(naics_var_label, ""), TrendPoint(
                year=year,
                employment=row.get("EMP"),
                establishments=row.get("ESTAB"),
                annual_payroll=row.get("PAYANN"),
            )
        return year, "", TrendPoint(year=year, employment=None, establishments=None, annual_payroll=None)
    except httpx.HTTPStatusError:
        logger.warning("Could not fetch trends data for year %d", year)
        return year, "", TrendPoint(year=year, employment=None, establishments=None, annual_payroll=None)


@router.get(
    "/trends",
    response_model=TrendsResponse,
    summary="Employment trends over time",
)
async def trends(
    fips: str = Query(..., description="5-digit FIPS code, MSA code, or ZIP code"),
    naics: str = Query(..., description="NAICS code (e.g., '72' or '00' for total)"),
    start_year: int = Query(..., description="Start year"),
    end_year: int = Query(..., description="End year"),
    geo_type: str = Query("county", description="Geography type: 'county', 'msa', or 'zip'"),
) -> TrendsResponse:
    """Get employment, establishments, and payroll time series for an industry.

    Examples:
    - `/api/analysis/trends?fips=06073&naics=72&start_year=2015&end_year=2021`
    - `/api/analysis/trends?fips=41740&naics=72&start_year=2015&end_year=2021&geo_type=msa`
    """
    _validate_year(start_year)
    _validate_year(end_year)
    _validate_geo_type(geo_type)

    if start_year > end_year:
        raise HTTPException(
            status_code=400,
            detail="start_year must be <= end_year",
        )

    client = get_census_client()

    # Fetch all years in parallel
    results = await asyncio.gather(*[
        _fetch_trend_year(client, year, fips, naics, geo_type)
        for year in range(start_year, end_year + 1)
    ])

    # Sort by year and extract data
    results = sorted(results, key=lambda x: x[0])
    naics_label = next((r[1] for r in results if r[1]), "")
    data_points = [r[2] for r in results]

    return TrendsResponse(
        fips=fips,
        geo_type=geo_type,
        naics=naics,
        naics_label=naics_label,
        data=data_points,
    )


@router.get(
    "/map-data",
    response_model=MapDataResponse,
    summary="Choropleth map data for all counties or MSAs",
)
async def map_data(
    year: int = Query(..., description="Data year"),
    naics: str = Query("00", description="NAICS code"),
    metric: str = Query("employment", description="'lq' or 'employment'"),
    geo_type: str = Query("county", description="Geography type: 'county', 'msa', or 'zip'"),
) -> MapDataResponse:
    """Get LQ or employment data for all counties (or MSAs) in one year.

    Used for rendering choropleth maps. This endpoint fetches national
    data and then queries geography-level data for the specified industry.

    Note: This endpoint makes many API calls and may be slow on first request.
    Subsequent requests benefit from caching.

    Examples:
    - `/api/analysis/map-data?year=2021&naics=72&metric=lq`
    - `/api/analysis/map-data?year=2021&naics=72&metric=lq&geo_type=msa`
    """
    _validate_year(year)
    _validate_geo_type(geo_type)

    if metric not in ("lq", "employment"):
        raise HTTPException(
            status_code=400,
            detail="metric must be 'lq' or 'employment'",
        )

    client = get_census_client()

    try:
        naics_var = await get_naics_variable(client, year)
        url = settings.census_cbp_base.format(year=year)

        if geo_type == "msa":
            # --- MSA map data ---
            # Fetch all MSAs for the given NAICS code
            msa_records = await fetch_cbp_all_msas(client, year, naics)

            # For LQ metric, also need national totals and MSA totals
            national_total_emp = 0
            national_industry_emp = 0

            if metric == "lq":
                # Get national total employment
                nat_total_params = {
                    "get": f"{naics_var},EMP",
                    "for": "us:*",
                    naics_var: "00",
                }
                nat_total = await client.fetch(url, nat_total_params)
                if nat_total:
                    national_total_emp = nat_total[0].get("EMP", 0) or 0

                # Get national industry employment
                if naics != "00":
                    nat_ind_params = {
                        "get": f"{naics_var},EMP",
                        "for": "us:*",
                        naics_var: naics,
                    }
                    nat_ind = await client.fetch(url, nat_ind_params)
                    if nat_ind:
                        national_industry_emp = nat_ind[0].get("EMP", 0) or 0

                # Get MSA-level total employment for each MSA
                msa_totals = await fetch_cbp_all_msas(client, year, "00")
                msa_total_map: dict[str, int] = {}
                for rec in msa_totals:
                    msa_code = rec.get("msa", "")
                    emp = rec.get("EMP")
                    if emp is not None:
                        msa_total_map[msa_code] = emp

            data_points: list[MapDataPoint] = []
            national_share = (
                national_industry_emp / national_total_emp
                if national_total_emp > 0 and metric == "lq" and naics != "00"
                else 0
            )

            for record in msa_records:
                msa_code = record.get("msa", "")
                emp = record.get("EMP")

                if metric == "employment":
                    data_points.append(MapDataPoint(
                        fips=msa_code,
                        value=float(emp) if emp is not None else None,
                        employment=emp,
                    ))
                else:  # lq
                    msa_total = msa_total_map.get(msa_code, 0)
                    if (
                        emp is not None
                        and msa_total > 0
                        and national_share > 0
                    ):
                        local_share = emp / msa_total
                        lq = local_share / national_share
                        data_points.append(MapDataPoint(
                            fips=msa_code,
                            value=round(lq, 4),
                            employment=emp,
                        ))
                    else:
                        data_points.append(MapDataPoint(
                            fips=msa_code,
                            value=None,
                            employment=emp,
                        ))

        else:
            # --- County map data (original logic) ---
            # Fetch all counties at once using wildcard geography
            params = {
                "get": f"{naics_var},{naics_var}_LABEL,EMP",
                "for": "county:*",
                "in": "state:*",
                naics_var: naics,
            }
            county_records = await client.fetch(url, params)

            # For LQ metric, also need national total and industry employment
            national_total_emp = 0
            national_industry_emp = 0

            if metric == "lq":
                # Get national total employment
                nat_total_params = {
                    "get": f"{naics_var},EMP",
                    "for": "us:*",
                    naics_var: "00",
                }
                nat_total = await client.fetch(url, nat_total_params)
                if nat_total:
                    national_total_emp = nat_total[0].get("EMP", 0) or 0

                # Get national industry employment
                if naics != "00":
                    nat_ind_params = {
                        "get": f"{naics_var},EMP",
                        "for": "us:*",
                        naics_var: naics,
                    }
                    nat_ind = await client.fetch(url, nat_ind_params)
                    if nat_ind:
                        national_industry_emp = nat_ind[0].get("EMP", 0) or 0

                # Also need county-level total employment for LQ
                county_total_params = {
                    "get": f"{naics_var},EMP",
                    "for": "county:*",
                    "in": "state:*",
                    naics_var: "00",
                }
                county_totals = await client.fetch(url, county_total_params)
                county_total_map: dict[str, int] = {}
                for rec in county_totals:
                    cfips = rec.get("state", "") + rec.get("county", "")
                    emp = rec.get("EMP")
                    if emp is not None:
                        county_total_map[cfips] = emp

            data_points: list[MapDataPoint] = []
            national_share = (
                national_industry_emp / national_total_emp
                if national_total_emp > 0 and metric == "lq" and naics != "00"
                else 0
            )

            for record in county_records:
                cfips = record.get("state", "") + record.get("county", "")
                emp = record.get("EMP")

                if metric == "employment":
                    data_points.append(MapDataPoint(
                        fips=cfips,
                        value=float(emp) if emp is not None else None,
                        employment=emp,
                    ))
                else:  # lq
                    county_total = county_total_map.get(cfips, 0)
                    if (
                        emp is not None
                        and county_total > 0
                        and national_share > 0
                    ):
                        local_share = emp / county_total
                        lq = local_share / national_share
                        data_points.append(MapDataPoint(
                            fips=cfips,
                            value=round(lq, 4),
                            employment=emp,
                        ))
                    else:
                        data_points.append(MapDataPoint(
                            fips=cfips,
                            value=None,
                            employment=emp,
                        ))

    except httpx.HTTPStatusError as e:
        logger.error("Census API error for map data: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Census API error: {e.response.status_code}",
        )

    return MapDataResponse(
        year=year,
        naics=naics,
        metric=metric,
        geo_type=geo_type,
        count=len(data_points),
        data=data_points,
    )
