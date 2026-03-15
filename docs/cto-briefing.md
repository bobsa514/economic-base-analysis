# CTO BRIEFING -- EconBase -- 2026-03-14

## System Health

EconBase is a well-structured, feature-complete portfolio application with clean separation between a FastAPI backend (2,341 LOC Python) and a Next.js 16 frontend (~6,400 LOC TypeScript). The codebase is readable, consistently styled, and well-documented with thorough docstrings and inline comments. The architecture is appropriate for its purpose: a stateless API proxy with computation layer over Census Bureau data. However, the project has **zero automated tests** (backend or frontend), **no CI/CD pipeline**, and several runtime fragilities that would surface under real traffic or demo scenarios. For a portfolio project the quality is above average; for production use, there are meaningful gaps in reliability, observability, and security.

---

## Architecture Assessment

### Strengths

1. **Clean layered design**: Routes -> Analysis -> Census Services -> HTTP Client. Each layer has a single responsibility. The analysis modules (`location_quotient.py`, `shift_share.py`, etc.) are pure calculation functions that take data and return results -- easy to test in isolation.

2. **Consistent API contract**: Pydantic models on the backend and matching TypeScript interfaces on the frontend ensure type safety across the wire. The `normalizeToCountyInfo()` adapter pattern handles the county/MSA/ZIP response shape divergence cleanly.

3. **Smart caching strategy**: TTLCache (1hr, 512 entries) at the HTTP client level means that the same Census API query is never repeated within the cache window, regardless of which analysis endpoint triggered it. The NAICS version detection result is also cached per-year.

4. **Geography abstraction**: The `geo_type` parameter flows consistently from URL query params through routes, analysis functions, and Census API calls. Adding a new geography type (e.g., state) would be a straightforward extension.

5. **Progressive enhancement**: React Query handles loading/error/stale states on the frontend. Skeleton loaders, error boundaries, and empty states are implemented throughout.

### Weaknesses

1. **No database, no persistence**: Everything is in-memory. A Railway restart flushes the cache, requiring cold-start Census API calls. The map-data endpoint can take 10-30 seconds on cold cache because it fetches data for all ~3,200 counties.

2. **Sequential API calls where concurrent would work**: The `/api/analysis/trends` endpoint loops through years sequentially (line 311 in `analysis.py`), making N serial Census API calls instead of concurrent ones. Shift-share fetches 4 datasets sequentially when they could be concurrent.

3. **Single point of failure**: If the Census Bureau API goes down or rate-limits, the entire application is non-functional. There is no fallback, circuit breaker, or offline degradation.

4. **Frontend type drift risk**: The TypeScript interfaces in `types/index.ts` are missing the `geo_type` field that the backend Pydantic models include on most response schemas (`LQResponse`, `ShiftShareResponse`, etc.). This means the frontend silently drops that field.

---

## Code Quality Scorecard

| Area | Grade | Notes |
|---|---|---|
| Backend structure | A- | Clean module separation, consistent patterns across all analysis modules. Minor issue: `calculate_lq` return type annotation says `list[dict]` but actually returns a `dict` with `total_employment` and `industries` keys (line 38 vs line 123 of `location_quotient.py`). |
| Frontend structure | A- | Well-organized component hierarchy. Some duplication in YEARS/NAICS_LEVELS constants across tab components (lq-tab, shift-share-tab, trends-tab all define them independently). |
| Type safety | B+ | Backend: Pydantic models cover all responses. Frontend: TypeScript interfaces match backend schemas but are missing newer fields (`geo_type`). The `normalizeToCountyInfo()` function uses `any` type. |
| Error handling | B | Backend: All route handlers catch `httpx.HTTPStatusError` and return 502. Missing: general exception handler, timeout handling, Census API rate-limit detection. Frontend: error states shown per-component but no global error boundary. |
| Test coverage | F | Zero tests. No pytest, no jest, no testing framework configured. No CI pipeline. |
| Performance | C+ | Map-data endpoint is inherently slow (full table scan of all counties). Trends endpoint is serially sequential. In-memory cache is lost on restart. No CDN, no response compression config. |
| Security | C | CORS defaults to `["*"]`, Census API key in memory but not logged. No rate limiting on public endpoints. No input sanitization beyond basic Pydantic/FastAPI validation. `backend/.env` is properly gitignored. |
| Documentation | A | Excellent CLAUDE.md, thorough CHANGELOG, clean README. Inline docstrings on every function. Census API quirks documented in comments. |

---

## Technical Debt Inventory

1. **[RED] Zero test coverage** (Effort: L)
   No tests exist anywhere. The analysis calculation functions are ideal candidates for unit testing since they are pure functions. A single bad Census API response format change would silently break calculations with no automated detection.

2. **[RED] Return type annotation mismatch in `calculate_lq`** (Effort: S)
   At `backend/app/analysis/location_quotient.py:38`, the function signature declares `-> list[dict[str, Any]]` but the function actually returns `{"total_employment": int, "industries": list}` (a dict, not a list). This is a bug that type checkers would catch. It works at runtime only because callers already access it correctly via `result["industries"]`.

3. **[YELLOW] Legacy files on disk but not in git** (Effort: S)
   The files `app.py`, `eba.py`, `eba_prep_co.pkl` (31MB), `eba_prep_us.pkl`, and `src/` directory are gitignored but still present on disk. The `.pkl` files alone are 33MB of dead weight. These should be deleted from the working directory.

4. **[YELLOW] Sequential Census API calls in trends and shift-share** (Effort: M)
   The trends endpoint at `backend/app/routes/analysis.py:311` loops `for year in range(start_year, end_year + 1)` with sequential `await` calls. With `asyncio.gather()`, a 12-year trends query could complete in ~1 API call time instead of ~12x. Similarly, `shift_share.py` makes 4 sequential fetches that could be parallelized.

5. **[YELLOW] No CI/CD pipeline** (Effort: M)
   No `.github/workflows/` directory exists. No linting, type checking, or build verification on push/PR. Since the project uses conventional commits and branch-based workflow, even a basic GitHub Actions pipeline (lint + type-check + build) would catch regressions.

6. **[YELLOW] CORS wildcard in production** (Effort: S)
   `cors_origins` defaults to `["*"]` in `backend/app/config.py:16`. The `.env.example` mentions setting `CORS_ORIGINS` but it is unclear whether Railway production actually has this set. Should be verified and locked down.

7. **[YELLOW] Hardcoded year defaults scattered across frontend** (Effort: S)
   The year `2023` appears as a default in at least 6 different frontend files (`lq-tab.tsx:70`, `shift-share-tab.tsx:74`, `demographics-tab.tsx:23`, `compare/page.tsx:21`, `industry/[naics]/page.tsx:21`, `use-api.ts:119`). When CBP 2024 data becomes available, all of these need manual updates. Should be a single constant or fetched from the `/api/metadata/years` endpoint.

8. **[YELLOW] Frontend TypeScript types out of sync with backend** (Effort: S)
   The `geo_type` field present in all backend Pydantic response models (`LQResponse`, `ShiftShareResponse`, `DiversificationResponse`, `MultiplierResponse`, `TrendsResponse`, `DemographicsResponse`, `MapDataResponse`) is missing from the corresponding TypeScript interfaces in `frontend/src/types/index.ts`.

9. **[GREEN] Compare page fetches data per-region independently** (Effort: M)
   With 4 regions, the compare page fires ~20 separate API calls (regionInfo + demographics + diversification + multiplier + LQ per region). A batch endpoint could reduce this to 4-5 calls.

10. **[GREEN] Industry page top-regions table fires 20 individual county name lookups** (Effort: M)
    Each row in the top-20 table triggers a separate `/api/geography/{fips}` call. A bulk lookup endpoint would be more efficient.

11. **[GREEN] `map-data` endpoint duplicates LQ calculation logic** (Effort: S)
    The LQ calculation in `analysis.py:460-495` (within the map-data handler) duplicates the formula from `location_quotient.py`. If the LQ formula changes, it must be updated in two places.

12. **[GREEN] `react-simple-maps` peer dependency warning** (Effort: S)
    The `--legacy-peer-deps` flag in `vercel.json` works around a React 19 peer dependency issue. This should be monitored for upstream fixes.

---

## Performance Concerns

- **Map-data cold start: 10-30 seconds.** The `/api/analysis/map-data` endpoint fetches all ~3,200 county records from Census API on first call (cache miss). For LQ metric, it makes 3 separate Census API calls (county industry data, national totals, county totals). This is the single slowest operation in the system and the most likely to timeout on demo.

- **Trends endpoint: O(n) serial API calls.** A 12-year trend (2012-2023) makes 12 sequential Census API calls. With `asyncio.gather()`, this could be reduced to wall-clock time of a single call. Estimated improvement: 3-5x faster.

- **Shift-share: 4 serial fetches.** Fetches local+national data for both start and end years sequentially. These 4 calls are independent and could run concurrently.

- **In-memory cache lost on restart.** Railway free/hobby tier restarts containers periodically. Each restart flushes the entire TTLCache, causing a thundering-herd effect if multiple users hit the app simultaneously after a cold start. A Redis or filesystem cache would persist across restarts.

- **No response compression.** The backend does not configure gzip/brotli middleware. Map-data responses with 3,200 data points are sent uncompressed. Adding `GZipMiddleware` from Starlette would reduce transfer size significantly.

- **Frontend bundle includes unused dependencies.** `framer-motion` is listed in `package.json` but no usage was observed in any component. `@base-ui/react` is imported only transitionally by shadcn. Neither is a performance crisis, but tree-shaking should handle `framer-motion` if it is truly unused.

---

## Recommended Actions (Priority Order)

1. **[P0 / Effort S] Fix `calculate_lq` return type annotation.**
   File: `backend/app/analysis/location_quotient.py:38`. Change `-> list[dict[str, Any]]` to `-> dict[str, Any]`. This is a correctness issue that would cause mypy to flag false errors and confuses future developers.

2. **[P1 / Effort L] Add backend unit tests for analysis modules.**
   Files: `backend/app/analysis/*.py`. These are pure functions that take dicts and return dicts -- ideal for unit testing without mocking the Census API. Mock the `CensusClient.fetch()` method. Cover: LQ calculation with known inputs, shift-share decomposition arithmetic, HHI calculation, multiplier with edge cases (no basic industries, all suppressed data). Minimum viable: 15-20 tests, pytest + pytest-asyncio. Estimated effort: 3-4 hours.

3. **[P1 / Effort M] Add GitHub Actions CI pipeline.**
   Create `.github/workflows/ci.yml` with: (1) Python: install deps, run mypy, run pytest. (2) Frontend: install deps, run `npm run build` (catches TypeScript errors), run ESLint. Trigger on push to any branch. Estimated effort: 1-2 hours.

4. **[P1 / Effort S] Parallelize Census API calls in trends and shift-share.**
   In `backend/app/routes/analysis.py`, replace the sequential year loop (line 311) with `asyncio.gather()`. In `backend/app/analysis/shift_share.py`, wrap the 4 fetch calls in `asyncio.gather()`. This is a significant UX improvement for the trends tab (12 years: ~12s -> ~2s).

5. **[P1 / Effort S] Sync frontend TypeScript types with backend schemas.**
   Add `geo_type: string` field to all response interfaces in `frontend/src/types/index.ts` that have it in the backend Pydantic models.

6. **[P2 / Effort S] Clean up legacy files from disk.**
   Delete `app.py`, `eba.py`, `eba_prep_co.pkl`, `eba_prep_us.pkl`, and `src/` from the working directory. They are gitignored but still take up 33MB+ on disk.

7. **[P2 / Effort S] Centralize year defaults.**
   Create a `constants.ts` file in `frontend/src/lib/` with `DEFAULT_YEAR = 2023` (or better: derive it from `useAvailableYears()` hook). Replace all hardcoded instances.

8. **[P2 / Effort S] Verify production CORS configuration.**
   Check Railway environment variables to confirm `CORS_ORIGINS` is set to the actual Vercel domain instead of wildcard. This is a security concern if the API is publicly accessible.

9. **[P2 / Effort S] Add GZipMiddleware to backend.**
   One line in `main.py`: `app.add_middleware(GZipMiddleware, minimum_size=1000)`. Import from `starlette.middleware.gzip`. Reduces map-data response size by ~70%.

10. **[P2 / Effort S] Add `app.version` to match CHANGELOG.**
    `main.py:79` has `version="1.0.0"` but CHANGELOG says `1.5.1`. Should be kept in sync, ideally from a single `__version__` constant.

---

## Architecture Diagram (Text)

```
                         USERS
                           |
                    [Vercel CDN / Edge]
                           |
                   +-------v--------+
                   |  Next.js 16    |
                   |  (App Router)  |
                   |  - SSR pages   |
                   |  - React Query |
                   |  - Recharts    |
                   |  - react-      |
                   |    simple-maps |
                   +-------+--------+
                           |
                    fetch() to API
                           |
                   +-------v--------+
                   |  FastAPI       |     [Railway $5/mo]
                   |  (async)       |
                   |                |
                   |  Routes ------>+---> /api/analysis/*
                   |       |        |---> /api/geography/*
                   |       v        |---> /api/demographics/*
                   |  Analysis      |---> /api/metadata/*
                   |  (LQ, SS,      |
                   |   Div, Mult)   |
                   |       |        |
                   |       v        |
                   |  Census Client |
                   |  [TTLCache     |
                   |   512 entries  |
                   |   1hr TTL]     |
                   +-------+--------+
                           |
                    httpx async
                           |
           +---------------v----------------+
           |     Census Bureau APIs          |
           |  - CBP (county/MSA/ZIP/US)     |
           |  - ACS 5-year (county/MSA)     |
           |  - Covers 2012-2023            |
           +---------+----------+-----------+
                     |          |
              [FIPS CSV]   [MSA Names]
              (GitHub)     (ACS API)
              ~200KB       ~935 entries
              loaded at    loaded at
              startup      startup

    No database. No persistent storage.
    All state is in-memory and ephemeral.
```

---

## Decision Points for CEO

1. **Testing investment vs. shipping features.** The project has zero tests. Adding a basic test suite (P1 above, ~4 hours) would make future changes safer, especially for the analysis math. However, if the priority is adding new features (e.g., state-level analysis, data export), tests could be deferred. **Recommendation**: Do the tests now. The analysis functions are the core IP and easy to test.

2. **Cache persistence.** The current in-memory cache means every Railway restart causes 10-30s cold starts. Options: (a) Accept it -- it is a portfolio project. (b) Add Redis ($5/mo on Railway) for persistent cache. (c) Pre-warm the cache on startup for common queries. **Recommendation**: For a portfolio project, (c) is the best ROI. Add a startup task that pre-fetches national CBP data for the current year.

3. **Map data performance.** The map-data endpoint is the bottleneck. Options: (a) Accept 10-30s cold start. (b) Pre-compute and store map data as static JSON files (updated monthly). (c) Add a loading progress indicator. **Recommendation**: (b) if you want to impress interviewers with fast load times. Otherwise (a)+(c) is adequate.

---

*Briefing prepared by CTO agent. Next review recommended after test suite is added or before any new feature work.*
