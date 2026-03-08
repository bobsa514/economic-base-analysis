import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calculator, Database, ExternalLink } from "lucide-react";

/**
 * About page explaining Economic Base Theory, methodology, and data sources.
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

      <Separator className="my-8" />

      {/* Economic Base Theory */}
      <section className="mb-12">
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
              region. These bring money into the local economy.
            </li>
            <li>
              <strong>Non-basic (local-serving) industries</strong> &mdash;
              sectors that serve the local population (retail, healthcare,
              education). These recirculate money within the economy.
            </li>
          </ul>
          <p>
            The theory holds that growth in basic industries drives overall
            regional growth because export revenue creates demand for local
            services, generating a <em>multiplier effect</em>.
          </p>
        </div>
      </section>

      {/* Location Quotient */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Location Quotient (LQ)
          </h2>
        </div>
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-800">LQ &lt; 1.0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">
                Industry is <strong>under-represented</strong> locally compared
                to the nation. The region may import these goods/services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">
                LQ &asymp; 1.0
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                Industry employment is <strong>proportional</strong> to the
                national average. The region is self-sufficient in this sector.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">
                LQ &gt; 1.0
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                Industry is a regional <strong>specialization</strong>. Likely
                an export-base industry bringing outside revenue in.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Other concepts */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Other Analytical Tools
        </h2>
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Shift-Share Analysis
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Coming Soon
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Decomposes employment change into three components: national
                growth effect, industry mix effect, and competitive share
                (local advantage). Helps understand <em>why</em> employment
                changed, not just <em>how much</em>.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Economic Base Multiplier
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Coming Soon
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Estimates how many total jobs are supported for each basic
                (export) job. A multiplier of 2.5 means each export-sector job
                supports 1.5 additional local jobs. Formula: Total Employment
                / Basic Employment.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data sources */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Data Sources
          </h2>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900">
              County Business Patterns (CBP)
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Annual data on employment, payroll, and establishments by
              industry for U.S. counties. Published by the U.S. Census Bureau.
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
              population, income, education, and labor force statistics.
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
        </div>
      </section>

      {/* References */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          References &amp; Further Reading
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-sm text-slate-600">
          <li>
            Isserman, A. M. (1977). &ldquo;The Location Quotient Approach to
            Estimating Regional Economic Impacts.&rdquo;{" "}
            <em>Journal of the American Institute of Planners</em>, 43(1).
          </li>
          <li>
            Stimson, R. J., Stough, R. R., &amp; Roberts, B. H. (2006).{" "}
            <em>Regional Economic Development: Analysis and Planning Strategy</em>.
            Springer.
          </li>
          <li>
            Hoyt, H. (1954). &ldquo;Homer Hoyt on Development of Economic
            Base Concept.&rdquo; <em>Land Economics</em>, 30(2).
          </li>
        </ul>
      </section>
    </div>
  );
}
