"use client";

import { useMemo } from "react";

interface ColorLegendProps {
  metric: "employment" | "lq";
  /** For employment: max value (already log10'd). For LQ: max value (e.g. 5). */
  maxValue: number;
  /** Color scale function — maps a value to a CSS color string. */
  colorScale: (value: number) => string;
}

/**
 * Horizontal gradient legend bar for the choropleth map.
 * Shows a gradient preview and labeled tick marks for the metric.
 */
export default function ColorLegend({
  metric,
  maxValue,
  colorScale,
}: ColorLegendProps) {
  // Generate gradient stops for the legend bar
  const gradientStops = useMemo(() => {
    const stops: string[] = [];
    const numStops = 50;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = metric === "lq" ? t * maxValue : t * maxValue;
      const color = colorScale(value);
      stops.push(`${color} ${(t * 100).toFixed(1)}%`);
    }
    return stops.join(", ");
  }, [metric, maxValue, colorScale]);

  // Tick labels depend on the metric
  const ticks = useMemo(() => {
    if (metric === "lq") {
      return [
        { label: "0", position: "0%" },
        { label: "1.0", position: `${(1 / maxValue) * 100}%` },
        { label: "2.0", position: `${(2 / maxValue) * 100}%` },
        { label: `${maxValue}+`, position: "100%" },
      ];
    }
    // Employment: log10 scale — show actual employment values
    return [
      { label: "0", position: "0%" },
      { label: "100", position: `${(2 / maxValue) * 100}%` },
      { label: "1K", position: `${(3 / maxValue) * 100}%` },
      { label: "10K", position: `${(4 / maxValue) * 100}%` },
      { label: "100K", position: `${(5 / maxValue) * 100}%` },
      { label: "1M+", position: "100%" },
    ].filter((t) => {
      // Only show ticks that fit within the domain
      const pct = parseFloat(t.position);
      return pct >= 0 && pct <= 100;
    });
  }, [metric, maxValue]);

  const legendLabel = metric === "lq" ? "Location Quotient" : "Employment";

  return (
    <div className="mt-3 flex flex-col items-center gap-1 px-4">
      <span className="text-xs font-medium text-slate-600">{legendLabel}</span>
      <div className="relative h-3 w-full max-w-md rounded-sm">
        {/* Gradient bar */}
        <div
          className="h-full w-full rounded-sm"
          style={{
            background: `linear-gradient(to right, ${gradientStops})`,
          }}
        />
      </div>
      {/* Tick labels */}
      <div className="relative h-4 w-full max-w-md">
        {ticks.map((tick) => (
          <span
            key={tick.label}
            className="absolute -translate-x-1/2 text-[10px] text-slate-500"
            style={{ left: tick.position }}
          >
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}
