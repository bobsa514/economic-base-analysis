"""Geography API routes for county FIPS, MSA code, and ZIP code lookup and search.

Provides endpoints to search for US counties, MSAs, or ZIP codes by name/code
and retrieve geography information.
"""

from fastapi import APIRouter, HTTPException, Query

from app.dependencies import get_fips_lookup, get_msa_lookup
from app.geography.zip_lookup import search_zip, get_zip_info
from app.models.schemas import CountyInfo, MSAInfo, ZIPInfo, GeographySearchResponse

router = APIRouter(prefix="/api/geography", tags=["Geography"])


@router.get(
    "/search",
    response_model=GeographySearchResponse,
    summary="Search counties, MSAs, or ZIP codes",
)
async def search_geography(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=100, description="Max results"),
    geo_type: str = Query(
        "county",
        description="Geography type: 'county', 'msa', or 'zip'",
    ),
) -> GeographySearchResponse:
    """Search for US counties, MSAs, or ZIP codes.

    For ZIP search, query must be a 5-digit number (e.g., "92101").

    Examples:
    - `/api/geography/search?q=san+diego` (county search, default)
    - `/api/geography/search?q=san+diego&geo_type=msa` (MSA search)
    - `/api/geography/search?q=92101&geo_type=zip` (ZIP search)
    - `/api/geography/search?q=harris&limit=5`
    """
    if geo_type not in ("county", "msa", "zip"):
        raise HTTPException(
            status_code=400,
            detail="geo_type must be 'county', 'msa', or 'zip'",
        )

    if geo_type == "zip":
        results = search_zip(q, limit=limit)

        return GeographySearchResponse(
            query=q,
            geo_type="zip",
            count=len(results),
            results=[ZIPInfo(**r) for r in results],
        )
    elif geo_type == "msa":
        msa_lookup = get_msa_lookup()
        results = msa_lookup.search(q, limit=limit)

        return GeographySearchResponse(
            query=q,
            geo_type="msa",
            count=len(results),
            results=[MSAInfo(**r) for r in results],
        )
    else:
        fips_lookup = get_fips_lookup()
        results = fips_lookup.search(q, limit=limit)

        return GeographySearchResponse(
            query=q,
            geo_type="county",
            count=len(results),
            results=[CountyInfo(**r) for r in results],
        )


@router.get(
    "/{code}",
    summary="Get geography info by code",
)
async def get_geography(
    code: str,
    geo_type: str = Query(
        "county",
        description="Geography type: 'county', 'msa', or 'zip'",
    ),
) -> CountyInfo | MSAInfo | ZIPInfo:
    """Look up a county by FIPS code, MSA by code, or ZIP code.

    Examples:
    - `/api/geography/06073` for San Diego County, CA (default county)
    - `/api/geography/41740?geo_type=msa` for San Diego MSA
    - `/api/geography/92101?geo_type=zip` for ZIP 92101
    """
    if geo_type not in ("county", "msa", "zip"):
        raise HTTPException(
            status_code=400,
            detail="geo_type must be 'county', 'msa', or 'zip'",
        )

    if geo_type == "zip":
        if not code.isdigit() or len(code) != 5:
            raise HTTPException(
                status_code=400,
                detail="ZIP code must be exactly 5 digits (e.g., '92101')",
            )

        result = get_zip_info(code)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Invalid ZIP code format: '{code}'",
            )

        return ZIPInfo(**result)
    elif geo_type == "msa":
        if not code.isdigit() or len(code) != 5:
            raise HTTPException(
                status_code=400,
                detail="MSA code must be exactly 5 digits (e.g., '41740')",
            )

        msa_lookup = get_msa_lookup()
        result = msa_lookup.get_by_code(code)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"No MSA found with code '{code}'",
            )

        return MSAInfo(**result)
    else:
        if len(code) != 5 or not code.isdigit():
            raise HTTPException(
                status_code=400,
                detail="FIPS code must be exactly 5 digits (e.g., '06073')",
            )

        fips_lookup = get_fips_lookup()
        result = fips_lookup.get_by_fips(code)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"No county found with FIPS code '{code}'",
            )

        return CountyInfo(**result)
