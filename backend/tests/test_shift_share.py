"""Tests for the Shift-Share Analysis calculation module."""

from unittest.mock import AsyncMock, patch

import pytest

from app.analysis.shift_share import calculate_shift_share

# ---------------------------------------------------------------------------
# Test data: two time periods (t0 and t1) for local and national economies
# ---------------------------------------------------------------------------

LOCAL_T0 = [
    {"NAICS": "00", "EMP": 1000, "NAICS_LABEL": "Total"},
    {"NAICS": "31-33", "EMP": 300, "NAICS_LABEL": "Manufacturing"},
    {"NAICS": "44-45", "EMP": 200, "NAICS_LABEL": "Retail Trade"},
    {"NAICS": "72", "EMP": 500, "NAICS_LABEL": "Accommodation & Food"},
]

LOCAL_T1 = [
    {"NAICS": "00", "EMP": 1100, "NAICS_LABEL": "Total"},
    {"NAICS": "31-33", "EMP": 280, "NAICS_LABEL": "Manufacturing"},
    {"NAICS": "44-45", "EMP": 220, "NAICS_LABEL": "Retail Trade"},
    {"NAICS": "72", "EMP": 600, "NAICS_LABEL": "Accommodation & Food"},
]

NATIONAL_T0 = [
    {"NAICS": "00", "EMP": 100000, "NAICS_LABEL": "Total"},
    {"NAICS": "31-33", "EMP": 20000, "NAICS_LABEL": "Manufacturing"},
    {"NAICS": "44-45", "EMP": 30000, "NAICS_LABEL": "Retail Trade"},
    {"NAICS": "72", "EMP": 50000, "NAICS_LABEL": "Accommodation & Food"},
]

NATIONAL_T1 = [
    {"NAICS": "00", "EMP": 110000, "NAICS_LABEL": "Total"},
    {"NAICS": "31-33", "EMP": 18000, "NAICS_LABEL": "Manufacturing"},
    {"NAICS": "44-45", "EMP": 35000, "NAICS_LABEL": "Retail Trade"},
    {"NAICS": "72", "EMP": 57000, "NAICS_LABEL": "Accommodation & Food"},
]


def _patch_fetchers(local_t0, local_t1, national_t0, national_t1):
    """Return a context manager that patches both fetch functions.

    _fetch_local_data is called twice (t0, t1) and fetch_cbp_national twice.
    We use side_effect to return different data for each call.
    """
    return (
        patch(
            "app.analysis.shift_share._fetch_local_data",
            new_callable=AsyncMock,
            side_effect=[local_t0, local_t1],
        ),
        patch(
            "app.analysis.shift_share.fetch_cbp_national",
            new_callable=AsyncMock,
            side_effect=[national_t0, national_t1],
        ),
    )


@pytest.mark.asyncio
async def test_basic_shift_share_decomposition():
    """NG + IM + RC should equal actual change for each industry."""
    patch_local, patch_national = _patch_fetchers(
        LOCAL_T0, LOCAL_T1, NATIONAL_T0, NATIONAL_T1
    )
    with patch_local, patch_national:
        result = await calculate_shift_share(
            client=None, fips="06073", year_start=2018, year_end=2021, naics_level=2
        )

    for ind in result["industries"]:
        decomposed = ind["national_growth"] + ind["industry_mix"] + ind["regional_competitive"]
        assert round(decomposed, 2) == ind["total_change"], (
            f"Decomposition failed for {ind['naics']}: "
            f"NG({ind['national_growth']}) + IM({ind['industry_mix']}) + RC({ind['regional_competitive']}) "
            f"!= total_change({ind['total_change']})"
        )


@pytest.mark.asyncio
async def test_summary_totals_match_industry_sums():
    """Summary NG/IM/RC should equal the sum of per-industry components."""
    patch_local, patch_national = _patch_fetchers(
        LOCAL_T0, LOCAL_T1, NATIONAL_T0, NATIONAL_T1
    )
    with patch_local, patch_national:
        result = await calculate_shift_share(
            client=None, fips="06073", year_start=2018, year_end=2021, naics_level=2
        )

    summary = result["summary"]
    industries = result["industries"]

    sum_ng = round(sum(i["national_growth"] for i in industries), 2)
    sum_im = round(sum(i["industry_mix"] for i in industries), 2)
    sum_rc = round(sum(i["regional_competitive"] for i in industries), 2)

    assert summary["national_growth"] == sum_ng
    assert summary["industry_mix"] == sum_im
    assert summary["regional_competitive"] == sum_rc


@pytest.mark.asyncio
async def test_empty_data_returns_empty_industries():
    """When no local data is returned, industries list should be empty."""
    patch_local, patch_national = _patch_fetchers([], [], [], [])
    with patch_local, patch_national:
        result = await calculate_shift_share(
            client=None, fips="00000", year_start=2018, year_end=2021, naics_level=2
        )

    assert result["industries"] == []
    assert result["summary"] == {}


@pytest.mark.asyncio
async def test_missing_industry_in_t1_skipped():
    """If an industry exists in t0 but not t1, it should be skipped."""
    # Remove Retail Trade from t1 data
    local_t1_partial = [
        {"NAICS": "00", "EMP": 900, "NAICS_LABEL": "Total"},
        {"NAICS": "31-33", "EMP": 280, "NAICS_LABEL": "Manufacturing"},
        # "44-45" intentionally missing
        {"NAICS": "72", "EMP": 600, "NAICS_LABEL": "Accommodation & Food"},
    ]

    patch_local, patch_national = _patch_fetchers(
        LOCAL_T0, local_t1_partial, NATIONAL_T0, NATIONAL_T1
    )
    with patch_local, patch_national:
        result = await calculate_shift_share(
            client=None, fips="06073", year_start=2018, year_end=2021, naics_level=2
        )

    naics_in_result = [ind["naics"] for ind in result["industries"]]
    assert "44-45" not in naics_in_result
    # Other industries should still be present
    assert "31-33" in naics_in_result
    assert "72" in naics_in_result
