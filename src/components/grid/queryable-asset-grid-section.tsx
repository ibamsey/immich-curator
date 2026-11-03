"use client";

import { useEffect } from "react";
import { AssetGridToolbar } from "@/components/grid/asset-grid-toolbar";
import { GroupedAssetGrid } from "@/components/grid/grouped-asset-grid";
import { useAssetGridQuery } from "@/components/grid/use-asset-grid-query";
import { useScanDefaultDpi } from "@/components/grid/use-scan-default-dpi";
import type { GridQueryScope } from "@/lib/assets/grid-query-types";

type QueryableAssetGridSectionProps = {
  scope: GridQueryScope;
  storageKey: string | null;
  selectedId: string | null;
  onSelect: (assetId: string) => void;
  onSelectionLost?: () => void;
  layout?: "thumb" | "detailed";
  onOpenInExplore?: (assetId: string) => void;
  onTotalChange?: (total: number) => void;
  /** When false, hide sort/filter/group toolbar (e.g. People RHS panel). */
  showToolbar?: boolean;
  /** When false, do not persist query in sessionStorage. */
  persistQuery?: boolean;
};

export function QueryableAssetGridSection({
  scope,
  storageKey,
  selectedId,
  onSelect,
  onSelectionLost,
  layout = "thumb",
  onOpenInExplore,
  onTotalChange,
  showToolbar = true,
  persistQuery = true,
}: QueryableAssetGridSectionProps) {
  const scanDefaultDpi = useScanDefaultDpi();
  const { query, setQuery, assets, groups, total, loading, error } =
    useAssetGridQuery(scope, storageKey, {
      persistQuery: showToolbar && persistQuery,
    });

  useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  useEffect(() => {
    if (!selectedId) return;
    if (!loading && !assets.some((a) => a.id === selectedId)) {
      onSelectionLost?.();
    }
  }, [assets, selectedId, loading, onSelectionLost]);

  return (
    <div className="flex min-h-0 flex-col">
      {showToolbar ? (
        <AssetGridToolbar
          query={query}
          onQueryChange={setQuery}
          total={total}
          showing={assets.length}
          loading={loading}
        />
      ) : null}
      {error ? (
        <p className="p-4 text-sm text-destructive">{error}</p>
      ) : loading && assets.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Loading photos…
        </p>
      ) : (
        <GroupedAssetGrid
          assets={assets}
          groups={groups}
          selectedId={selectedId}
          onSelect={onSelect}
          layout={layout}
          onOpenInExplore={onOpenInExplore}
          scanDefaultDpi={scanDefaultDpi}
        />
      )}
    </div>
  );
}
