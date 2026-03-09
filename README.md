# EconBase - Interactive Economic Base Analysis

A web application for analyzing the economic base of US counties, MSAs, and ZIP codes using Census Bureau data. Provides Location Quotient, Shift-Share, Diversification Index, and Economic Base Multiplier analyses.

## Features

- **Location Quotient (LQ)** - Identify industries concentrated above the national average
- **Shift-Share Analysis** - Decompose employment change into national, industry, and competitive effects
- **Diversification Index** - Measure how diversified a local economy is (1 - HHI)
- **Economic Base Multiplier** - Estimate total jobs supported per basic-sector job
- **Employment Trends** - Time series of employment, establishments, and payroll
- **Demographics** - ACS 5-year population, income, and education profiles
- **Interactive Map** - Data-driven US county choropleth colored by employment or LQ
- **Multi-Region Compare** - Side-by-side comparison of up to 4 regions (counties, MSAs, or ZIPs)
- **Industry Explorer** - National geographic distribution of any NAICS industry with choropleth map
- **County/MSA/ZIP Search** - Fuzzy search across 3,000+ counties, 935 MSAs, and 5-digit ZIP codes
- **NAICS Levels 2-6** - Analyze at any industry detail level

## Architecture

1. **Next.js frontend** (`frontend/`) - Interactive web app with maps, charts, and data tables
2. **FastAPI backend** (`backend/`) - API server that queries the Census Bureau API in real-time

### Frontend Structure

```
frontend/src/
├── app/
│   ├── layout.tsx               # Root layout with header, footer, providers
│   ├── page.tsx                 # Landing page with map + search
│   ├── explore/[fips]/page.tsx  # Region analysis (4 tabs: LQ, shift-share, trends, demographics)
│   ├── compare/page.tsx         # Multi-region side-by-side comparison
│   ├── industry/[naics]/page.tsx # Industry geographic distribution
│   ├── about/page.tsx           # Methodology + data sources
│   └── providers.tsx            # React Query provider
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Header + Footer
│   ├── map/                     # US county choropleth map
│   ├── charts/                  # LQ bar chart, population pyramid, income dist, education donut
│   ├── explore/                 # Overview cards, LQ tab, shift-share, trends, demographics
│   ├── compare/                 # Region selector, comparison table, LQ comparison chart
│   ├── industry/                # Industry map, top regions table
│   └── search/                  # Autocomplete region search (county/MSA/ZIP toggle)
├── hooks/use-api.ts             # React Query hooks
├── lib/api.ts                   # Typed API client
└── types/index.ts               # TypeScript interfaces
```

### Backend Structure

```
backend/
├── main.py                     # FastAPI app entry point
├── requirements.txt
├── .env                        # Census API key (gitignored)
└── app/
    ├── config.py               # Pydantic Settings
    ├── dependencies.py         # Shared dependencies (Census client, FIPS)
    ├── census/
    │   ├── client.py           # Async HTTP client with TTL caching
    │   ├── cbp.py              # County Business Patterns service
    │   └── acs.py              # American Community Survey service
    ├── analysis/
    │   ├── location_quotient.py
    │   ├── shift_share.py
    │   ├── diversification.py
    │   └── multiplier.py
    ├── geography/
    │   ├── fips.py             # FIPS lookup + fuzzy search
    │   ├── msa.py              # MSA name search
    │   └── zip_lookup.py       # ZIP code validation
    ├── routes/
    │   ├── analysis.py         # /api/analysis/* endpoints
    │   ├── geography.py        # /api/geography/* endpoints
    │   ├── demographics.py     # /api/demographics/* endpoints
    │   └── metadata.py         # /api/metadata/* endpoints
    └── models/
        └── schemas.py          # Pydantic response models
```

## Getting Started

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev          # Start dev server on http://localhost:3000
```

Requires the backend API running at `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL` in `.env.local`).

### Backend API

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API docs are available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc`.

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/geography/search?q=san+diego` | Search counties by name |
| `GET /api/geography/search?q=92101&geo_type=zip` | Search ZIP codes |
| `GET /api/geography/{fips}` | County info by FIPS code |
| `GET /api/analysis/lq?fips=06073&year=2021&naics_level=2` | Location Quotient |
| `GET /api/analysis/shift-share?fips=06073&year_start=2015&year_end=2021` | Shift-Share |
| `GET /api/analysis/diversification?fips=06073&year=2021` | Diversification Index |
| `GET /api/analysis/multiplier?fips=06073&year=2021` | Economic Base Multiplier |
| `GET /api/analysis/trends?fips=06073&naics=72&start_year=2015&end_year=2021` | Time series |
| `GET /api/analysis/map-data?year=2021&naics=72&metric=lq` | Choropleth data |
| `GET /api/demographics/{fips}?year=2022` | ACS demographic profile |
| `GET /api/metadata/years` | Available data years |
| `GET /api/metadata/naics?level=2` | NAICS code list |

### Deployment

**Frontend (Vercel):**
1. Import repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL` = your Railway backend URL

**Backend (Railway):**
1. Create new project on [railway.app](https://railway.app)
2. Set **Root Directory** to `backend`
3. Add environment variables: `CENSUS_API_KEY` (required), optionally `CORS_ORIGINS` (JSON array of allowed origins)

See `.env.example` files in each directory for all available configuration options.

## Data Sources

- **County Business Patterns (CBP)**: [Census Bureau CBP API](https://api.census.gov/data/2021/cbp) - Employment, establishments, payroll by industry (2012-2023). Also serves ZIP code-level data (ZBP) via `zip code` geography key.
- **American Community Survey (ACS)**: [Census Bureau ACS API](https://api.census.gov/data/2022/acs/acs5) - Demographics, income, education
- **County FIPS codes**: [kjhealy/fips-codes](https://github.com/kjhealy/fips-codes)

## License

MIT License
