# EconBase Frontend

Next.js frontend for the Economic Base Analysis tool. Provides interactive visualization of Location Quotients, Shift-Share analysis, industry trends, and demographics for U.S. counties and metro areas.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with search bar, interactive US county map, featured regions |
| `/explore/[fips]` | Detailed analysis for a specific county or MSA (LQ, Shift-Share, Trends, Demographics) |
| `/compare?regions=06073,48201` | Side-by-side comparison of up to 4 regions |
| `/industry/[naics]` | Geographic distribution of a specific industry across all counties |
| `/about` | About page |

## Getting Started

```bash
npm install
npm run dev     # Dev server on :3000
npm run build   # Production build
npm run start   # Serve production build
```

Requires the FastAPI backend running on `http://localhost:8000` (or set `NEXT_PUBLIC_API_URL` in `.env.local`).

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **shadcn/ui** (base-ui primitives)
- **Recharts** (charts)
- **react-simple-maps** (choropleth map)
- **@tanstack/react-query** (data fetching + caching)
