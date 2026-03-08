"""Shared dependencies for dependency injection across the application.

Manages the lifecycle of shared resources like the HTTP client,
FIPS data, and MSA data that are initialized at startup and reused.
"""

from app.census.client import CensusClient
from app.geography.fips import FIPSLookup
from app.geography.msa import MSALookup

# These are initialized in main.py lifespan
census_client: CensusClient | None = None
fips_lookup: FIPSLookup | None = None
msa_lookup: MSALookup | None = None


def get_census_client() -> CensusClient:
    """Get the shared Census API client instance."""
    if census_client is None:
        raise RuntimeError("Census client not initialized. Server still starting?")
    return census_client


def get_fips_lookup() -> FIPSLookup:
    """Get the shared FIPS lookup instance."""
    if fips_lookup is None:
        raise RuntimeError("FIPS lookup not initialized. Server still starting?")
    return fips_lookup


def get_msa_lookup() -> MSALookup:
    """Get the shared MSA lookup instance."""
    if msa_lookup is None:
        raise RuntimeError("MSA lookup not initialized. Server still starting?")
    return msa_lookup
