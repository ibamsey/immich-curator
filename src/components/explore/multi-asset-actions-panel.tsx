"use client";

import { ExploreSelectionHeader } from "@/components/explore/explore-selection-header";
import type { GridAsset } from "@/lib/assets/grid-asset";
import { multiAssetActions } from "@/lib/assets/multi-asset-actions";

type MultiAssetActionsPanelProps = {
  assetIds: string[];
  assets: GridAsset[];
  onClear: () => void;
  onRefresh: () => void;
};

export function MultiAssetActionsPanel({
  assetIds,
  assets,
  onClear,
  onRefresh,
}: MultiAssetActionsPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <ExploreSelectionHeader count={assetIds.length} onClear={onClear} />
      <ul className="flex flex-col gap-6">
        {multiAssetActions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <h3 className="text-sm font-semibold">{action.label}</h3>
              </div>
              <action.Body
                assetIds={assetIds}
                assets={assets}
                onDone={onRefresh}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
