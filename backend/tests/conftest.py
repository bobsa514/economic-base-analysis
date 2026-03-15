"""Shared fixtures for backend tests.

Provides mock CBP data and patched service functions so tests
never make real HTTP calls to the Census API.
"""

import os

# Set a dummy Census API key before any app code imports Settings
os.environ.setdefault("CENSUS_API_KEY", "test_dummy_key")

import pytest

# ---------------------------------------------------------------------------
# Sample CBP data (already normalised to dict format with integer EMP values,
# matching the output shape of fetch_cbp_county / fetch_cbp_national).
# ---------------------------------------------------------------------------

LOCAL_DATA = [
    {"NAICS": "00", "EMP": 1000, "ESTAB": 100, "PAYANN": 50000, "NAICS_LABEL": "Total"},
    {"NAICS": "31-33", "EMP": 300, "ESTAB": 30, "PAYANN": 18000, "NAICS_LABEL": "Manufacturing"},
    {"NAICS": "44-45", "EMP": 200, "ESTAB": 25, "PAYANN": 8000, "NAICS_LABEL": "Retail Trade"},
    {"NAICS": "72", "EMP": 150, "ESTAB": 20, "PAYANN": 4000, "NAICS_LABEL": "Accommodation & Food"},
    {"NAICS": "54", "EMP": 350, "ESTAB": 25, "PAYANN": 20000, "NAICS_LABEL": "Professional Services"},
]

NATIONAL_DATA = [
    {"NAICS": "00", "EMP": 100000, "ESTAB": 10000, "PAYANN": 5000000, "NAICS_LABEL": "Total"},
    {"NAICS": "31-33", "EMP": 10000, "ESTAB": 1000, "PAYANN": 600000, "NAICS_LABEL": "Manufacturing"},
    {"NAICS": "44-45", "EMP": 20000, "ESTAB": 2500, "PAYANN": 800000, "NAICS_LABEL": "Retail Trade"},
    {"NAICS": "72", "EMP": 15000, "ESTAB": 2000, "PAYANN": 400000, "NAICS_LABEL": "Accommodation & Food"},
    {"NAICS": "54", "EMP": 15000, "ESTAB": 2500, "PAYANN": 900000, "NAICS_LABEL": "Professional Services"},
]


@pytest.fixture
def local_data():
    """Sample local (county-level) CBP data."""
    return [dict(r) for r in LOCAL_DATA]


@pytest.fixture
def national_data():
    """Sample national CBP data."""
    return [dict(r) for r in NATIONAL_DATA]
