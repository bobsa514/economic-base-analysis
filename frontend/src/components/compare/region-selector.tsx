"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RegionSearch from "@/components/search/region-search";
import type { CountyInfo } from "@/types";

/** Region color palette — consistent across all comparison charts */
export const REGION_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#a855f7"];

interface RegionSelectorProps {
  /** Currently selected regions (max 4). */
  regions: CountyInfo[];
  /** Called when a region is added (geoType is "msa", "zip", or undefined for county). */
  onAdd: (region: CountyInfo, geoType?: string) => void;
  /** Called when a region is removed by FIPS. */
  onRemove: (fips: string) => void;
}

/**
 * Multi-region selector for the Compare page.
 * Shows a search bar (hidden by default behind an "Add Region" button)
 * and displays selected regions as colored, removable badges.
 */
export default function RegionSelector({
  regions,
  onAdd,
  onRemove,
}: RegionSelectorProps) {
  const [showSearch, setShowSearch] = useState(false);

  const handleSelect = useCallback(
    (region: CountyInfo, geoType?: string) => {
      // Don't add duplicates
      if (regions.some((r) => r.fips === region.fips)) return;
      onAdd(region, geoType);
      setShowSearch(false);
    },
    [regions, onAdd]
  );

  const isFull = regions.length >= 4;

  return (
    <div className="space-y-3">
      {/* Selected regions as colored badges */}
      <div className="flex flex-wrap items-center gap-2">
        {regions.map((region, i) => (
          <Badge
            key={region.fips}
            className="gap-1.5 px-3 py-1.5 text-sm text-white"
            style={{ backgroundColor: REGION_COLORS[i] }}
          >
            {region.full_name}
            <button
              onClick={() => onRemove(region.fips)}
              className="ml-1 rounded-full p-0.5 hover:bg-white/20"
              aria-label={`Remove ${region.full_name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Add Region button */}
        {!isFull && !showSearch && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(true)}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Region
          </Button>
        )}
      </div>

      {/* Search dropdown — visible when user clicks "Add Region" */}
      {showSearch && !isFull && (
        <div className="flex items-start gap-2">
          <RegionSearch
            onSelect={handleSelect}
            placeholder="Search for a region to compare..."
            showGeoToggle
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(false)}
            className="mt-1"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Capacity indicator */}
      <p className="text-xs text-slate-400">
        {regions.length}/4 regions selected
        {isFull && " (maximum reached)"}
      </p>
    </div>
  );
}
