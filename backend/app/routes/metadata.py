"""Metadata API routes for available years and NAICS code lists.

Provides endpoints to discover what data is available before
making analysis requests.
"""

import logging

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.dependencies import get_census_client
from app.census.cbp import get_naics_variable, get_naics_level
from app.config import settings
from app.models.schemas import (
    YearsResponse,
    NAICSListResponse,
    NAICSCode,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/metadata", tags=["Metadata"])


@router.get(
    "/years",
    response_model=YearsResponse,
    summary="Available data years",
)
async def available_years() -> YearsResponse:
    """Return the range of available CBP and ACS data years.

    These are the years the Census API has data for.
    CBP: 2012-2023, ACS 5-year: 2012-2023.
    """
    return YearsResponse(
        cbp_years=list(range(settings.cbp_year_start, settings.cbp_year_end + 1)),
        acs_years=list(range(settings.acs_year_start, settings.acs_year_end + 1)),
    )


@router.get(
    "/naics",
    response_model=NAICSListResponse,
    summary="NAICS codes at a given level",
)
async def naics_list(
    level: int = Query(2, ge=2, le=6, description="NAICS digit level"),
    year: int = Query(2021, description="Year to fetch codes from"),
) -> NAICSListResponse:
    """Get all NAICS codes at a specific digit level.

    Fetches the national CBP data for a year and extracts unique
    NAICS codes at the requested level.

    Example: `/api/metadata/naics?level=2&year=2021`
    """
    client = get_census_client()

    try:
        naics_var = await get_naics_variable(client, year)
        url = settings.census_cbp_base.format(year=year)

        params = {
            "get": f"{naics_var},{naics_var}_LABEL,EMP",
            "for": "us:*",
        }

        records = await client.fetch(url, params)

    except httpx.HTTPStatusError as e:
        logger.error("Census API error fetching NAICS list: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Census API error: {e.response.status_code}",
        )

    # Filter to the requested level
    codes: list[NAICSCode] = []
    seen: set[str] = set()

    for record in records:
        naics_code = record.get(naics_var, "")
        naics_label = record.get(f"{naics_var}_LABEL", "")

        if get_naics_level(naics_code) == level and naics_code not in seen:
            codes.append(NAICSCode(code=naics_code, label=naics_label))
            seen.add(naics_code)

    # Sort by code
    codes.sort(key=lambda x: x.code)

    return NAICSListResponse(
        level=level,
        count=len(codes),
        codes=codes,
    )
