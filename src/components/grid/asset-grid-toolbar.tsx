"use client";

import { cn } from "@/lib/utils";
import { GRID_QUERY_PRESETS } from "@/lib/assets/apply-grid-query";
import type { GridFilterRule } from "@/lib/assets/grid-query-types";
import {
  groupableFields,
  sortableFields,
} from "@/lib/assets/asset-field-registry";
import type { GridQuery } from "@/lib/assets/grid-query-types";

type AssetGridToolbarProps = {
  query: GridQuery;
  onQueryChange: (query: GridQuery) => void;
  total: number;
  showing: number;
  loading?: boolean;
  className?: string;
};

function presetActive(query: GridQuery, presetKey: string): boolean {
  const preset = GRID_QUERY_PRESETS[presetKey];
  if (!preset) return false;
  return preset.filters.every((pf) =>
    query.filters.some(
      (f) =>
        f.fieldId === pf.fieldId &&
        f.op === pf.op &&
        f.value === pf.value,
    ),
  );
}

function togglePreset(query: GridQuery, presetKey: string): GridFilterRule[] {
  const preset = GRID_QUERY_PRESETS[presetKey];
  if (!preset) return query.filters;
  if (presetActive(query, presetKey)) {
    return query.filters.filter(
      (f) =>
        !preset.filters.some(
          (pf) =>
            pf.fieldId === f.fieldId &&
            pf.op === f.op &&
            pf.value === f.value,
        ),
    );
  }
  const merged = [...query.filters];
  for (const pf of preset.filters) {
    if (
      !merged.some(
        (f) =>
          f.fieldId === pf.fieldId &&
          f.op === pf.op &&
          f.value === pf.value,
      )
    ) {
      merged.push(pf);
    }
  }
  return merged;
}

export function AssetGridToolbar({
  query,
  onQueryChange,
  total,
  showing,
  loading,
  className,
}: AssetGridToolbarProps) {
  const sortFields = sortableFields();
  const groupFields = groupableFields();

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1 text-muted-foreground">
          Sort
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-foreground"
            value={query.sort.fieldId}
            onChange={(e) =>
              onQueryChange({
                ...query,
                sort: { ...query.sort, fieldId: e.target.value },
              })
            }
          >
            {sortFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-foreground"
            value={query.sort.direction}
            onChange={(e) =>
              onQueryChange({
                ...query,
                sort: {
                  ...query.sort,
                  direction: e.target.value as "asc" | "desc",
                },
              })
            }
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-muted-foreground">
          Group
          <select
            className="max-w-[140px] rounded-md border border-input bg-background px-2 py-1 text-foreground"
            value={query.groupBy ?? ""}
            onChange={(e) =>
              onQueryChange({
                ...query,
                groupBy: e.target.value || null,
              })
            }
          >
            <option value="">None</option>
            {groupFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-muted-foreground">
          {loading ? "Loading…" : `Showing ${showing} of ${total}`}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(GRID_QUERY_PRESETS).map(([key, preset]) => {
          const active = presetActive(query, key);
          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                onQueryChange({
                  ...query,
                  filters: togglePreset(query, key),
                })
              }
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                active
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {preset.label}
            </button>
          );
        })}
        {query.filters.length > 0 ? (
          <button
            type="button"
            className="rounded-full px-2 py-0.5 text-[11px] text-muted-foreground underline"
            onClick={() => onQueryChange({ ...query, filters: [] })}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
