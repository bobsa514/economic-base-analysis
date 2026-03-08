"""ZIP code validation and lookup for ZBP (ZIP Code Business Patterns).

Unlike county FIPS and MSA codes, ZIP codes are validated on-the-fly
by checking against the Census ZBP API. No startup data download is needed
because users type 5-digit ZIP codes directly.

The ZBP API itself acts as the source of truth: if a ZIP code returns
data, it is valid.
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# Match exactly 5 digits
ZIP_PATTERN = re.compile(r"^\d{5}$")


def is_valid_zip_format(zip_code: str) -> bool:
    """Check if a string looks like a valid 5-digit ZIP code.

    Args:
        zip_code: The string to validate.

    Returns:
        True if the string is exactly 5 digits.
    """
    return bool(ZIP_PATTERN.match(zip_code))


def search_zip(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """Search for ZIP codes by query string.

    Since ZIP codes are numeric, this only returns results when
    the query looks like a 5-digit ZIP. There is no name-based
    search for ZIPs (unlike counties or MSAs).

    Args:
        query: Search string. Must be exactly 5 digits to match.
        limit: Maximum results (unused since we return 0 or 1 result).

    Returns:
        List with a single ZIPInfo-compatible dict if query is a valid
        ZIP format, or empty list otherwise.
    """
    query = query.strip()

    if is_valid_zip_format(query):
        # Return the ZIP as a candidate; actual validation happens
        # when the ZBP API is called (if it returns data, the ZIP exists)
        return [{
            "zip_code": query,
            "name": f"ZIP {query}",
        }]

    return []


def get_zip_info(zip_code: str) -> dict[str, Any] | None:
    """Return basic info for a ZIP code.

    Since we don't have a local ZIP-to-name database, we return
    a placeholder name. The real validation is deferred to the
    ZBP API call.

    Args:
        zip_code: 5-digit ZIP code string.

    Returns:
        Dict with zip_code and name, or None if format is invalid.
    """
    if not is_valid_zip_format(zip_code):
        return None

    return {
        "zip_code": zip_code,
        "name": f"ZIP {zip_code}",
    }
