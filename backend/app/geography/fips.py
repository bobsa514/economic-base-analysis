"""FIPS code lookup and fuzzy search for US counties.

Downloads the county FIPS master file from GitHub at startup and
provides in-memory search by county name, state name, or FIPS code.
"""

import logging
from io import StringIO

import httpx
import pandas as pd

logger = logging.getLogger(__name__)

FIPS_SOURCE_URL = (
    "https://raw.githubusercontent.com/kjhealy/fips-codes/master/county_fips_master.csv"
)


class FIPSLookup:
    """In-memory FIPS code lookup with fuzzy county name search."""

    def __init__(self) -> None:
        self._df: pd.DataFrame | None = None

    async def load(self) -> None:
        """Download and parse the FIPS master file.

        Called once at application startup. The file is small (~200KB)
        so it's fine to hold it entirely in memory.
        """
        logger.info("Downloading FIPS master file from %s", FIPS_SOURCE_URL)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(FIPS_SOURCE_URL)
            response.raise_for_status()

        # Parse CSV - the file uses ISO-8859-1 encoding
        csv_text = response.text
        df = pd.read_csv(StringIO(csv_text), encoding="utf-8")

        # Ensure FIPS is zero-padded to 5 digits
        df["fips"] = df["fips"].apply(lambda x: str(x).zfill(5))

        # Build a clean lookup dataframe
        self._df = df[["fips", "county_name", "state_name"]].copy()
        self._df["full_name"] = (
            self._df["county_name"] + ", " + self._df["state_name"]
        )
        # Pre-compute lowercase for search
        self._df["search_text"] = self._df["full_name"].str.lower()

        logger.info("Loaded %d FIPS entries", len(self._df))

    def search(self, query: str, limit: int = 10) -> list[dict]:
        """Search counties by name (case-insensitive substring match).

        Args:
            query: Search string (e.g., "san diego", "harris", "cook").
            limit: Maximum results to return.

        Returns:
            List of matching county records with fips, county_name,
            state_name, and full_name fields.
        """
        if self._df is None:
            return []

        query_lower = query.lower().strip()
        if not query_lower:
            return []

        # Split query into tokens for multi-word matching
        # e.g., "san diego" matches "San Diego County, California"
        tokens = query_lower.split()

        mask = pd.Series(True, index=self._df.index)
        for token in tokens:
            mask = mask & self._df["search_text"].str.contains(token, na=False)

        matches = self._df[mask].head(limit)
        return matches[["fips", "county_name", "state_name", "full_name"]].to_dict(
            orient="records"
        )

    def get_by_fips(self, fips: str) -> dict | None:
        """Look up a county by its 5-digit FIPS code.

        Args:
            fips: 5-digit FIPS code, zero-padded (e.g., "06073").

        Returns:
            County record dict, or None if not found.
        """
        if self._df is None:
            return None

        fips_padded = fips.zfill(5)
        match = self._df[self._df["fips"] == fips_padded]

        if match.empty:
            return None

        row = match.iloc[0]
        return {
            "fips": row["fips"],
            "county_name": row["county_name"],
            "state_name": row["state_name"],
            "full_name": row["full_name"],
        }

    @property
    def is_loaded(self) -> bool:
        """Check if FIPS data has been loaded."""
        return self._df is not None
