"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare" },
  { href: "/industry/54", label: "Industry" },
  { href: "/about", label: "About" },
];

/**
 * Site header with logo and navigation.
 * Active link is highlighted with the primary blue color.
 */
export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-900">EconBase</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            // For the Industry link, match any /industry/* path
            const matchPath = item.href === "/industry/54" ? "/industry" : item.href;
            const isActive =
              matchPath === "/"
                ? pathname === "/"
                : pathname.startsWith(matchPath);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
