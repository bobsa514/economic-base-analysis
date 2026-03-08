# Changelog

All notable changes to this project will be documented in this file.

## [1.4.1] - 2026-03-08

### Fixed
- **Compare page MSA/ZIP support** — Compare page now tracks `geoType` per region and passes it to all API hooks. Previously MSA and ZIP regions showed all N/A because queries defaulted to county geography.
- **MSA search returning empty results** — Backend returns MSA results as `{code, name}` but frontend expected `{fips, county_name, ...}`. Added `normalizeToCountyInfo()` adapter in API client to map all geography response shapes (county/MSA/ZIP) to a consistent `CountyInfo` format.
- **ZIP region info lookup** — Same normalization fix for `{zip_code, name}` responses.
- **Compare URL encoding** — URLs now encode geoType per region as `fips:geo` pairs (e.g., `?regions=06073,41740:msa,98006:zip`)

### Added
- **ZIP data suppression warning** — LQ tab shows informational banner when ZIP-level industry employment is fully suppressed by the Census Bureau, explaining the limitation and suggesting county/MSA alternatives
- **60-second fetch timeout** — API client now uses AbortController with 60s timeout instead of browser default, preventing premature "Failed to fetch" on slow cold-start Census API calls
- **Map data retry** — Map data hook retries twice on failure with 2s delay for cold-cache resilience

## [1.4.0] - 2026-03-08

### Added
- **ZIP code support** — full end-to-end ZIP code analysis via Census CBP `zip code` geography key
  - Backend: `fetch_zbp_zip()` in CBP service, `zip_lookup.py` for ZIP validation/search
  - All analysis endpoints (LQ, shift-share, diversification, multiplier, trends) accept `geo_type=zip`
  - Frontend: "ZIP Codes" third toggle on search bar, `?geo=zip` URL param, green ZIP Code badge on explore page
  - Demographics tab shows informational message for ZIP (ACS not available at ZIP level)
- **Industry page NAICS level selector** — switch between 2-6 digit NAICS levels with industry picker dropdown
- **geoType pass-through** — all explore page tabs (LQ, Shift-Share, Trends, Demographics) now receive and forward `geoType` so MSA and ZIP queries work end-to-end

### Fixed
- **Multiplier endpoint crash** — `calculate_multiplier` was iterating `calculate_lq`'s new dict return format as if it were a flat list, causing `TypeError: string indices must be integers`
- Demographics API call disabled for ZIP codes in explore page (prevents spurious error)

## [1.3.0] - 2026-03-08

### Added
- **Compare page** (`/compare`) — select up to 4 regions, side-by-side metrics table (population, employment, income, diversification), LQ comparison grouped bar chart, industry structure stacked chart, URL-shareable via `?regions=06073,48201,...`
- **Industry page** (`/industry/[naics]`) — national choropleth map colored by LQ for a specific industry, top 20 regions table, national overview cards (total employment, avg LQ, top county)
- **MSA (Metro Area) support** — all backend endpoints accept `geo_type=msa`, MSA name search/lookup loaded at startup (935 MSAs from Census ACS API), frontend geo toggle on search bar, explore page reads `?geo=msa` from URL and shows Metro Area badge
- **Region search enhancements** — `onSelect` callback prop for custom handling (used by Compare page), `showGeoToggle` prop for Counties/Metro Areas toggle, `placeholder` override prop

### Changed
- Default data year updated from 2021 to 2023 across all components
- Font changed from Geist to Inter (body) + JetBrains Mono (code)
- Population pyramid chart: youngest age groups now at bottom (standard orientation)
- Header navigation: added "Industry" link
- Landing page search bar now includes geo toggle (Counties/Metro Areas)

### Backend
- Added `app/geography/msa.py` — MSA name lookup service
- Added `fetch_cbp_msa()` and `fetch_cbp_all_msas()` to CBP service
- All analysis routes accept `geo_type` query parameter (default "county")
- All Pydantic response schemas include `geo_type` field
- Added `MSAInfo` model and updated `GeographySearchResponse` to support both county and MSA results

## [1.2.0] - 2026-03-08

### Added
- **Shift-Share tab** — year range/NAICS selectors, summary cards (national growth, industry mix, competitive effect), waterfall chart, stacked bar chart, sortable data table
- **Demographics tab** — year selector, summary stat cards, population pyramid (mirrored bar chart), income distribution (bar chart), education attainment (donut chart grouped into 5 levels)
- **Industry Trends tab** — NAICS level/industry selectors, multi-line overlay (up to 3 industries), metric toggle (employment/establishments/payroll), per-industry data tables
- **Data-driven landing map** — counties colored by real employment or LQ data from Census API, metric/industry/year controls, diverging color scale for LQ, sequential blue scale for employment, color legend component
- **LQ tab tooltips** — HelpCircle info icons on Local Share, National Share, and LQ column headers with explanatory hover text
- **LQ tab filters** — Min Employment filter, LQ preset dropdown (All/Basic/Specialized/Non-Basic), manual min/max LQ range, "Showing X of Y industries" counter

### Changed
- Explore page: all four tabs now fully implemented (removed placeholder components)
- Map component: now accepts data props and renders real choropleth instead of hash-based fake colors

## [1.1.1] - 2026-03-08

### Fixed
- Aligned frontend TypeScript types to match backend Pydantic schemas exactly
- Fixed all API endpoint paths in frontend client (added `/api/analysis/` and `/api/metadata/` prefixes)
- Fixed field name mismatches: `description` → `naics_label`, `name` → `county_name`, etc.
- Added `total_employment` to backend LQ response for overview cards
- Fixed `null` vs `undefined` type compatibility in OverviewCards component
- Geography search now correctly extracts `.results` array from wrapped response

## [1.1.0] - 2026-03-08

### Added
- **Next.js 15 frontend** (Phase 1) under `frontend/` with TypeScript, Tailwind CSS v4, and shadcn/ui
- Landing page with hero section, interactive US county choropleth map (react-simple-maps), and featured region cards
- Autocomplete county search bar with 300ms debounce using React Query
- Explore page (`/explore/[fips]`) with overview metric cards and tabbed analysis sections
- Location Quotient (LQ) tab: year/NAICS selectors, color-coded horizontal bar chart (Recharts), sortable data table
- About page explaining Economic Base Theory, LQ formula, and data sources
- Compare page placeholder for future multi-region comparison
- Shift-Share, Industry Trends, and Demographics tab placeholders
- Typed API client (`src/lib/api.ts`) and React Query hooks (`src/hooks/use-api.ts`)
- Full TypeScript type definitions for all API responses
- Responsive design with mobile-friendly layouts

## [1.0.0] - 2026-03-08

### Added
- Complete FastAPI backend under `backend/` with async Census Bureau API integration
- **Location Quotient** endpoint (`/api/analysis/lq`) - measures industry concentration vs national average
- **Shift-Share Analysis** endpoint (`/api/analysis/shift-share`) - decomposes employment change into three components
- **Diversification Index** endpoint (`/api/analysis/diversification`) - HHI-based economic diversity measure
- **Economic Base Multiplier** endpoint (`/api/analysis/multiplier`) - basic vs non-basic employment ratio
- **Employment Trends** endpoint (`/api/analysis/trends`) - time series across years
- **Choropleth Map Data** endpoint (`/api/analysis/map-data`) - county-level LQ or employment for mapping
- **Demographics** endpoint (`/api/demographics/{fips}`) - ACS population, income, education profiles
- **Geography Search** endpoint (`/api/geography/search`) - fuzzy county name search across 3,000+ counties
- **Metadata** endpoints for available years and NAICS code lists
- Async HTTP client with in-memory TTL caching (1 hour) for Census API responses
- NAICS version auto-detection (NAICS2017 vs NAICS2012) for older data years
- Pydantic response models for all endpoints with full type hints
- CORS middleware enabled for development
- Swagger UI at `/docs` and ReDoc at `/redoc`
- Health check endpoints at `/` and `/health`
