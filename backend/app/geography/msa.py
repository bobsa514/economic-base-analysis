"""MSA (Metropolitan Statistical Area) name lookup and search.

Downloads MSA names from the Census ACS API at startup and provides
in-memory search by MSA name or code. MSA codes are 5-digit strings.

The Census API geography string for MSA is:
    "metropolitan statistical area/micropolitan statistical area"
"""

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# The Census API geography identifier for MSAs (very long string)
MSA_GEO_KEY = "metropolitan statistical area/micropolitan statistical area"


class MSALookup:
    """In-memory MSA name lookup with name search."""

    def __init__(self) -> None:
        # Dict mapping MSA code -> MSA name
        self._data: dict[str, str] = {}

    async def load(self) -> None:
        """Download MSA names from Census ACS API.

        Uses the ACS 5-year API to get NAME for all MSAs.
        Called once at application startup.
        """
        url = settings.census_acs_detail_base.format(year=2023)
        params = {
            "get": "NAME",
            "for": f"{MSA_GEO_KEY}:*",
            "key": settings.census_api_key,
        }

        logger.info("Downloading MSA names from Census ACS API...")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()

            raw: list[list[str]] = response.json()

            if not raw or len(raw) < 2:
                logger.warning("No MSA data returned from Census API")
                return

            # First row is headers, e.g.:
            # ["NAME", "metropolitan statistical area/micropolitan statistical area"]
            headers = raw[0]

            # Find the column indices
            name_idx = headers.index("NAME")
            msa_idx = headers.index(MSA_GEO_KEY)

            for row in raw[1:]:
                msa_code = row[msa_idx]
                msa_name = row[name_idx]
                self._data[msa_code] = msa_name

            logger.info("Loaded %d MSA entries", len(self._data))

        except Exception as e:
            logger.error("Failed to load MSA data: %s", e)
            # Non-fatal: app can still work for county-level analysis
            logger.warning("MSA search will be unavailable")

    def search(self, query: str, limit: int = 10) -> list[dict[str, Any]]:
        """Search MSAs by name (case-insensitive substring match).

        Args:
            query: Search string (e.g., "san diego", "new york").
            limit: Maximum results to return.

        Returns:
            List of matching MSA records with code, name fields.
        """
        if not self._data:
            return []

        query_lower = query.lower().strip()
        if not query_lower:
            return []

        # Split query into tokens for multi-word matching
        tokens = query_lower.split()

        results: list[dict[str, Any]] = []
        for code, name in self._data.items():
            name_lower = name.lower()
            # All tokens must match
            if all(token in name_lower for token in tokens):
                results.append({
                    "code": code,
                    "name": name,
                })
                if len(results) >= limit:
                    break

        return results

    def get_by_code(self, code: str) -> dict[str, Any] | None:
        """Look up an MSA by its 5-digit code.

        Args:
            code: 5-digit MSA code (e.g., "41740" for San Diego).

        Returns:
            MSA record dict with code and name, or None if not found.
        """
        name = self._data.get(code)
        if name is None:
            return None
        return {"code": code, "name": name}

    @property
    def is_loaded(self) -> bool:
        """Check if MSA data has been loaded."""
        return len(self._data) > 0

    @property
    def count(self) -> int:
        """Number of MSAs loaded."""
        return len(self._data)
