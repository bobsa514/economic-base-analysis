"""Tests for the Economic Base Multiplier calculation module."""

from unittest.mock import AsyncMock, patch

import pytest

from app.analysis.multiplier import calculate_multiplier


@pytest.mark.asyncio
async def test_basic_multiplier_with_basic_industries():
    """Region with concentrated industries (LQ > 1) should have multiplier > 1."""
    # Mock the LQ result that calculate_multiplier calls internally
    mock_lq_result = {
        "total_employment": 1000,
        "industries": [
            # Manufacturing: LQ=3.0 → basic_emp = 300 * (1 - 1/3.0) = 200
            {"naics": "31-33", "naics_label": "Manufacturing", "employment": 300, "lq": 3.0,
             "national_employment": 10000, "local_share": 0.3, "national_share": 0.1},
            # Professional: LQ=2.3333 → basic_emp = 350 * (1 - 1/2.3333) ≈ 200.0014...
            {"naics": "54", "naics_label": "Professional Services", "employment": 350, "lq": 2.3333,
             "national_employment": 15000, "local_share": 0.35, "national_share": 0.15},
            # Retail: LQ=1.0 → not basic (LQ not > 1)
            {"naics": "44-45", "naics_label": "Retail Trade", "employment": 200, "lq": 1.0,
             "national_employment": 20000, "local_share": 0.2, "national_share": 0.2},
            # Accommodation: LQ=1.0 → not basic
            {"naics": "72", "naics_label": "Accommodation & Food", "employment": 150, "lq": 1.0,
             "national_employment": 15000, "local_share": 0.15, "national_share": 0.15},
        ],
    }

    with patch(
        "app.analysis.multiplier.calculate_lq",
        new_callable=AsyncMock,
        return_value=mock_lq_result,
    ):
        result = await calculate_multiplier(
            client=None, fips="06073", year=2021, naics_level=2
        )

    assert result["multiplier"] is not None
    assert result["multiplier"] > 1.0
    assert result["total_employment"] == 1000
    assert result["basic_employment"] > 0
    assert result["basic_industry_count"] == 2

    # Verify basic employment formula: emp * (1 - 1/LQ)
    for bi in result["basic_industries"]:
        expected = bi["employment"] * (1 - 1 / bi["lq"])
        assert bi["basic_employment"] == round(expected, 2)


@pytest.mark.asyncio
async def test_no_basic_industries_returns_none_multiplier():
    """When no industry has LQ > 1, multiplier should be None."""
    mock_lq_result = {
        "total_employment": 1000,
        "industries": [
            {"naics": "31-33", "naics_label": "Manufacturing", "employment": 100, "lq": 0.8,
             "national_employment": 10000, "local_share": 0.1, "national_share": 0.125},
            {"naics": "44-45", "naics_label": "Retail Trade", "employment": 200, "lq": 0.9,
             "national_employment": 20000, "local_share": 0.2, "national_share": 0.222},
        ],
    }

    with patch(
        "app.analysis.multiplier.calculate_lq",
        new_callable=AsyncMock,
        return_value=mock_lq_result,
    ):
        result = await calculate_multiplier(
            client=None, fips="06073", year=2021, naics_level=2
        )

    assert result["multiplier"] is None
    assert result["basic_employment"] == 0
    assert result["basic_industries"] == []


@pytest.mark.asyncio
async def test_basic_employment_formula():
    """Verify basic_employment = emp * (1 - 1/LQ) for each basic industry."""
    mock_lq_result = {
        "total_employment": 500,
        "industries": [
            # LQ=2.0 → basic = 200 * (1 - 0.5) = 100
            {"naics": "31-33", "naics_label": "Manufacturing", "employment": 200, "lq": 2.0,
             "national_employment": 10000, "local_share": 0.4, "national_share": 0.2},
            # LQ=5.0 → basic = 100 * (1 - 0.2) = 80
            {"naics": "54", "naics_label": "Professional Services", "employment": 100, "lq": 5.0,
             "national_employment": 2000, "local_share": 0.2, "national_share": 0.04},
        ],
    }

    with patch(
        "app.analysis.multiplier.calculate_lq",
        new_callable=AsyncMock,
        return_value=mock_lq_result,
    ):
        result = await calculate_multiplier(
            client=None, fips="06073", year=2021, naics_level=2
        )

    by_naics = {bi["naics"]: bi for bi in result["basic_industries"]}

    # Manufacturing: 200 * (1 - 1/2) = 100
    assert by_naics["31-33"]["basic_employment"] == 100.0

    # Professional: 100 * (1 - 1/5) = 80
    assert by_naics["54"]["basic_employment"] == 80.0

    # Total basic = 180, multiplier = 500 / 180 ≈ 2.7778
    assert result["basic_employment"] == 180.0
    assert result["multiplier"] == round(500 / 180, 4)
