# EconBase

**Interactive economic base analysis for U.S. counties, metro areas, and ZIP codes.**

Explore Location Quotients, Shift-Share decompositions, diversification indices, and employment trends — powered by real-time Census Bureau data.

<!-- TODO: Replace with actual screenshot -->
<!-- ![EconBase Screenshot](docs/screenshot.png) -->

[![Frontend](https://img.shields.io/badge/frontend-Next.js_16-black?logo=next.js)](frontend/)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi)](backend/)
[![Data](https://img.shields.io/badge/data-Census_Bureau_API-1a73e8)](https://www.census.gov/data/developers.html)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## What It Does

EconBase answers the question: **what industries define a local economy, and how is it changing?**

| Analysis | What It Tells You |
|---|---|
| **Location Quotient** | Which industries are more concentrated here than the national average |
| **Shift-Share** | Whether job growth is from national trends, industry mix, or local competitive advantage |
| **Diversification Index** | How dependent the economy is on a few industries vs. broadly diversified |
| **Economic Base Multiplier** | How many total jobs are supported per export-sector job |
| **Employment Trends** | How employment, establishments, and payroll have changed over time |
| **Demographics** | Population, income distribution, and education attainment (ACS 5-year) |

Supports **3,200+ counties**, **935 metro areas**, and **ZIP codes**, with NAICS industry detail from 2-digit sectors down to 6-digit national industries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, react-simple-maps |
| Backend | FastAPI, httpx (async), Pydantic, pandas |
| Data | Census Bureau CBP + ACS APIs, queried in real-time with in-memory TTL caching |
| Hosting | Vercel (frontend) · Railway (backend) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- [Census API key](https://api.census.gov/data/key_signup.html) (free)

### Backend

```bash
cd backend
cp .env.example .env          # Add your CENSUS_API_KEY
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs at [localhost:8000/docs](http://localhost:8000/docs).

### Frontend

```bash
cd frontend
cp .env.example .env.local    # Points to localhost:8000 by default
npm install --legacy-peer-deps
npm run dev
```

Open [localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── frontend/          Next.js app (pages, components, hooks, API client)
│   └── src/
│       ├── app/       Pages: landing, explore/[fips], compare, industry/[naics], about
│       ├── components/ Map, charts, search, explore tabs, compare views
│       ├── hooks/     React Query hooks for all endpoints
│       └── lib/       Typed API client with geography normalization
│
├── backend/           FastAPI server
│   ├── app/
│   │   ├── census/    Async Census API client (CBP + ACS) with TTL cache
│   │   ├── analysis/  LQ, shift-share, diversification, multiplier calculations
│   │   ├── geography/ FIPS, MSA, and ZIP code search/lookup
│   │   └── routes/    API route handlers
│   └── main.py        App entry point
```

---

## Deployment

| Service | Directory | Key Config |
|---|---|---|
| **Vercel** (frontend) | `frontend/` | Set env var `NEXT_PUBLIC_API_URL` to your backend URL |
| **Railway** (backend) | `backend/` | Set env var `CENSUS_API_KEY` |

See `.env.example` in each directory for all options.

---

## Data Sources

- [County Business Patterns (CBP)](https://www.census.gov/programs-surveys/cbp.html) — Employment, establishments, payroll by industry (2012–2023). Serves county, MSA, and ZIP data.
- [American Community Survey (ACS) 5-Year](https://www.census.gov/programs-surveys/acs) — Demographics, income, education (county and MSA).
- [FIPS county codes](https://github.com/kjhealy/fips-codes) — Geographic identifiers for 3,200+ U.S. counties.

---

## License

[MIT](LICENSE)
