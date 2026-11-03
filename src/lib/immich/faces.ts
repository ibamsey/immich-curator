import { immichJsonTarget } from "@/lib/immich/client";
import type { ImmichAssetFace } from "@/lib/immich/types";

export async function getAssetFaces(assetId: string): Promise<ImmichAssetFace[]> {
  const path = `/api/faces?id=${encodeURIComponent(assetId)}`;
  return immichJsonTarget<ImmichAssetFace[]>(path);
}
