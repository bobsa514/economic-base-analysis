"""Tests for the Location Quotient calculation module."""

from unittest.mock import AsyncMock, patch

import pytest

from app.analysis.location_quotient import calculate_lq


@pytest.mark.asyncio
async def test_basic_lq_calculation(local_data, national_data):
    """Manufacturing (LQ=3.0) and Professional Services (LQ~2.33) are concentrated."""
    with (
        patch("app.analysis.location_quotient.fetch_cbp_county", new_callable=AsyncMock, return_value=local_data),
        patch("app.analysis.location_quotient.fetch_cbp_national", new_callable=AsyncMock, return_value=national_data),
    ):
        result = await calculate_lq(
            client=None, fips="06073", year=2021, naics_level=2
        )

    industries = result["industries"]
    assert result["total_employment"] == 1000

    # Build a lookup by NAICS code
    by_naics = {ind["naics"]: ind for ind in industries}

    # Manufacturing: (300/1000) / (10000/100000) = 3.0
    assert by_naics["31-33"]["lq"] == 3.0
    assert by_naics["31-33"]["employment"] == 300

    # Professional Services: (350/1000) / (15000/100000) ≈ 2.3333
    assert by_naics["54"]["lq"] == 2.3333

    # Retail: (200/1000) / (20000/100000) = 1.0
    assert by_naics["44-45"]["lq"] == 1.0

    # Accommodation: (150/1000) / (15000/100000) = 1.0
    assert by_naics["72"]["lq"] == 1.0


@pytest.mark.asyncio
async def test_empty_data_returns_empty():
    """When no local data is returned, result should be a dict with zero employment."""
    with (
        patch("app.analysis.location_quotient.fetch_cbp_county", new_callable=AsyncMock, return_value=[]),
        patch("app.analysis.location_quotient.fetch_cbp_national", new_callable=AsyncMock, return_value=[]),
    ):
        result = await calculate_lq(
            client=None, fips="00000", year=2021, naics_level=2
        )

    assert result == {"total_employment": 0, "industries": []}


@pytest.mark.asyncio
async def test_suppressed_data_handled(national_data):
    """Industries with None employment (suppressed) are skipped gracefully."""
    local_with_suppressed = [
        {"NAICS": "00", "EMP": 500, "NAICS_LABEL": "Total"},
        {"NAICS": "31-33", "EMP": None, "NAICS_LABEL": "Manufacturing"},
        {"NAICS": "44-45", "EMP": 200, "NAICS_LABEL": "Retail Trade"},
    ]

    with (
        patch("app.analysis.location_quotient.fetch_cbp_county", new_callable=AsyncMock, return_value=local_with_suppressed),
        patch("app.analysis.location_quotient.fetch_cbp_national", new_callable=AsyncMock, return_value=national_data),
    ):
        result = await calculate_lq(
            client=None, fips="06073", year=2021, naics_level=2
        )

    industries = result["industries"]
    naics_codes = [ind["naics"] for ind in industries]

    # Manufacturing should be absent (suppressed locally)
    assert "31-33" not in naics_codes
    # Retail should still be present
    assert "44-45" in naics_codes


@pytest.mark.asyncio
async def test_results_sorted_by_lq_descending(local_data, national_data):
    """Results must be sorted by LQ value in descending order."""
    with (
        patch("app.analysis.location_quotient.fetch_cbp_county", new_callable=AsyncMock, return_value=local_data),
        patch("app.analysis.location_quotient.fetch_cbp_national", new_callable=AsyncMock, return_value=national_data),
    ):
        result = await calculate_lq(
            client=None, fips="06073", year=2021, naics_level=2
        )

    industries = result["industries"]
    lqs = [ind["lq"] for ind in industries]
    assert lqs == sorted(lqs, reverse=True)


@pytest.mark.asyncio
async def test_naics_00_excluded_from_results(local_data, national_data):
    """The NAICS '00' total row should NOT appear in the results list."""
    with (
        patch("app.analysis.location_quotient.fetch_cbp_county", new_callable=AsyncMock, return_value=local_data),
        patch("app.analysis.location_quotient.fetch_cbp_national", new_callable=AsyncMock, return_value=national_data),
    ):
        result = await calculate_lq(
            client=None, fips="06073", year=2021, naics_level=2
        )

    industries = result["industries"]
    naics_codes = [ind["naics"] for ind in industries]
    assert "00" not in naics_codes
