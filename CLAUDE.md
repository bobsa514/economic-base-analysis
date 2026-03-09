# EconBase - Project Context

## Overview
Interactive Economic Base Analysis tool for US counties, MSAs, and ZIP codes using Census Bureau data.
Portfolio project with a FastAPI backend and Next.js 15 frontend.

## Architecture

### Backend (`backend/`)
- **Framework**: FastAPI with async/await throughout
- **Data source**: Census Bureau APIs (CBP for industry data at county/MSA/ZIP level, ACS for demographics)
- **Caching**: In-memory TTLCache (1 hour) via `cachetools` to reduce Census API calls
- **Geography**: FIPS county data downloaded from GitHub at startup, held in memory with pandas; MSA names downloaded from Census ACS API at startup; ZIP codes validated on-the-fly (5-digit format check, actual validation deferred to Census API)
- **Auth**: Census API key stored in `backend/.env` (gitignored)

### Key Design Decisions
- **Real-time API queries** instead of pre-downloaded bulk files
- **NAICS version auto-detection**: CBP years 2017+ use NAICS2017; earlier years fall back to NAICS2012
- **All Census values are strings**: Client layer handles numeric conversion with null/suppressed value handling
- **Pydantic models for all responses**: Ensures type safety and auto-generates OpenAPI docs

### Data Flow
1. Frontend calls `/api/analysis/lq?fips=06073&year=2021&naics_level=2` (county) or `?fips=41740&year=2021&naics_level=2&geo_type=msa` (MSA) or `?fips=92101&year=2021&naics_level=2&geo_type=zip` (ZIP)
2. Route handler validates params (including `geo_type`), calls analysis function
3. Analysis function calls CBP service for local (county, MSA, or ZIP) + national data
4. CBP service uses CensusClient (with caching) to hit Census API
5. Results computed, wrapped in Pydantic model, returned as JSON

### Geography Types
- **County** (default): Uses 5-digit FIPS codes (e.g., "06073" for San Diego County). Census API geography: `county:{code}` in `state:{code}`.
- **MSA**: Uses 5-digit MSA codes (e.g., "41740" for San Diego metro). Census API geography: `metropolitan statistical area/micropolitan statistical area:{code}`. All endpoints accept `geo_type=msa` query parameter to switch to MSA mode.
- **ZIP**: Uses 5-digit ZIP codes (e.g., "92101" for downtown San Diego). Census API geography: `zip code:{code}` (note: "zip code" with a space, within the CBP endpoint — NOT a separate ZBP endpoint). All analysis endpoints accept `geo_type=zip`. ZIP codes are validated by format only (5 digits); actual existence is confirmed when the Census API returns data. Demographics (ACS) are not available at ZIP level.

## Commands

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000    # Dev server
```

## Deployment
- **Frontend**: Vercel (free tier), root directory = `frontend/`, env var `NEXT_PUBLIC_API_URL` points to Railway backend
- **Backend**: Railway ($5 tier), root directory = `backend/`, env var `CENSUS_API_KEY` required
- Config files: `vercel.json` (repo root), `backend/railway.toml`, `backend/Procfile`, `backend/nixpacks.toml`
- Railway binds to `$PORT` env var automatically; backend uses `uvicorn --host 0.0.0.0 --port $PORT`
- CORS: defaults to `["*"]`; set `CORS_ORIGINS` env var on Railway to restrict in production

## File Structure (Backend)
- `main.py` - App entry point, lifespan management, CORS, route registration
- `app/config.py` - Pydantic Settings (env vars)
- `app/dependencies.py` - Singleton Census client, FIPS lookup, and MSA lookup
- `app/census/client.py` - Async HTTP client with TTL cache
- `app/census/cbp.py` - CBP data fetching for county, MSA, ZIP, and national + NAICS level detection
- `app/census/acs.py` - ACS demographic data (profile + detailed tables), supports county and MSA
- `app/analysis/` - Pure calculation modules (LQ, shift-share, diversification, multiplier) - all support geo_type param (county, msa, zip)
- `app/geography/fips.py` - County FIPS search (loaded at startup)
- `app/geography/msa.py` - MSA name search (loaded at startup from Census ACS API)
- `app/geography/zip_lookup.py` - ZIP code validation and search (on-the-fly, no startup data needed)
- `app/routes/` - FastAPI routers for each endpoint group
- `app/models/schemas.py` - All Pydantic response models

## Census API Notes
- CBP endpoint: `https://api.census.gov/data/{year}/cbp` (also serves ZIP code / ZBP data via `zip code` geography key)
- ACS 5-year profile: `https://api.census.gov/data/{year}/acs/acs5/profile`
- ACS 5-year detailed: `https://api.census.gov/data/{year}/acs/acs5`
- Response format: list of lists, first row = headers
- EMP/ESTAB/PAYANN are strings; may contain 'N', 'D', 'S' for suppressed data
- NAICS "00" = total for all sectors
- Hyphenated codes like "31-33" are 2-digit sectors
- MSA geography string: `metropolitan statistical area/micropolitan statistical area` (URL-encoded by httpx)
- MSA codes are 5-digit strings (e.g., "41740" for San Diego)
- 935 MSAs total (metro + micro areas)
- ZIP code geography key: `zip code` (with a space, not "zipcode") — lives within the CBP endpoint, NOT a separate `/zbp` endpoint
- ZIP codes are 5-digit strings (e.g., "92101" for downtown San Diego)

### Frontend (`frontend/`)
- **Framework**: Next.js 15 (App Router) with TypeScript and Tailwind CSS v4
- **UI Library**: shadcn/ui (button, card, input, tabs, select, badge, separator, skeleton)
- **Data Fetching**: @tanstack/react-query for caching and state management
- **Map**: react-simple-maps with TopoJSON from us-atlas CDN (client-side only, SSR disabled)
- **Charts**: Recharts (horizontal bar charts for LQ visualization)
- **Routing**: App Router with dynamic `/explore/[fips]` route
- **API Client**: Typed fetch functions in `src/lib/api.ts` hitting backend at `NEXT_PUBLIC_API_URL`

### Frontend Key Design Decisions
- **Server Components by default**: Only components needing browser APIs or interactivity use `"use client"`
- **Map SSR workaround**: `react-simple-maps` can't SSR, so it's wrapped in a client component (`map-section.tsx`) that uses `next/dynamic` with `ssr: false`
- **Debounced search**: Region search autocomplete waits 300ms before hitting the API
- **Light theme only**: Professional color palette (blue-600 primary, slate tones, LQ color scale: red/amber/green)

### Frontend File Structure
- `src/app/` - Pages: landing (`page.tsx`), explore (`explore/[fips]/page.tsx`), compare (`compare/page.tsx`), industry (`industry/[naics]/page.tsx`), about
- `src/components/layout/` - Header and footer
- `src/components/map/` - US county map (client-only) + map-section wrapper
- `src/components/charts/` - LQ bar chart, population pyramid, income distribution, education donut (Recharts)
- `src/components/explore/` - Overview cards, LQ tab, shift-share tab, trends tab, demographics tab
- `src/components/compare/` - Region selector (multi-select with badges), comparison table, LQ comparison chart (grouped bar + stacked industry structure)
- `src/components/industry/` - Industry map wrapper, top regions table
- `src/components/search/` - Autocomplete region search (supports custom onSelect callback and geo type toggle)
- `src/lib/api.ts` - Typed API client with `normalizeToCountyInfo()` adapter for county/MSA/ZIP response shapes, 60s fetch timeout
- `src/hooks/use-api.ts` - React Query hooks (all support optional `geoType` param)
- `src/types/` - TypeScript interfaces + react-simple-maps declarations

## Commands

### Frontend
```bash
cd frontend
npm run dev     # Dev server on :3000
npm run build   # Production build
npm run start   # Serve production build
```

## Known Issues / TODO
- Map data endpoint (`/api/analysis/map-data`) fetches all counties and may be slow on first call
- No rate limiting on Census API calls (relies on caching to stay within limits)
- No database - all data is fetched on demand from Census API
- `react-simple-maps` has peer dep warning with React 19 (installed with `--legacy-peer-deps`)
- Industry page top-regions table fetches county names individually (20 API calls) — could be optimized with a bulk lookup endpoint
- Compare page fetches all data per-region independently — could be optimized with a batch endpoint
- ZIP-level demographics (ACS) not available — demographics endpoint only supports county and MSA
