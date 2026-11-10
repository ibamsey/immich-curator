import { getAsset } from "@/lib/immich/assets";
import type { ImmichTag } from "@/lib/immich/types";

export type AssetTagSummary = { id: string; tags: ImmichTag[] };

/** Immich metadata search omits `tags`; load per asset for bulk tag UI. */
export async function getAssetsTagSummaries(
  assetIds: string[],
): Promise<AssetTagSummary[]> {
  return Promise.all(
    assetIds.map(async (id) => {
      const asset = await getAsset(id);
      return { id, tags: asset.tags ?? [] };
    }),
  );
}
