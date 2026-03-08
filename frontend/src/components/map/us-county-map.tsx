"use client";

import { useState, useEffect, memo, useCallback, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleSequential, scaleDiverging } from "d3-scale";
import { interpolateBlues, interpolateRdYlGn } from "d3-scale-chromatic";
import { useRouter } from "next/navigation";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import type { MapDataResponse } from "@/types";
import ColorLegend from "./color-legend";

const COUNTIES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

/** Neutral fill for counties with no data or while loading. */
const NEUTRAL_FILL = "#e2e8f0"; // slate-200

interface USCountyMapProps {
  /** Map data from the API. Null while loading. */
  mapData: MapDataResponse | null;
  /** Currently selected metric. */
  metric: "employment" | "lq";
  /** Whether data is currently loading. */
  isLoading: boolean;
}

/**
 * Interactive US county choropleth map.
 * - Hover: shows tooltip with county name + metric value
 * - Click: navigates to /explore/{fips}
 * - Colors counties based on actual API data (employment or LQ)
 *
 * MUST be rendered client-side only (no SSR).
 */
function USCountyMap({ mapData, metric, isLoading }: USCountyMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    name: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);

  // State borders GeoJSON
  const [stateFeatures, setStateFeatures] = useState<FeatureCollection<
    Geometry,
    GeoJsonProperties
  > | null>(null);

  // Load state borders for overlay
  useEffect(() => {
    fetch(STATES_URL)
      .then((res) => res.json())
      .then((topo: Topology) => {
        const states = feature(
          topo,
          topo.objects.states as GeometryCollection
        ) as FeatureCollection<Geometry, GeoJsonProperties>;
        setStateFeatures(states);
      })
      .catch(console.error);
  }, []);

  /** Pad a numeric FIPS id to 5 digits. */
  const padFips = useCallback((id: string | number): string => {
    return String(id).padStart(5, "0");
  }, []);

  // Build a lookup map from API data for fast access during rendering
  const dataMap = useMemo(() => {
    const map = new Map<string, { value: number | null; employment: number | null }>();
    if (mapData?.data) {
      for (const d of mapData.data) {
        map.set(d.fips, { value: d.value, employment: d.employment });
      }
    }
    return map;
  }, [mapData]);

  // Compute domain max for the color scale
  const domainMax = useMemo(() => {
    if (!mapData?.data || mapData.data.length === 0) return 1;

    if (metric === "employment") {
      // Use log10 scale — find max log10(employment)
      let max = 0;
      for (const d of mapData.data) {
        if (d.value != null && d.value > 0) {
          const logVal = Math.log10(d.value);
          if (logVal > max) max = logVal;
        }
      }
      return max || 6; // fallback ~1M
    }

    // LQ: use fixed upper bound of 5 for consistency
    return 5;
  }, [mapData, metric]);

  // Color scale based on metric type
  const colorScale = useMemo(() => {
    if (metric === "lq") {
      // Diverging scale: red (< 1.0) -> white (1.0) -> green (> 1.0)
      return scaleDiverging(interpolateRdYlGn).domain([0, 1, domainMax]);
    }
    // Employment: sequential blue scale on log10 values
    return scaleSequential(interpolateBlues).domain([0, domainMax]);
  }, [metric, domainMax]);

  /** Get fill color for a county based on its data. */
  const getFill = useCallback(
    (fips: string): string => {
      if (isLoading || !mapData) return NEUTRAL_FILL;

      const entry = dataMap.get(fips);
      if (!entry || entry.value == null) return NEUTRAL_FILL;

      if (metric === "employment") {
        // Log scale for employment
        const logVal = entry.value > 0 ? Math.log10(entry.value) : 0;
        return colorScale(logVal) as string;
      }
      // LQ value directly
      return colorScale(entry.value) as string;
    },
    [isLoading, mapData, dataMap, metric, colorScale]
  );

  /** Format a metric value for the tooltip. */
  const formatValue = useCallback(
    (fips: string): string => {
      const entry = dataMap.get(fips);
      if (!entry || entry.value == null) return "No data";

      if (metric === "employment") {
        return `Employment: ${entry.value.toLocaleString()}`;
      }
      return `LQ: ${entry.value.toFixed(2)}`;
    },
    [dataMap, metric]
  );

  // Legend color scale wrapper: maps raw value (not log-transformed) to color
  const legendColorScale = useMemo(() => {
    if (metric === "lq") {
      return (v: number) => colorScale(v) as string;
    }
    // For employment legend: input is already in log10 space
    return (v: number) => colorScale(v) as string;
  }, [metric, colorScale]);

  return (
    <div className="relative w-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-slate-600">Loading map data...</span>
          </div>
        </div>
      )}

      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        className="h-full w-full"
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup>
          {/* County fills */}
          <Geographies geography={COUNTIES_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = padFips(geo.id);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getFill(fips)}
                    stroke="#fff"
                    strokeWidth={0.3}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: "#2563eb",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e) => {
                      const name = String(
                        geo.properties?.name || `County ${fips}`
                      );
                      setTooltip({
                        name,
                        value: formatValue(fips),
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => router.push(`/explore/${fips}`)}
                    aria-label={`${String(geo.properties?.name || fips)} county`}
                  />
                );
              })
            }
          </Geographies>

          {/* State borders overlay */}
          {stateFeatures && (
            <Geographies geography={stateFeatures}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth={0.8}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* Color legend — only show when we have data */}
      {mapData && !isLoading && (
        <ColorLegend
          metric={metric}
          maxValue={domainMax}
          colorScale={legendColorScale}
        />
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[100] rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 28,
          }}
        >
          <div>{tooltip.name}</div>
          <div className="text-slate-300">{tooltip.value}</div>
        </div>
      )}
    </div>
  );
}

export default memo(USCountyMap);
