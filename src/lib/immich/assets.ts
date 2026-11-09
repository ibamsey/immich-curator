import {
  captureDatetimeLocalMatches,
  immichLocalDateTimeToDatetimeLocal,
} from "@/lib/immich/captured-datetime";
import { ImmichApiError, immichFetchTarget, immichJsonTarget } from "@/lib/immich/client";
import type {
  AssetUpdatePayload,
  ImmichAsset,
  ImmichAssetWithEnrichment,
  ImmichUser,
} from "@/lib/immich/types";

const CAPTURE_DATE_SYNC_TIMEOUT_MS = 15_000;
const CAPTURE_DATE_SYNC_INTERVAL_MS = 400;

async function waitForLocalDateTimeSync(
  assetId: string,
  datetimeLocal: string,
): Promise<ImmichAsset> {
  const deadline = Date.now() + CAPTURE_DATE_SYNC_TIMEOUT_MS;
  let last: ImmichAsset | null = null;
  while (Date.now() < deadline) {
    last = await getAsset(assetId);
    if (captureDatetimeLocalMatches(last.localDateTime, datetimeLocal)) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, CAPTURE_DATE_SYNC_INTERVAL_MS));
  }
  return last ?? getAsset(assetId);
}

export async function getAsset(
  assetId: string,
): Promise<ImmichAssetWithEnrichment> {
  return immichJsonTarget<ImmichAssetWithEnrichment>(`/api/assets/${assetId}`);
}

export async function updateAsset(
  assetId: string,
  payload: AssetUpdatePayload,
): Promise<ImmichAsset> {
  const body: { description?: string; dateTimeOriginal?: string } = {};
  if (payload.description !== undefined) {
    body.description = payload.description;
  }
  const captureDatetimeLocal =
    payload.localDateTime !== undefined
      ? immichLocalDateTimeToDatetimeLocal(payload.localDateTime)
      : "";
  if (payload.localDateTime !== undefined) {
    /** Immich `UpdateAssetDto`; EXIF updates immediately, `asset.localDateTime` lags until a job runs. */
    body.dateTimeOriginal = payload.localDateTime;
  }
  const res = await immichFetchTarget(`/api/assets/${assetId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
  if (captureDatetimeLocal) {
    return waitForLocalDateTimeSync(assetId, captureDatetimeLocal);
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

export type UploadAssetResult = {
  id: string;
  status: string;
};

/** Multipart upload per Immich `POST /api/assets` (v3+ DTO). */
export async function uploadAssetMultipart(form: FormData): Promise<UploadAssetResult> {
  const res = await immichFetchTarget("/api/assets", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<UploadAssetResult>;
}

/** Copy albums, favorites, stacks, etc. from source to target (`PUT /api/assets/copy`). */
export async function copyAssetAssociations(
  sourceId: string,
  targetId: string,
): Promise<void> {
  const res = await immichFetchTarget("/api/assets/copy", {
    method: "PUT",
    body: JSON.stringify({ sourceId, targetId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
}

/**
 * Upload edited bytes, copy metadata/links from `oldAssetId` to the new asset, delete `oldAssetId`.
 * Returns the new asset detail. The Immich asset **id** changes.
 */
export async function replaceAssetViaUpload(params: {
  oldAssetId: string;
  file: File | Blob;
  fileName: string;
  fileCreatedAt: string;
  fileModifiedAt: string;
}): Promise<ImmichAssetWithEnrichment> {
  const { oldAssetId, file, fileName, fileCreatedAt, fileModifiedAt } = params;

  const form = new FormData();
  form.set("assetData", file, fileName);
  form.set("fileCreatedAt", fileCreatedAt);
  form.set("fileModifiedAt", fileModifiedAt);
  form.set("filename", fileName);

  const upload = await uploadAssetMultipart(form);
  if (upload.status === "duplicate") {
    throw new ImmichApiError(
      "Immich reported this file as a duplicate of an existing asset; cannot replace without changing pixels.",
      409,
    );
  }
  const newId = upload.id;

  try {
    await copyAssetAssociations(oldAssetId, newId);
  } catch (e) {
    await deleteAsset(newId).catch(() => {});
    throw e;
  }

  try {
    await deleteAsset(oldAssetId);
  } catch (e) {
    throw new ImmichApiError(
      `New asset ${newId} was created and metadata was copied, but removing the old asset failed: ${e instanceof Error ? e.message : String(e)}. Remove the old asset manually if needed.`,
      500,
    );
  }

  return getAsset(newId);
}

export async function getCurrentUser(): Promise<ImmichUser> {
  return immichJsonTarget<ImmichUser>("/api/users/me");
}

