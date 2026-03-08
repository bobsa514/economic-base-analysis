import { Separator } from "@/components/ui/separator";

/**
 * Site footer with data source attribution.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Separator className="mb-4" />
        <div className="flex flex-col items-center justify-between gap-2 text-sm text-slate-500 sm:flex-row">
          <p>
            Data source:{" "}
            <a
              href="https://www.census.gov/programs-surveys/cbp.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline-offset-2 hover:underline"
            >
              U.S. Census Bureau
            </a>{" "}
            &mdash; County Business Patterns &amp; American Community Survey
          </p>
          <p>&copy; {new Date().getFullYear()} EconBase</p>
        </div>
      </div>
    </footer>
  );
}
