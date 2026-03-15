import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calculator,
  Database,
  ExternalLink,
  Search,
  Layers,
  HelpCircle,
  ListOrdered,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowRightLeft,
  Gauge,
} from "lucide-react";

/**
 * About page explaining Economic Base Theory, methodology, NAICS codes,
 * how to use EconBase, analytical tools, data sources, glossary, and references.
 * Static content — no client-side data fetching needed.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">
        About EconBase
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Understanding regional economies through data-driven analysis
      </p>

      {/* Table of contents */}
      <nav className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">On this page</p>
        <ul className="grid grid-cols-1 gap-1 text-sm text-blue-600 sm:grid-cols-2">
          <li><a href="#economic-base-theory" className="hover:underline">Economic Base Theory</a></li>
          <li><a href="#how-to-use" className="hover:underline">How to Use EconBase</a></li>
          <li><a href="#naics-codes" className="hover:underline">Understanding NAICS Codes</a></li>
          <li><a href="#analytical-tools" className="hover:underline">Analytical Tools</a></li>
          <li><a href="#data-sources" className="hover:underline">Data Sources</a></li>
          <li><a href="#glossary" className="hover:underline">Glossary</a></li>
          <li><a href="#references" className="hover:underline">References &amp; Further Reading</a></li>
        </ul>
      </nav>

      <Separator className="my-8" />

      {/* ================================================================
          ECONOMIC BASE THEORY
          ================================================================ */}
      <section id="economic-base-theory" className="mb-12 scroll-mt-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Economic Base Theory
          </h2>
        </div>
        <div className="prose prose-slate max-w-none space-y-4 text-slate-700">
          <p>
            Economic Base Theory divides a regional economy into two sectors:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Basic (export-base) industries</strong> &mdash; sectors
              that produce goods and services primarily for sale outside the
              region. These bring money into the local economy. Think of a car
              factory that ships vehicles nationwide, or a tech company whose
              customers are global.
            </li>
            <li>
              <strong>Non-basic (local-serving) industries</strong> &mdash;
              sectors that serve the local population (retail stores,
              restaurants, healthcare, schools). These recirculate money within
              the economy rather than bringing new money in.
            </li>
          </ul>
          <p>
            The theory holds that growth in basic industries drives overall
            regional growth because export revenue creates demand for local
            services, generating a <em>multiplier effect</em>. When a new
            factory opens and hires 100 workers, those workers spend their
            paychecks locally &mdash; at grocery stores, restaurants, and
            doctors&rsquo; offices &mdash; which creates additional jobs in
            those local-serving sectors.
          </p>
          <p>
            EconBase uses this framework to help you identify which industries
            are driving your region&rsquo;s economy and how it compares to
            national patterns.
          </p>
        </div>
      </section>

      {/* ================================================================
          HOW TO USE ECONBASE
          ================================================================ */}
      <section id="how-to-use" className="mb-12 scroll-mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            How to Use EconBase
          </h2>
        </div>
        <p className="mb-6 text-slate-700">
          EconBase pulls live data from the U.S. Census Bureau to analyze the
          economic structure of any county, metropolitan area, or ZIP code in
          the United States. Here&rsquo;s how to get started:
        </p>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              1
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Search for your region</h3>
              <p className="mt-1 text-sm text-slate-600">
                Use the search bar on the home page. Toggle between{" "}
                <Badge variant="outline" className="text-xs">County</Badge>,{" "}
                <Badge variant="outline" className="text-xs">Metro Area</Badge>, or{" "}
                <Badge variant="outline" className="text-xs">ZIP Code</Badge>{" "}
                to search the geography type you want. Start typing a name or
                code and select from the autocomplete results.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              2
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Browse the Overview tab</h3>
              <p className="mt-1 text-sm text-slate-600">
                The Overview tab shows headline metrics at a glance &mdash; total
                employment, number of establishments, annual payroll, and the top
                industries by employment. This gives you a quick snapshot of your
                region&rsquo;s economic profile.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              3
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Explore Location Quotients (LQ)</h3>
              <p className="mt-1 text-sm text-slate-600">
                The LQ tab reveals which industries are <em>specialized</em> in
                your region compared to the national average. Industries with
                LQ &gt; 1.0 are likely export-base industries that drive the
                local economy. You can filter by NAICS level (2-digit through
                6-digit) to drill from broad sectors into specific industries.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              4
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Check Shift-Share analysis</h3>
              <p className="mt-1 text-sm text-slate-600">
                Shift-Share breaks down employment change into three forces:
                national growth, industry trends, and local competitiveness. This
                tells you <em>why</em> employment is changing, not just how much.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              5
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Compare regions side-by-side</h3>
              <p className="mt-1 text-sm text-slate-600">
                Use the <strong>Compare</strong> page to select up to 4 regions and view
                their economic structures side by side. This is useful for
                benchmarking a county against its metro area, or comparing two
                competing regions.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              6
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Dive into a specific industry</h3>
              <p className="mt-1 text-sm text-slate-600">
                The <strong>Industry</strong> page shows a national choropleth
                map highlighting where an industry is concentrated across the
                U.S. You can see the top regions for any NAICS industry and
                understand the geographic distribution of that sector.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ================================================================
          UNDERSTANDING NAICS CODES
          ================================================================ */}
      <section id="naics-codes" className="mb-12 scroll-mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Understanding NAICS Codes
          </h2>
        </div>

        <div className="space-y-4 text-slate-700">
          <p>
            <strong>NAICS</strong> stands for the{" "}
            <em>North American Industry Classification System</em>. It is the
            standard system used by the U.S. Census Bureau (and all federal
            statistical agencies) to categorize every business establishment in
            the country into an industry.
          </p>
          <p>
            NAICS codes are <strong>hierarchical</strong>. They start broad and
            get more specific as you add digits:
          </p>
        </div>

        {/* NAICS hierarchy table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Digits</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Level</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Example Code</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Example Name</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-mono">2-digit</td>
                <td className="px-4 py-2">Sector</td>
                <td className="px-4 py-2 font-mono">72</td>
                <td className="px-4 py-2">Accommodation &amp; Food Services</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-mono">3-digit</td>
                <td className="px-4 py-2">Subsector</td>
                <td className="px-4 py-2 font-mono">722</td>
                <td className="px-4 py-2">Food Services &amp; Drinking Places</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-mono">4-digit</td>
                <td className="px-4 py-2">Industry Group</td>
                <td className="px-4 py-2 font-mono">7225</td>
                <td className="px-4 py-2">Restaurants &amp; Other Eating Places</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-mono">5-digit</td>
                <td className="px-4 py-2">Industry</td>
                <td className="px-4 py-2 font-mono">72251</td>
                <td className="px-4 py-2">Restaurants &amp; Other Eating Places</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-mono">6-digit</td>
                <td className="px-4 py-2">National Industry</td>
                <td className="px-4 py-2 font-mono">722511</td>
                <td className="px-4 py-2">Full-Service Restaurants</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4 text-slate-700">
          <p>
            <strong>In EconBase</strong>, the default view shows{" "}
            <strong>2-digit sectors</strong> (20 broad categories covering the
            entire economy). You can drill down to 3, 4, 5, or 6-digit levels
            using the NAICS level filter on the LQ and Shift-Share tabs. More
            digits = more specific industries, but also more data suppression
            from the Census Bureau in smaller regions.
          </p>
        </div>

        <Card className="mt-4 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Looking up a NAICS code?</strong> Visit the official{" "}
              <a
                href="https://www.census.gov/naics/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600"
              >
                census.gov/naics
              </a>{" "}
              search tool to find the code for any industry. You can also browse
              available NAICS codes directly in EconBase via the Metadata
              section of the API.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ================================================================
          ANALYTICAL TOOLS
          ================================================================ */}
      <section id="analytical-tools" className="mb-12 scroll-mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Analytical Tools
          </h2>
        </div>
        <p className="mb-6 text-slate-700">
          EconBase provides five complementary analytical methods. Each one
          answers a different question about a region&rsquo;s economy.
        </p>

        <div className="space-y-6">
          {/* ---- Location Quotient ---- */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Location Quotient (LQ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                <strong>Question it answers:</strong>{" "}
                <em>&ldquo;Which industries are more concentrated here than
                the national average?&rdquo;</em>
              </p>
              <p className="text-sm text-slate-600">
                The Location Quotient compares your region&rsquo;s share of
                employment in an industry to the nation&rsquo;s share. It is
                the most fundamental tool in economic base analysis.
              </p>

              {/* LQ formula card */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <div className="text-center">
                  <div className="inline-block rounded-lg bg-white px-8 py-6 font-mono text-lg shadow-sm border border-slate-200">
                    <div className="mb-2 text-slate-600">
                      LQ<sub>i</sub> =
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-center">
                        <div className="border-b border-slate-400 pb-1 text-sm">
                          e<sub>i</sub> / e
                        </div>
                        <div className="pt-1 text-sm">
                          E<sub>i</sub> / E
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    <p>
                      Where <strong>e<sub>i</sub></strong> = local employment in
                      industry i, <strong>e</strong> = total local employment
                    </p>
                    <p>
                      <strong>E<sub>i</sub></strong> = national employment in
                      industry i, <strong>E</strong> = total national employment
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">LQ &lt; 1.0</p>
                  <p className="mt-1 text-xs text-red-700">
                    Industry is <strong>under-represented</strong> locally
                    compared to the nation. The region may import these
                    goods/services.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800">LQ &asymp; 1.0</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Industry employment is <strong>proportional</strong> to the
                    national average. The region is self-sufficient in this
                    sector.
                  </p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">LQ &gt; 1.0</p>
                  <p className="mt-1 text-xs text-green-700">
                    Industry is a regional <strong>specialization</strong>.
                    Likely an export-base industry bringing outside revenue in.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-500">
                <strong>Example:</strong> If San Diego County has 5% of its
                workforce in &ldquo;Professional, Scientific &amp; Technical
                Services&rdquo; and the U.S. as a whole has 3%, the LQ would be
                5% / 3% = <strong>1.67</strong> &mdash; meaning San Diego is
                67% more specialized in that sector than the nation.
              </p>
            </CardContent>
          </Card>

          {/* ---- Shift-Share Analysis ---- */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                Shift-Share Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                <strong>Question it answers:</strong>{" "}
                <em>&ldquo;Why did employment in this region grow or
                decline, and what forces are responsible?&rdquo;</em>
              </p>
              <p className="text-sm text-slate-600">
                Shift-Share decomposes the change in employment between two
                years into three components. This tells you whether your
                region&rsquo;s job growth is riding a national wave, is in
                the right (or wrong) industries, or has genuine local
                competitive advantages.
              </p>

              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">
                    1. National Growth Effect
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    How much employment would have changed if the region simply
                    grew at the same rate as the entire U.S. economy. This is
                    the &ldquo;rising tide lifts all boats&rdquo; component.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">
                    2. Industry Mix Effect
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Whether the region is concentrated in fast-growing or
                    slow-growing industries nationally. A region heavy in tech
                    during a tech boom scores positively here; a region heavy in
                    coal mining during a decline scores negatively.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">
                    3. Competitive Share (Local Advantage)
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    The residual &mdash; growth that cannot be explained by
                    national trends or industry mix. A positive competitive
                    share means the region is outperforming the national average
                    for those industries, possibly due to local factors like
                    talent, infrastructure, or policy.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-500">
                <strong>Example:</strong> If a county gained 500 manufacturing
                jobs, Shift-Share might reveal that +200 came from national
                growth, -50 from manufacturing being a slow-growth industry
                nationally, and +350 from the county&rsquo;s local competitive
                advantage &mdash; meaning the county is genuinely outperforming
                in manufacturing.
              </p>
            </CardContent>
          </Card>

          {/* ---- Diversification Index ---- */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-4 w-4 text-blue-600" />
                Diversification Index
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                <strong>Question it answers:</strong>{" "}
                <em>&ldquo;Is this region&rsquo;s economy spread across many
                industries, or concentrated in just a few?&rdquo;</em>
              </p>
              <p className="text-sm text-slate-600">
                The Diversification Index is based on the{" "}
                <strong>Herfindahl-Hirschman Index (HHI)</strong>, which
                measures market concentration. EconBase applies it to
                employment shares: it sums the squared share of employment in
                each industry.
              </p>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <div className="text-center">
                  <div className="inline-block rounded-lg bg-white px-8 py-4 font-mono text-lg shadow-sm border border-slate-200">
                    <span className="text-slate-600">HHI = </span>
                    &Sigma; (s<sub>i</sub>)<sup>2</sup>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Where <strong>s<sub>i</sub></strong> = share of total
                    employment in industry i
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">Lower HHI = More diversified</p>
                  <p className="mt-1 text-xs text-green-700">
                    Employment is spread across many industries. The economy is
                    more resilient to downturns in any single sector.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800">Higher HHI = More concentrated</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Employment is dominated by a few industries. The economy is
                    more vulnerable if a key sector declines.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-500">
                <strong>Example:</strong> A large metro area like Los Angeles
                tends to have a very low HHI (highly diversified), while a small
                county with one dominant employer (like a military base or a
                mine) will have a high HHI (highly concentrated).
              </p>
            </CardContent>
          </Card>

          {/* ---- Economic Base Multiplier ---- */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4 text-blue-600" />
                Economic Base Multiplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                <strong>Question it answers:</strong>{" "}
                <em>&ldquo;For every export-sector job in this region, how
                many total jobs exist?&rdquo;</em>
              </p>
              <p className="text-sm text-slate-600">
                The multiplier connects back to Economic Base Theory. It
                measures the ratio of total employment to basic (export)
                employment. Industries with LQ &gt; 1.0 are considered
                &ldquo;basic&rdquo; &mdash; the excess employment above what
                the national average would predict is treated as export-driven.
              </p>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <div className="text-center">
                  <div className="inline-block rounded-lg bg-white px-8 py-4 font-mono text-lg shadow-sm border border-slate-200">
                    <span className="text-slate-600">Multiplier = </span>
                    <div className="inline-flex items-center gap-2">
                      <div className="text-center">
                        <div className="border-b border-slate-400 pb-1 text-sm">
                          Total Employment
                        </div>
                        <div className="pt-1 text-sm">
                          Basic Employment
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                A multiplier of <strong>2.5</strong> means that for every 1 job
                in an export-base industry, there are 1.5 additional jobs in
                local-serving industries. So if the region gains 100 new export
                jobs, you would expect roughly 150 additional local-serving jobs
                to follow &mdash; or 250 total new jobs.
              </p>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-xs text-blue-800">
                    <strong>Interpretation tip:</strong> Multipliers typically
                    range from 1.5 to 4.0. Larger, more diversified metro areas
                    tend to have higher multipliers because more of the
                    supply chain and services exist locally. Small rural
                    counties often have lower multipliers because residents
                    travel elsewhere to shop and access services.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* ---- Employment Trends ---- */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Employment Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                <strong>Question it answers:</strong>{" "}
                <em>&ldquo;How has employment in this region changed over
                time?&rdquo;</em>
              </p>
              <p className="text-sm text-slate-600">
                The Trends tab shows time-series employment data across
                available Census years (2012&ndash;2023). You can see how total
                employment, the number of establishments, and average payroll
                have evolved, and track individual industries over time to spot
                growth or decline patterns.
              </p>
              <p className="text-sm text-slate-500">
                <strong>Example:</strong> Viewing trends for a county might
                reveal that total employment dipped sharply in 2020 (COVID-19
                pandemic) but recovered by 2022, while the Accommodation &amp;
                Food Services sector took longer to bounce back.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ================================================================
          DATA SOURCES
          ================================================================ */}
      <section id="data-sources" className="mb-12 scroll-mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Data Sources
          </h2>
        </div>
        <p className="mb-4 text-slate-700">
          All data in EconBase is fetched in real-time from official U.S. Census
          Bureau APIs. Nothing is pre-downloaded or pre-computed &mdash; every
          number you see is pulled directly from the source.
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900">
              County Business Patterns (CBP)
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Annual data on employment, payroll, and number of establishments
              by industry. Available for counties, metropolitan areas, and ZIP
              codes. This is the primary data source for all economic analysis
              in EconBase (LQ, Shift-Share, Multiplier, Diversification, and
              Trends). Data available from 2012&ndash;2023.
            </p>
            <a
              href="https://www.census.gov/programs-surveys/cbp.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              census.gov/programs-surveys/cbp
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900">
              American Community Survey (ACS)
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Demographic, social, economic, and housing data. Provides
              population, income distribution, education levels, age
              distribution, and labor force statistics. Used in the Demographics
              tab for county and metro area profiles. Data available from
              2012&ndash;2023.
            </p>
            <a
              href="https://www.census.gov/programs-surveys/acs"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              census.gov/programs-surveys/acs
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800">
                <strong>Note on data suppression:</strong> The Census Bureau
                suppresses employment data for industries with very few
                establishments to protect business confidentiality. This is
                more common at finer NAICS levels (5-6 digit) and in smaller
                geographies (rural counties, ZIP codes). Suppressed values
                appear as zero or are omitted.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ================================================================
          GLOSSARY
          ================================================================ */}
      <section id="glossary" className="mb-12 scroll-mt-8">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Glossary
          </h2>
        </div>
        <p className="mb-4 text-slate-700">
          Quick reference for terms used throughout EconBase.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="px-4 py-2 text-left font-medium text-slate-700 w-1/4">Term</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Definition</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-medium text-slate-800">Basic Industry</td>
                <td className="px-4 py-2">
                  An industry that exports goods or services outside the region,
                  bringing in revenue from elsewhere. Identified by LQ &gt; 1.0.
                </td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">Non-basic Industry</td>
                <td className="px-4 py-2">
                  An industry that primarily serves the local population (e.g.,
                  grocery stores, local restaurants). Identified by LQ &le; 1.0.
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-medium text-slate-800">LQ (Location Quotient)</td>
                <td className="px-4 py-2">
                  A ratio comparing a region&rsquo;s industry concentration to
                  the national average. LQ of 1.0 = same as national average;
                  above 1.0 = regional specialization.
                </td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">Shift-Share</td>
                <td className="px-4 py-2">
                  An analytical method that decomposes employment change into
                  national growth, industry mix, and local competitive advantage
                  components.
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-medium text-slate-800">HHI</td>
                <td className="px-4 py-2">
                  Herfindahl-Hirschman Index. Measures economic concentration by
                  summing the squared employment shares of all industries. Lower
                  values indicate more diversification.
                </td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">NAICS</td>
                <td className="px-4 py-2">
                  North American Industry Classification System. A standardized
                  numbering system (2 to 6 digits) used to categorize business
                  establishments into industries.
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-medium text-slate-800">CBP</td>
                <td className="px-4 py-2">
                  County Business Patterns. A Census Bureau dataset providing
                  annual employment, payroll, and establishment counts by
                  industry and geography.
                </td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">ACS</td>
                <td className="px-4 py-2">
                  American Community Survey. A Census Bureau survey providing
                  demographic, economic, social, and housing data for U.S.
                  communities.
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2 font-medium text-slate-800">FIPS Code</td>
                <td className="px-4 py-2">
                  Federal Information Processing Standards code. A 5-digit
                  numeric code that uniquely identifies each U.S. county (e.g.,
                  06073 = San Diego County, CA).
                </td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">MSA</td>
                <td className="px-4 py-2">
                  Metropolitan Statistical Area. A geographic region defined by
                  the Office of Management and Budget, consisting of a core
                  urban area and surrounding communities with strong economic
                  ties. Identified by a 5-digit code (e.g., 41740 = San Diego
                  metro area).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ================================================================
          REFERENCES & FURTHER READING
          ================================================================ */}
      <section id="references" className="scroll-mt-8">
        <div className="flex items-center gap-2 mb-4">
          <ListOrdered className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            References &amp; Further Reading
          </h2>
        </div>
        <ul className="list-disc space-y-2 pl-6 text-sm text-slate-600">
          <li>
            Isserman, A. M. (1977). &ldquo;The Location Quotient Approach to
            Estimating Regional Economic Impacts.&rdquo;{" "}
            <em>Journal of the American Institute of Planners</em>, 43(1).
          </li>
          <li>
            Stimson, R. J., Stough, R. R., &amp; Roberts, B. H. (2006).{" "}
            <em>
              Regional Economic Development: Analysis and Planning Strategy
            </em>
            . Springer.
          </li>
          <li>
            Hoyt, H. (1954). &ldquo;Homer Hoyt on Development of Economic
            Base Concept.&rdquo; <em>Land Economics</em>, 30(2).
          </li>
          <li>
            Loveridge, S. &amp; Selting, A. C. (1998). &ldquo;A Review and
            Comparison of Shift-Share Identities.&rdquo;{" "}
            <em>International Regional Science Review</em>, 21(1), 37&ndash;58.
          </li>
          <li>
            U.S. Census Bureau. &ldquo;North American Industry Classification
            System (NAICS).&rdquo;{" "}
            <a
              href="https://www.census.gov/naics/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              census.gov/naics
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
