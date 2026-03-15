"""Tests for the CensusClient helper methods (no HTTP calls needed)."""

import pytest

from app.census.client import CensusClient


@pytest.fixture
def client():
    """Create a CensusClient instance (no startup needed for helper methods)."""
    return CensusClient()


class TestParseResponse:
    """Tests for CensusClient._parse_response."""

    def test_list_of_lists_to_list_of_dicts(self, client):
        """First row as headers, subsequent rows as data dicts."""
        raw = [
            ["NAICS2017", "EMP", "ESTAB", "PAYANN"],
            ["31-33", "5000", "200", "300000"],
            ["44-45", "3000", "150", "120000"],
        ]
        result = client._parse_response(raw)

        assert len(result) == 2
        assert result[0]["NAICS2017"] == "31-33"
        assert result[1]["NAICS2017"] == "44-45"

    def test_numeric_fields_converted_to_int(self, client):
        """EMP, ESTAB, and PAYANN should be converted to integers."""
        raw = [
            ["NAICS2017", "EMP", "ESTAB", "PAYANN"],
            ["00", "150000", "8000", "7500000"],
        ]
        result = client._parse_response(raw)

        assert result[0]["EMP"] == 150000
        assert isinstance(result[0]["EMP"], int)
        assert result[0]["ESTAB"] == 8000
        assert isinstance(result[0]["ESTAB"], int)
        assert result[0]["PAYANN"] == 7500000
        assert isinstance(result[0]["PAYANN"], int)

    def test_suppressed_values_become_none(self, client):
        """Census suppression markers ('N', 'D', 'S') should become None."""
        raw = [
            ["NAICS2017", "EMP", "ESTAB", "PAYANN"],
            ["31-33", "N", "D", "S"],
        ]
        result = client._parse_response(raw)

        assert result[0]["EMP"] is None
        assert result[0]["ESTAB"] is None
        assert result[0]["PAYANN"] is None

    def test_non_numeric_fields_remain_strings(self, client):
        """Fields not in NUMERIC_FIELDS (like NAICS codes) stay as strings."""
        raw = [
            ["NAICS2017", "NAICS2017_LABEL", "EMP"],
            ["54", "Professional Services", "12000"],
        ]
        result = client._parse_response(raw)

        assert result[0]["NAICS2017"] == "54"
        assert isinstance(result[0]["NAICS2017"], str)
        assert result[0]["NAICS2017_LABEL"] == "Professional Services"
        assert isinstance(result[0]["NAICS2017_LABEL"], str)

    def test_empty_response_returns_empty_list(self, client):
        """An empty or header-only response should return an empty list."""
        assert client._parse_response([]) == []
        assert client._parse_response([["NAICS2017", "EMP"]]) == []


class TestToInt:
    """Tests for CensusClient._to_int static method."""

    def test_valid_number(self):
        assert CensusClient._to_int("12345") == 12345

    def test_zero(self):
        assert CensusClient._to_int("0") == 0

    def test_none_input(self):
        assert CensusClient._to_int(None) is None

    def test_suppressed_n(self):
        assert CensusClient._to_int("N") is None

    def test_suppressed_d(self):
        assert CensusClient._to_int("D") is None

    def test_suppressed_s(self):
        assert CensusClient._to_int("S") is None

    def test_empty_string(self):
        assert CensusClient._to_int("") is None

    def test_non_numeric_string(self):
        assert CensusClient._to_int("abc") is None
