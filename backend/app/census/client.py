"""Async HTTP client for the Census Bureau API with TTL caching.

All Census API responses come as a list of lists where the first row
contains headers. This client handles:
- Async HTTP requests via httpx
- Response parsing (list-of-lists → list-of-dicts)
- In-memory TTL caching to avoid redundant API calls
- Numeric conversion for employment/establishment/payroll fields
"""

import hashlib
import logging
from typing import Any

import httpx
from cachetools import TTLCache

from app.config import settings

logger = logging.getLogger(__name__)

# Fields that should be converted from strings to integers
NUMERIC_FIELDS = {"EMP", "ESTAB", "PAYANN"}


class CensusClient:
    """Async client for Census Bureau API with built-in caching."""

    def __init__(self) -> None:
        self._http_client: httpx.AsyncClient | None = None
        self._cache: TTLCache = TTLCache(
            maxsize=settings.cache_max_size,
            ttl=settings.cache_ttl_seconds,
        )

    async def startup(self) -> None:
        """Initialize the HTTP client. Call during app startup."""
        self._http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            follow_redirects=True,
        )
        logger.info("Census API client initialized")

    async def shutdown(self) -> None:
        """Close the HTTP client. Call during app shutdown."""
        if self._http_client:
            await self._http_client.aclose()
            logger.info("Census API client closed")

    def _cache_key(self, url: str, params: dict[str, str]) -> str:
        """Generate a deterministic cache key from URL and params."""
        raw = f"{url}|{sorted(params.items())}"
        return hashlib.md5(raw.encode()).hexdigest()

    def _parse_response(self, data: list[list[str]]) -> list[dict[str, Any]]:
        """Convert Census list-of-lists response to list of dicts.

        The first row contains headers, subsequent rows contain data.
        Numeric fields (EMP, ESTAB, PAYANN) are converted to integers,
        with None for missing/suppressed values.
        """
        if not data or len(data) < 2:
            return []

        headers = data[0]
        results: list[dict[str, Any]] = []

        for row in data[1:]:
            record: dict[str, Any] = {}
            for header, value in zip(headers, row):
                if header in NUMERIC_FIELDS:
                    record[header] = self._to_int(value)
                else:
                    record[header] = value
            results.append(record)

        return results

    @staticmethod
    def _to_int(value: str | None) -> int | None:
        """Safely convert a Census string value to int.

        Census API uses various markers for suppressed/missing data:
        None, empty string, 'N', 'D', 'S', 'X', etc.
        """
        if value is None:
            return None
        try:
            return int(value)
        except (ValueError, TypeError):
            return None

    async def fetch(
        self,
        url: str,
        params: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch data from Census API with caching.

        Args:
            url: The Census API endpoint URL.
            params: Query parameters (key is always added automatically).

        Returns:
            Parsed list of dictionaries from the Census response.

        Raises:
            httpx.HTTPStatusError: If the API returns an error status.
            RuntimeError: If the client hasn't been initialized.
        """
        if self._http_client is None:
            raise RuntimeError("CensusClient not initialized. Call startup() first.")

        if params is None:
            params = {}

        # Always include the API key
        params["key"] = settings.census_api_key

        cache_key = self._cache_key(url, params)

        # Return cached result if available
        if cache_key in self._cache:
            logger.debug("Cache hit for %s", url)
            return self._cache[cache_key]

        logger.info("Fetching from Census API: %s", url)
        response = await self._http_client.get(url, params=params)
        response.raise_for_status()

        raw_data: list[list[str]] = response.json()
        parsed = self._parse_response(raw_data)

        # Cache the parsed result
        self._cache[cache_key] = parsed
        return parsed

    async def fetch_raw(
        self,
        url: str,
        params: dict[str, str] | None = None,
    ) -> list[list[str]]:
        """Fetch raw (unparsed) data from Census API with caching.

        Useful when the caller needs direct access to the raw list-of-lists
        format, for example to handle non-standard numeric conversions.

        Args:
            url: The Census API endpoint URL.
            params: Query parameters.

        Returns:
            Raw Census API response as list of lists.
        """
        if self._http_client is None:
            raise RuntimeError("CensusClient not initialized. Call startup() first.")

        if params is None:
            params = {}

        params["key"] = settings.census_api_key
        cache_key = self._cache_key(url + "__raw", params)

        if cache_key in self._cache:
            logger.debug("Cache hit (raw) for %s", url)
            return self._cache[cache_key]

        logger.info("Fetching raw from Census API: %s", url)
        response = await self._http_client.get(url, params=params)
        response.raise_for_status()

        raw_data: list[list[str]] = response.json()
        self._cache[cache_key] = raw_data
        return raw_data
