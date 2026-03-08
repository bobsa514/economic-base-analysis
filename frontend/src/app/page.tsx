import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight } from "lucide-react";
import RegionSearch from "@/components/search/region-search";
import MapSection from "@/components/map/map-section";

// Featured regions for quick access
const FEATURED = [
  {
    fips: "06073",
    name: "San Diego County",
    state: "CA",
    highlight: "Defense & Biotech hub",
  },
  {
    fips: "48201",
    name: "Harris County",
    state: "TX",
    highlight: "Energy capital",
  },
  {
    fips: "17031",
    name: "Cook County",
    state: "IL",
    highlight: "Midwest economic engine",
  },
  {
    fips: "53033",
    name: "King County",
    state: "WA",
    highlight: "Tech & aerospace",
  },
];

/**
 * Landing page:
 * - Hero with search bar
 * - Interactive US county map
 * - Featured regions cards
 */
export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Explore America&apos;s Economic DNA
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Discover what makes each region&apos;s economy unique. Analyze
            Location Quotients, industry specialization, and employment
            patterns across 3,000+ U.S. counties.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 flex justify-center">
            <RegionSearch showGeoToggle />
          </div>
        </div>
      </section>

      {/* Map section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          U.S. County Map
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Click any county to explore its economic profile. Hover for county
          name.
        </p>
        <div className="min-h-[500px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          <MapSection />
        </div>
      </section>

      {/* Featured regions */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">
          Featured Regions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED.map((region) => (
            <Link key={region.fips} href={`/explore/${region.fips}`}>
              <Card className="group cursor-pointer border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {region.name}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600"
                    >
                      {region.state}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{region.highlight}</p>
                  <div className="mt-3 flex items-center text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                    Explore <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
