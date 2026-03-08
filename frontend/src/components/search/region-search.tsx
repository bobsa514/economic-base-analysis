"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGeographySearch } from "@/hooks/use-api";
import type { CountyInfo } from "@/types";

interface RegionSearchProps {
  /**
   * Optional callback when a region is selected.
   * If provided, navigation is skipped — the caller handles the selection.
   * Used by the Compare page to add regions to a list instead of navigating.
   * Second argument is the geo type ("msa", "zip", or undefined for county).
   */
  onSelect?: (region: CountyInfo, geoType?: string) => void;
  /** Placeholder text override */
  placeholder?: string;
  /** Whether to show the geo type toggle (Counties / Metro Areas / ZIP Codes) */
  showGeoToggle?: boolean;
}

/** Check if a string is a valid 5-digit ZIP code */
function isValidZip(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

/**
 * Autocomplete search bar for counties/MSAs/ZIP codes.
 * Debounces input by 300ms, then queries the backend.
 *
 * Default behavior: clicking a result navigates to /explore/{fips}.
 * When `onSelect` is provided, calls the callback instead.
 * When `showGeoToggle` is true, shows a Counties/Metro Areas/ZIP Codes toggle
 * and appends ?geo=msa or ?geo=zip to the URL for MSA/ZIP selections.
 */
export default function RegionSearch({
  onSelect,
  placeholder,
  showGeoToggle = false,
}: RegionSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [geoType, setGeoType] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce: wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // For ZIP mode, skip the API search — we validate locally instead
  const shouldSearchAPI = geoType !== "zip" && debouncedQuery.length >= 2;
  const { data: results, isLoading } = useGeographySearch(
    shouldSearchAPI ? debouncedQuery : "",
    geoType
  );

  // Build ZIP code suggestions from the typed input (client-side validation)
  const zipSuggestions: CountyInfo[] = useMemo(() => {
    if (geoType !== "zip" || !debouncedQuery.trim()) return [];
    const trimmed = debouncedQuery.trim();
    if (isValidZip(trimmed)) {
      // Show the ZIP as a selectable option using CountyInfo shape
      return [
        {
          fips: trimmed,
          county_name: `ZIP Code ${trimmed}`,
          state_name: "",
          full_name: `ZIP Code ${trimmed}`,
        },
      ];
    }
    // If partially typed digits, show a hint
    if (/^\d{1,4}$/.test(trimmed)) {
      return []; // Not enough digits yet — show nothing
    }
    return [];
  }, [geoType, debouncedQuery]);

  // Merge results: for ZIP mode use zipSuggestions, otherwise use API results
  const displayResults = geoType === "zip" ? zipSuggestions : results;
  const displayLoading = geoType === "zip" ? false : isLoading;

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleSelect = (region: CountyInfo) => {
    setIsOpen(false);
    setQuery("");

    if (onSelect) {
      // Custom handler (used by Compare page)
      onSelect(region, geoType);
    } else {
      // Default: navigate to explore page
      setQuery(region.full_name);
      const geoParam =
        geoType === "msa"
          ? "?geo=msa"
          : geoType === "zip"
            ? "?geo=zip"
            : "";
      router.push(`/explore/${region.fips}${geoParam}`);
    }
  };

  const defaultPlaceholder =
    geoType === "msa"
      ? "Search for a metro area..."
      : geoType === "zip"
        ? "Enter a 5-digit ZIP code..."
        : "Search for a county (e.g., San Diego, Harris)...";

  // Minimum query length to show dropdown (1 digit for ZIP, 2 chars for others)
  const minQueryLength = geoType === "zip" ? 5 : 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Geo type toggle — only shown when enabled */}
      {showGeoToggle && (
        <div className="mb-2 flex rounded-md border border-slate-200 w-fit">
          <button
            onClick={() => setGeoType(undefined)}
            className={`px-3 py-1 text-xs font-medium transition-colors rounded-l-md ${
              geoType == null
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Counties
          </button>
          <button
            onClick={() => setGeoType("msa")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              geoType === "msa"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Metro Areas
          </button>
          <button
            onClick={() => setGeoType("zip")}
            className={`px-3 py-1 text-xs font-medium transition-colors rounded-r-md ${
              geoType === "zip"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            ZIP Codes
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder={placeholder ?? defaultPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="h-12 rounded-xl border-slate-300 bg-white pl-10 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
          aria-label="Search for a region"
          aria-autocomplete="list"
          role="combobox"
          aria-expanded={isOpen && !!displayResults?.length}
        />
      </div>

      {/* Dropdown results */}
      {isOpen && debouncedQuery.length >= minQueryLength && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {displayLoading && (
            <div className="px-4 py-3 text-sm text-slate-500">
              Searching...
            </div>
          )}
          {/* ZIP mode: show hint when input is not yet 5 digits */}
          {geoType === "zip" &&
            !displayLoading &&
            debouncedQuery.trim().length < 5 &&
            /^\d+$/.test(debouncedQuery.trim()) && (
              <div className="px-4 py-3 text-sm text-slate-500">
                Type all 5 digits to search...
              </div>
            )}
          {/* ZIP mode: show error for non-numeric input */}
          {geoType === "zip" &&
            !displayLoading &&
            debouncedQuery.trim().length >= 5 &&
            !isValidZip(debouncedQuery) && (
              <div className="px-4 py-3 text-sm text-slate-500">
                Please enter a valid 5-digit ZIP code
              </div>
            )}
          {!displayLoading &&
            displayResults &&
            displayResults.length === 0 &&
            geoType !== "zip" && (
              <div className="px-4 py-3 text-sm text-slate-500">
                No results found
              </div>
            )}
          {!displayLoading &&
            displayResults?.map((r) => (
              <button
                key={r.fips}
                role="option"
                aria-selected={false}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-blue-50"
                onClick={() => handleSelect(r)}
              >
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="font-medium text-slate-900">
                  {r.county_name}
                </span>
                {r.state_name && (
                  <span className="text-slate-500">{r.state_name}</span>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  {r.fips}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
