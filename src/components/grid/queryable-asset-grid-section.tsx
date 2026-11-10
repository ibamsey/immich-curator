"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { AssetGridToolbar } from "@/components/grid/asset-grid-toolbar";
import { GroupedAssetGrid } from "@/components/grid/grouped-asset-grid";
import {
  AssetPreviewModal,
  type AssetPreviewTarget,
} from "@/components/grid/asset-preview-modal";
import type { ImmichAssetWithEnrichment } from "@/lib/immich/types";
import { useAssetGridQuery } from "@/components/grid/use-asset-grid-query";
import { useScanDefaultDpi } from "@/components/grid/use-scan-default-dpi";
import type { GridQuery, GridQueryScope } from "@/lib/assets/grid-query-types";
import type { PersonAssetLinkedFaceHint } from "@/lib/people/person-asset-linked-faces";
import { peopleCountHintsFromAssets } from "@/lib/people/person-asset-people-hints";
import type { GridAsset } from "@/lib/assets/grid-asset";

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
  /**
   * When true (thumb grid), selecting a tile also calls the zoom/pan preview with the full original.
   * Prefer opening from the RHS preview instead; omit for that UX.
   */
  openGridPreview?: boolean;
  /** Initial query when nothing is stored (Explore uses capture-date sections). */
  defaultQuery?: GridQuery;
  /** When grid preview is open, sync metadata saves (e.g. modal description) to parent detail state. */
  onPreviewAssetUpdated?: (asset: ImmichAssetWithEnrichment) => void;
  personLinkedFacesByAsset?: Record<string, PersonAssetLinkedFaceHint>;
  multiSelectedIds?: ReadonlySet<string>;
  selectionMode?: boolean;
  onToggleMultiSelect?: (assetId: string) => void;
  onToggleGroupSelect?: (assetIds: string[]) => void;
  onVisibleAssetIdsChange?: (ids: string[]) => void;
  onGridAssetsChange?: (assets: GridAsset[]) => void;
};

export type QueryableAssetGridSectionHandle = {
  removeAsset: (assetId: string) => void;
  refetch: () => void;
  getAssets: () => GridAsset[];
};

export const QueryableAssetGridSection = forwardRef<
  QueryableAssetGridSectionHandle,
  QueryableAssetGridSectionProps
>(function QueryableAssetGridSection({
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
  openGridPreview = false,
  defaultQuery,
  onPreviewAssetUpdated,
  personLinkedFacesByAsset,
  multiSelectedIds,
  selectionMode,
  onToggleMultiSelect,
  onToggleGroupSelect,
  onVisibleAssetIdsChange,
  onGridAssetsChange,
}, ref) {
  const scanDefaultDpi = useScanDefaultDpi();
  const [gridPreviewOpen, setGridPreviewOpen] = useState(false);
  const [gridPreviewAsset, setGridPreviewAsset] =
    useState<AssetPreviewTarget | null>(null);
  const {
    query,
    setQuery,
    assets,
    groups,
    total,
    loading,
    error,
    removeAsset,
    refetch,
  } = useAssetGridQuery(scope, storageKey, {
    persistQuery: showToolbar && persistQuery,
    defaultQuery,
  });

  const onPreviewAssetReplaced = useCallback(
    (oldId: string, next: ImmichAssetWithEnrichment) => {
      removeAsset(oldId);
      setGridPreviewAsset({
        id: next.id,
        originalFileName: next.originalFileName,
        type: next.type,
      });
      refetch();
    },
    [removeAsset, refetch],
  );

  useImperativeHandle(
    ref,
    () => ({
      removeAsset,
      refetch,
      getAssets: () => assets,
    }),
  [removeAsset, refetch, assets],
  );

  const peopleHints = useMemo(() => {
    if (personLinkedFacesByAsset) return personLinkedFacesByAsset;
    if (scope.mode === "personShared") {
      return peopleCountHintsFromAssets(assets);
    }
    return undefined;
  }, [assets, personLinkedFacesByAsset, scope.mode]);

  useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  useEffect(() => {
    if (!selectedId) return;
    if (!loading && !assets.some((a) => a.id === selectedId)) {
      onSelectionLost?.();
    }
  }, [assets, selectedId, loading, onSelectionLost]);

  useEffect(() => {
    onVisibleAssetIdsChange?.(assets.map((a) => a.id));
    onGridAssetsChange?.(assets);
  }, [assets, onVisibleAssetIdsChange, onGridAssetsChange]);

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
          onPreviewOpen={
            openGridPreview
              ? (asset) => {
                  setGridPreviewAsset(asset);
                  setGridPreviewOpen(true);
                }
              : undefined
          }
          scanDefaultDpi={scanDefaultDpi}
          personLinkedFacesByAsset={peopleHints}
          multiSelectedIds={multiSelectedIds}
          selectionMode={selectionMode}
          onToggleMultiSelect={onToggleMultiSelect}
          onToggleGroupSelect={onToggleGroupSelect}
        />
      )}
      {openGridPreview ? (
        <AssetPreviewModal
          key={gridPreviewAsset?.id ?? "closed"}
          open={gridPreviewOpen}
          onOpenChange={(open) => {
            setGridPreviewOpen(open);
            if (!open) setGridPreviewAsset(null);
          }}
          asset={gridPreviewAsset}
          onAssetReplaced={onPreviewAssetReplaced}
          onAssetUpdated={onPreviewAssetUpdated}
        />
      ) : null}
    </div>
  );
});
