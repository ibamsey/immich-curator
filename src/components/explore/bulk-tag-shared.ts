import type { GridAsset } from "@/lib/assets/grid-asset";
import type { ImmichTag } from "@/lib/immich/types";

export type BulkIdResponse = { id: string; success: boolean; error?: string };

export type TagLinkResponse = {
  tag?: ImmichTag;
  results?: BulkIdResponse[];
  error?: string;
};

export function selectedAssetsForBulk(
  assetIds: string[],
  assets: GridAsset[],
): GridAsset[] {
  return assets.filter((a) => assetIds.includes(a.id));
}

export function partialUpdateNotice(
  assetIds: string[],
  results: BulkIdResponse[] | undefined,
): string {
  const failed = (results ?? []).filter((r) => r.success === false);
  if (failed.length === 0) {
    return "Updated all selected photos.";
  }
  return `Updated ${assetIds.length - failed.length} of ${assetIds.length} photos.`;
}

export async function detachTagFromSelection(
  assetIds: string[],
  tagId: string,
): Promise<{ ok: boolean; data: TagLinkResponse }> {
  const res = await fetch("/api/immich/tags/assets", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetIds, tagId }),
  });
  const data = (await res.json().catch(() => ({}))) as TagLinkResponse;
  return { ok: res.ok, data };
}
