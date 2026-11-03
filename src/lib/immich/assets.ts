import { ImmichApiError, immichFetchTarget, immichJsonTarget } from "@/lib/immich/client";
import type {
  AssetUpdatePayload,
  ImmichAsset,
  ImmichAssetWithEnrichment,
  ImmichUser,
} from "@/lib/immich/types";

export async function getAsset(
  assetId: string,
): Promise<ImmichAssetWithEnrichment> {
  return immichJsonTarget<ImmichAssetWithEnrichment>(`/api/assets/${assetId}`);
}

export async function updateAsset(
  assetId: string,
  payload: AssetUpdatePayload,
): Promise<ImmichAsset> {
  const res = await immichFetchTarget(`/api/assets/${assetId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<ImmichAsset>;
}

export async function deleteAsset(assetId: string): Promise<void> {
  const res = await immichFetchTarget("/api/assets", {
    method: "DELETE",
    body: JSON.stringify({ ids: [assetId] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
}

export async function getCurrentUser(): Promise<ImmichUser> {
  return immichJsonTarget<ImmichUser>("/api/users/me");
}

