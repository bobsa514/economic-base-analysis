## GTM BRIEFING -- EconBase -- 2026-03-14

### Positioning

EconBase should be positioned as **both** a portfolio piece and a genuinely useful open-source tool -- these two goals are not in conflict. The portfolio angle is what drives the founder's immediate career objective. The "useful tool" angle is what gives the project staying power on GitHub, HN, and LinkedIn, and what earns stars that validate the portfolio claim.

**Primary positioning (for hiring managers):**
A full-stack data application built by a single engineer -- real-time API integration, async backend, choropleth maps, and six distinct analytical algorithms -- demonstrating the ability to take a domain concept (economic base theory) all the way from data pipeline to polished UI.

**Secondary positioning (for users and the internet):**
A free, no-login-required alternative to paid regional economic intelligence tools (like IMPLAN, EMSI/Lightcast), built on public Census data and fully open source.

The single most important positioning decision: do not let this look like a tutorial project. It already isn't one -- but without explicit framing, a skimming hiring manager may not immediately see the difference.

---

### Target Audiences

| Audience | What They Care About | How EconBase Appeals |
|---|---|---|
| Hiring managers (full-stack / data eng) | Evidence of system design, API integration, real data | 11 async endpoints, Census API pipeline, TTL caching, Pydantic schemas, deployed on Vercel + Railway |
| Hiring managers (frontend / UI focus) | Polish, component architecture, state management | React Query, shadcn/ui, choropleth map, responsive tabs, skeleton loading states |
| Economic development professionals | Answering "what industries does my region specialize in?" | LQ, Shift-Share, Multiplier -- the standard toolkit, free, no account needed |
| Urban planners and policy researchers | Quick access to CBP + ACS data without coding | Covers 3,200+ counties, 935 MSAs, and ZIP codes, 2012-2023 range |
| Data journalism (local reporters) | Visualizing local economic change simply | Interactive map, shareable URLs per region |
| GitHub / open-source community | Clean code to learn from or fork | MIT license, structured repo, documented architecture |

---

### Current GTM Assets

| Asset | Status | Quality |
|---|---|---|
| README | Exists, recently rewritten | Good structure, clear tables -- missing a screenshot |
| Live demo | Deployed on Vercel + Railway | Works -- most underused asset right now |
| About page | Exists in app | Has LQ formula, methodology, data sources, academic references -- strong credibility signal |
| OpenAPI docs | Auto-generated at /docs on backend | Exists but not linked from README |
| LinkedIn presence | Not used for this project yet | Zero posts about EconBase |
| GitHub repo | Exists, clean branch structure | No stars, no description keywords, no topics set |
| Blog / write-up | Does not exist | Highest-leverage missing asset |
| Product Hunt | Not launched | Opportunity |
| HN Show HN | Not posted | Opportunity |

---

### Portfolio Presentation Score

| Dimension | Score | Notes |
|---|---|---|
| First impression | 6/10 | README hero is clean but there is no screenshot. A visitor cannot see what the app looks like without clicking the live link. |
| Technical depth | 9/10 | NAICS version auto-detection, async Census client, TTL caching, geography normalization across three geo types. Needs to be surfaced in the README. |
| Demo-ability | 8/10 | The live app is genuinely impressive -- interactive choropleth, six analysis tabs, compare mode. But Railway cold starts are a risk. |
| Storytelling | 5/10 | No narrative. No "I built this because..." moment. No blog post explaining a design decision. No case study. |
| Differentiation | 8/10 | IMPLAN costs thousands. Census Reporter is read-only. Nothing free does what EconBase does at this granularity. Not stated anywhere public-facing. |

**Overall: 7/10.** The technical substance is strong. The communication layer is the gap.

---

### Recommended GTM Actions (Next 2 Weeks)

1. **Add a screenshot to the README (30 minutes -- do this first)**
   Take a screenshot of the explore page for San Diego (the LQ tab with the bar chart visible), add it to `docs/screenshot.png`, and uncomment the line. Raises first-impression score from 6 to 9.

2. **Write one LinkedIn post about what you discovered using the tool (45 minutes)**
   Do not write "I built EconBase." Write about a finding. Example: "I looked at King County, WA using Census data -- the LQ for aerospace is 4.2, meaning Boeing's supply chain employs 4x more people per capita there than the national average." Include a screenshot. End with the tool link in comments.

3. **Write a "Show HN" post (60 minutes, post on a Tuesday or Wednesday morning)**
   Title: "Show HN: Free tool to run economic base analysis on any U.S. county or metro area." Explain the problem, why existing tools cost thousands of dollars, and what tech decisions were interesting.

4. **Add a "Why I built this" section to the README (30 minutes)**
   One paragraph before the tech stack table. Frame: "Regional economic analysis is normally locked behind expensive tools like IMPLAN or Lightcast. EconBase uses the same public Census data, accessible for free."

5. **Set GitHub repo topics and a one-line description (10 minutes)**
   Topics: `economics`, `census`, `fastapi`, `nextjs`, `data-visualization`, `location-quotient`, `shift-share`. Description: "Interactive economic base analysis for U.S. counties and metro areas -- powered by real-time Census Bureau data."

6. **Pin the repo on your GitHub profile (5 minutes)**

---

### Content Ideas

1. **LinkedIn post: "What does Detroit's economy actually look like in 2023?"**
   Pull the LQ tab for Wayne County, MI. Show manufacturing LQ declining but healthcare rising. Frame as economic transformation visible in Census data.

2. **LinkedIn post: "I built a full-stack app with a real-time government API -- here's the hardest part"**
   Tell the NAICS version auto-detection story. Include a code snippet. Targets engineers who hire engineers.

3. **Blog post (dev.to): "Building a regional economic analysis tool with FastAPI and the Census Bureau API"**
   Document Census API quirks: MSA geography string, ZIP code key with a space, suppressed values as strings. Genuinely useful technical content.

4. **LinkedIn post: "How to read a regional economy in 60 seconds"**
   Short LQ explainer for non-technical audience. Walk through one example. Frame as economic literacy content.

5. **Twitter/X thread: "I explored 10 U.S. cities with economic data -- here's what surprised me"**
   Pick 10 cities, one surprising fact each. Two sentences and a screenshot per city.

---

### Competitive Landscape

| Tool | Price | Coverage | What EconBase Does Differently |
|---|---|---|---|
| IMPLAN | $1,000-$10,000/yr | County + sector | EconBase is free, MIT licensed, uses live Census data |
| Lightcast (EMSI) | $5,000+/yr | County + occupation | No account required |
| Census Reporter | Free | County ACS only | EconBase adds CBP employment + economic analysis methods |
| PolicyMap | $2,500+/yr | County + tract | Open source and self-hostable |
| FRED (St. Louis Fed) | Free | State and MSA time series | EconBase is county-level and industry-level |
| BLS QCEW | Free download | County + industry | Raw data only -- EconBase provides the analysis layer |

The competitive differentiation is clear: EconBase is the only free, no-account-required, web-based tool that combines CBP employment data with Location Quotient, Shift-Share, and Base Multiplier analysis at county and MSA granularity, with a polished interactive UI. This story is not currently told anywhere public-facing.

*Generated: 2026-03-14*
