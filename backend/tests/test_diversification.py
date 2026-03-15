"""Tests for the Diversification Index calculation module."""

from unittest.mock import AsyncMock, patch

import pytest

from app.analysis.diversification import calculate_diversification


@pytest.mark.asyncio
async def test_even_distribution_high_diversification():
    """A perfectly even distribution across 4 industries yields high diversification."""
    even_data = [
        {"NAICS": "00", "EMP": 1000, "NAICS_LABEL": "Total"},
        {"NAICS": "31-33", "EMP": 250, "NAICS_LABEL": "Manufacturing"},
        {"NAICS": "44-45", "EMP": 250, "NAICS_LABEL": "Retail Trade"},
        {"NAICS": "72", "EMP": 250, "NAICS_LABEL": "Accommodation & Food"},
        {"NAICS": "54", "EMP": 250, "NAICS_LABEL": "Professional Services"},
    ]

    with patch(
        "app.analysis.diversification.fetch_cbp_county",
        new_callable=AsyncMock,
        return_value=even_data,
    ):
        result = await calculate_diversification(
            client=None, fips="06073", year=2021, naics_level=2
        )

    # HHI = 4 * (0.25)^2 = 0.25
    assert result["hhi"] == 0.25
    # Diversification = 1 - 0.25 = 0.75
    assert result["diversification_index"] == 0.75
    assert result["industry_count"] == 4


@pytest.mark.asyncio
async def test_single_industry_low_diversification():
    """Economy dominated by one industry has low diversification (high HHI)."""
    concentrated_data = [
        {"NAICS": "00", "EMP": 1000, "NAICS_LABEL": "Total"},
        {"NAICS": "31-33", "EMP": 950, "NAICS_LABEL": "Manufacturing"},
        {"NAICS": "44-45", "EMP": 50, "NAICS_LABEL": "Retail Trade"},
    ]

    with patch(
        "app.analysis.diversification.fetch_cbp_county",
        new_callable=AsyncMock,
        return_value=concentrated_data,
    ):
        result = await calculate_diversification(
            client=None, fips="06073", year=2021, naics_level=2
        )

    # HHI = (0.95)^2 + (0.05)^2 = 0.9025 + 0.0025 = 0.905
    assert result["hhi"] == 0.905
    assert result["diversification_index"] == 0.095
    assert result["industry_count"] == 2


@pytest.mark.asyncio
async def test_hhi_plus_diversification_equals_one():
    """HHI + diversification_index should always equal 1.0."""
    data = [
        {"NAICS": "00", "EMP": 1000, "NAICS_LABEL": "Total"},
        {"NAICS": "31-33", "EMP": 400, "NAICS_LABEL": "Manufacturing"},
        {"NAICS": "44-45", "EMP": 350, "NAICS_LABEL": "Retail Trade"},
        {"NAICS": "72", "EMP": 250, "NAICS_LABEL": "Accommodation & Food"},
    ]

    with patch(
        "app.analysis.diversification.fetch_cbp_county",
        new_callable=AsyncMock,
        return_value=data,
    ):
        result = await calculate_diversification(
            client=None, fips="06073", year=2021, naics_level=2
        )

    assert round(result["hhi"] + result["diversification_index"], 6) == 1.0


@pytest.mark.asyncio
async def test_empty_data_returns_zeros():
    """Empty input data should return zero HHI and diversification index."""
    with patch(
        "app.analysis.diversification.fetch_cbp_county",
        new_callable=AsyncMock,
        return_value=[],
    ):
        result = await calculate_diversification(
            client=None, fips="00000", year=2021, naics_level=2
        )

    assert result["hhi"] == 0.0
    assert result["diversification_index"] == 0.0
    assert result["industry_count"] == 0
    assert result["industries"] == []
