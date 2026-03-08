"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, DollarSign, BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface OverviewCardsProps {
  population?: number | null;
  totalEmployment?: number | null;
  medianIncome?: number | null;
  diversificationIndex?: number | null;
  isLoading?: boolean;
}

/**
 * Four overview metric cards shown at the top of the Explore page.
 * Shows skeleton placeholders while data is loading.
 */
export default function OverviewCards({
  population,
  totalEmployment,
  medianIncome,
  diversificationIndex,
  isLoading = false,
}: OverviewCardsProps) {
  const cards = [
    {
      title: "Population",
      value: population,
      format: (v: number) => v.toLocaleString(),
      icon: Users,
      change: null as number | null,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Employment",
      value: totalEmployment,
      format: (v: number) => v.toLocaleString(),
      icon: Briefcase,
      change: null as number | null,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Median Income",
      value: medianIncome,
      format: (v: number) => `$${v.toLocaleString()}`,
      icon: DollarSign,
      change: null as number | null,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Diversification Index",
      value: diversificationIndex,
      format: (v: number) => v.toFixed(3),
      icon: BarChart3,
      change: null as number | null,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              {card.title}
            </CardTitle>
            <div className={`rounded-md p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : card.value != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {card.format(card.value)}
                </span>
                {card.change != null && (
                  <span
                    className={`flex items-center text-xs font-medium ${
                      card.change >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {card.change >= 0 ? (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    )}
                    {Math.abs(card.change).toFixed(1)}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-slate-400">N/A</span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
