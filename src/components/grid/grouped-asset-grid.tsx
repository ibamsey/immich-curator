"use client";

import { AssetGrid } from "@/components/explore/asset-grid";
import { PersonAssetList } from "@/components/grid/person-asset-list";
import type { AssetQueryGroup } from "@/lib/assets/grid-query-types";
import type { GridAsset } from "@/lib/assets/grid-asset";

type PreviewAssetPick = Pick<GridAsset, "id" | "originalFileName">;

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
      />
    );
  };

  if (!groups || groups.length === 0) {
    return renderBlock(assets);
  }

  return (
    <div className="flex flex-col gap-4 p-3 pt-0">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
            <span className="ml-1 font-normal normal-case">
              ({group.assets.length})
            </span>
          </h3>
          {renderBlock(group.assets, group.key)}
        </section>
      ))}
    </div>
  );
}
