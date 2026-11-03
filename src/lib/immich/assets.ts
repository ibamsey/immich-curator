import { immichJson } from "@/lib/immich/client";
import type { ImmichAsset, ImmichUser } from "@/lib/immich/types";

export async function getAsset(assetId: string): Promise<ImmichAsset> {
  return immichJson<ImmichAsset>(`/api/assets/${assetId}`);
}

export async function getCurrentUser(): Promise<ImmichUser> {
  return immichJson<ImmichUser>("/api/users/me");
}

export function assetThumbnailPath(assetId: string, size = "preview"): string {
  return `/api/immich/assets/${assetId}/thumbnail?size=${size}`;
}
