"""Application configuration using Pydantic Settings.

Loads environment variables from .env file and provides typed access
to configuration values throughout the application.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    census_api_key: str
    cache_ttl_seconds: int = 3600  # 1 hour default
    cache_max_size: int = 512
    cors_origins: list[str] = ["*"]

    # Census API base URLs
    # Note: ZIP code (ZBP) data is served from the CBP endpoint, not a separate one
    census_cbp_base: str = "https://api.census.gov/data/{year}/cbp"
    census_acs_profile_base: str = (
        "https://api.census.gov/data/{year}/acs/acs5/profile"
    )
    census_acs_detail_base: str = (
        "https://api.census.gov/data/{year}/acs/acs5"
    )

    # Available year ranges
    cbp_year_start: int = 2012
    cbp_year_end: int = 2023
    acs_year_start: int = 2012
    acs_year_end: int = 2023

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


# Singleton instance
settings = Settings()
