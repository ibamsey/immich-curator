"use client";

import { AssetGrid } from "@/components/explore/asset-grid";
import { PersonAssetList } from "@/components/grid/person-asset-list";
import type { AssetQueryGroup } from "@/lib/assets/grid-query-types";
import type { GridAsset } from "@/lib/assets/grid-asset";
import type { PersonAssetLinkedFaceHint } from "@/lib/people/person-asset-linked-faces";
import { SelectionTickButton } from "@/components/grid/selection-tick-button";
import { groupSelectionState } from "@/lib/assets/use-asset-selection";

type PreviewAssetPick = Pick<GridAsset, "id" | "originalFileName" | "type">;

type GroupedAssetGridProps = {
  assets: GridAsset[];
  groups: AssetQueryGroup[] | null;
  selectedId: string | null;
  onSelect: (assetId: string) => void;
  layout?: "thumb" | "detailed";
  onOpenInExplore?: (assetId: string) => void;
  /** Thumb grid: optional zoom/pan on tile select when parent passes `onPreviewOpen`. */
  onPreviewOpen?: (asset: PreviewAssetPick) => void;
  scanDefaultDpi?: number;
  personLinkedFacesByAsset?: Record<string, PersonAssetLinkedFaceHint>;
  multiSelectedIds?: ReadonlySet<string>;
  selectionMode?: boolean;
  onToggleMultiSelect?: (assetId: string) => void;
  onToggleGroupSelect?: (assetIds: string[]) => void;
};

export function GroupedAssetGrid({
  assets,
  groups,
  selectedId,
  onSelect,
  layout = "thumb",
  onOpenInExplore,
  onPreviewOpen,
  scanDefaultDpi,
  personLinkedFacesByAsset,
  multiSelectedIds,
  selectionMode = false,
  onToggleMultiSelect,
  onToggleGroupSelect,
}: GroupedAssetGridProps) {
  if (assets.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No photos match this query.
      </p>
    );
  }

  const renderBlock = (list: GridAsset[], key?: string) => {
    if (layout === "detailed") {
      return (
        <PersonAssetList
          key={key}
          assets={list}
          selectedId={selectedId}
          onSelect={onSelect}
          onOpenInExplore={onOpenInExplore}
          scanDefaultDpi={scanDefaultDpi}
          personLinkedFacesByAsset={personLinkedFacesByAsset}
        />
      );
    }
    return (
      <AssetGrid
        key={key}
        assets={list}
        selectedId={selectedId}
        onSelect={onSelect}
        onPreviewOpen={onPreviewOpen}
        multiSelectedIds={multiSelectedIds}
        selectionMode={selectionMode}
        onToggleMultiSelect={onToggleMultiSelect}
      />
    );
  };

  if (!groups || groups.length === 0) {
    return renderBlock(assets);
  }

  return (
    <div className="flex flex-col gap-4 p-3 pt-0">
      {groups.map((group) => {
        const groupIds = group.assets.map((a) => a.id);
        const groupState =
          multiSelectedIds && onToggleGroupSelect
            ? groupSelectionState(groupIds, multiSelectedIds)
            : null;
        return (
          <section key={group.key}>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {groupState && onToggleGroupSelect ? (
                <SelectionTickButton
                  size="md"
                  selected={groupState === "all"}
                  indeterminate={groupState === "some"}
                  ariaLabel={`Select all in ${group.label}`}
                  onToggle={() => onToggleGroupSelect(groupIds)}
                />
              ) : null}
              <h3 className="m-0 font-semibold">
                {group.label}
                <span className="ml-1 font-normal normal-case">
                  ({group.assets.length})
                </span>
              </h3>
            </div>
            {renderBlock(group.assets, group.key)}
          </section>
        );
      })}
    </div>
  );
}
