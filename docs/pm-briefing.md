## PM BRIEFING -- EconBase -- 2026-03-14

### Product Status

EconBase is a fully functional, deployed portfolio project that lets users explore the economic structure of any U.S. county (3,200+), metro area (935), or ZIP code through six analytical methods: Location Quotient, Shift-Share decomposition, Diversification Index, Economic Base Multiplier, Employment Trends, and Demographics. The frontend (Next.js 15, TypeScript, Tailwind v4, shadcn/ui) is live on Vercel; the backend (FastAPI, real-time Census Bureau API integration) is live on Railway. All core features shipped as of v1.5.1. The product is in **polish and portfolio-presentation phase** -- the underlying analytical engine works, but there are gaps in demo-readiness, storytelling, and professional finishing touches that will determine whether this project stands out in a hiring context.

### Feature Completeness

| Feature Area | Status | Notes |
|---|---|---|
| Landing page (hero + search + map) | DONE | Data-driven choropleth with metric/industry/year controls. Search supports all 3 geo types. |
| Explore page (LQ tab) | DONE | Year/NAICS selectors, color-coded bar chart, sortable table, filters, tooltips. |
| Explore page (Shift-Share tab) | DONE | Year range selectors, summary cards, waterfall chart, stacked bar, data table. |
| Explore page (Industry Trends tab) | DONE | Multi-industry overlay (up to 3), metric toggle, per-industry data tables. |
| Explore page (Demographics tab) | DONE | Population pyramid, income distribution, education donut. Not available for ZIP. |
| Compare page | DONE | Up to 4 regions, side-by-side table, LQ comparison chart, URL-shareable. |
| Industry page | DONE | National choropleth by LQ, NAICS level selector, industry picker, top 20 table. |
| About page | NEEDS UPDATE | Shows "Coming Soon" badges on Shift-Share and Multiplier -- both are shipped. Stale content. |
| Multi-geography support | DONE | County, MSA, and ZIP all work end-to-end across all analysis endpoints. |
| Backend API (11 endpoints) | DONE | All endpoints support county + MSA + ZIP. Auto-generated Swagger docs at /docs. |
| Deployment | DONE | Frontend on Vercel (free), backend on Railway ($5/mo). |
| README | DONE | Clean, scannable layout. Missing screenshot placeholder still present. |
| Tests | NOT STARTED | No unit tests, integration tests, or E2E tests exist anywhere in the project. |
| SEO / Open Graph metadata | MINIMAL | Only basic title + description in layout.tsx. No per-page metadata, no OG images. |
| Error handling | BASIC | API errors show generic messages. No global error boundary. No offline/retry UX. |
| Mobile responsiveness | PARTIAL | Layout uses responsive breakpoints but header nav has no mobile hamburger menu. Map is not optimized for small screens. |
| LICENSE file | MISSING | README references MIT license, but no LICENSE file exists in the repo. |

### User Experience Gaps

These are issues that would matter to a portfolio reviewer (hiring manager, senior engineer) or a real analyst trying to use the product:

1. **No screenshot in README.** The README has a commented-out placeholder. A portfolio project without a hero screenshot or GIF loses 80% of GitHub visitors in the first 3 seconds. This is the single highest-impact gap for discoverability.

2. **About page has stale "Coming Soon" badges.** Shift-Share Analysis and Economic Base Multiplier both show "Coming Soon" badges even though they have been fully implemented for weeks. This signals carelessness to anyone exploring the app. Two-minute fix.

3. **No mobile navigation.** The header nav links render as a horizontal row with no hamburger menu or collapse behavior on small screens. On narrow phones, the 4 nav items will likely overflow or crowd. Portfolio reviewers often check mobile.

4. **No live demo link in README.** The deployed URLs (Vercel frontend, Railway backend) are not mentioned anywhere in the README or repo description. A reviewer has to clone and run locally to see the product. Major friction.

5. **Cold-start latency is unaddressed in UX.** The Railway backend (hobby tier) sleeps after inactivity. First request can take 10-30 seconds. There is no loading indicator or "waking up" message on the landing page to explain the delay. A reviewer who lands on the page and sees a blank map for 15 seconds will leave.

6. **No guided demo path.** When a new visitor lands, the search bar and map are the only entry points. There is no "Try San Diego County" call-to-action, no walkthrough tooltip, no suggested workflow. The featured region cards exist but are below the fold.

7. **Map data endpoint performance.** Fetching LQ data for all ~3,200 counties on the landing page and industry page is slow (documented in known issues). No progressive loading, no caching headers, no CDN. This affects first impression.

8. **No tests anywhere.** Zero test files in frontend or backend. For a portfolio targeting data science and engineering roles, this is a notable gap. Even a handful of backend unit tests for the analysis functions would demonstrate engineering maturity.

9. **No per-page metadata.** The Explore, Compare, and Industry pages have no page-specific titles or descriptions. If someone shares a URL, the preview will be generic. Minor for portfolio, but signals attention to detail.

10. **Industry page top-regions table makes 20 individual API calls for county names.** Documented in known issues. Causes visible sequential loading and potential rate-limiting on the Census API. Visible to any reviewer who opens the Industry page.

### Suggested Roadmap (Next 4 Weeks)

**Week 1: Demo-Readiness (highest leverage)**

1. **P0 / S** -- **Add live demo URL to README and repo description.** Add the Vercel URL as a clickable link at the top of the README. Add it to the GitHub repo "About" section. Five minutes of work, massive return.

2. **P0 / S** -- **Capture and add a screenshot or animated GIF to README.** Take a clean screenshot of the landing page with a loaded map, or better, a 10-second GIF showing search -> explore -> LQ chart flow. Replace the TODO comment.

3. **P0 / S** -- **Fix About page stale content.** Remove the two "Coming Soon" badges from Shift-Share and Multiplier sections. Update copy to reflect that all 6 analysis methods are live.

4. **P1 / S** -- **Add a LICENSE file.** The README says MIT, so create the file.

**Week 2: First-Impression Polish**

5. **P1 / M** -- **Add cold-start loading state.** When the backend is sleeping, show a "Connecting to data server..." indicator on the landing page instead of an empty map.

6. **P1 / S** -- **Mobile header nav.** Add a hamburger menu for screens below `sm` breakpoint.

7. **P1 / M** -- **README "How It Works" section or architecture diagram.** For engineering-focused portfolio reviewers, a brief architecture diagram demonstrates system design thinking.

**Week 3: Engineering Credibility**

8. **P1 / M** -- **Add backend unit tests for analysis functions.** Write 10-15 tests for the pure calculation functions using pytest with mock Census data.

9. **P2 / M** -- **Bulk county name lookup endpoint.** Replace the 20 individual API calls on the Industry page with a single batch endpoint.

10. **P2 / S** -- **Per-page metadata.** Add dynamic metadata exports to the Explore, Compare, and Industry pages.

**Week 4: Differentiation**

11. **P2 / M** -- **Export/download feature.** Let users download the LQ table or comparison data as CSV.

12. **P2 / L** -- **"Story" or case study page.** Write a short analytical narrative that walks through the tool's output with interpretation.

13. **P3 / L** -- **E2E test with Playwright.** A single happy-path test demonstrates frontend testing capability.

### Product Risks

- **Railway cold start kills first impressions.** If a hiring manager clicks the demo link and stares at a blank screen for 15+ seconds, the project is dead on arrival. Mitigations: health-check ping on page load, or upgrading to a plan that avoids sleep, or pre-warming via a cron ping.

- **Census API dependency is a single point of failure.** The entire product breaks if Census Bureau APIs are down, rate-limited, or change their schema. No fallback data, no cached snapshots, no degraded mode.

- **No tests means refactoring is risky.** The codebase has grown to 11 endpoints and 5 pages with complex data flows. Without tests, any future changes risk silent regressions.

- **Stale content erodes credibility.** The "Coming Soon" badges on the About page and the missing screenshot in README signal "unfinished" to a fast-scanning reviewer.

- **Scope creep temptation.** The product is feature-complete for its portfolio purpose. The highest ROI now is polish, testing, and storytelling -- not new features.

*Generated: 2026-03-14*
