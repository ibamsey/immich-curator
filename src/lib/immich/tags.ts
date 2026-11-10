import { getAsset } from "@/lib/immich/assets";
import { ImmichApiError, immichJsonTarget } from "@/lib/immich/client";
import { isProvenanceTag, tagPath } from "@/lib/immich/tag-policy";
import type { ImmichAssetWithEnrichment, ImmichTag } from "@/lib/immich/types";

export type TagRef = { tagId?: string; value?: string };

type BulkIdResponse = { id: string; success: boolean; error?: string };

export async function listTags(): Promise<ImmichTag[]> {
  return immichJsonTarget<ImmichTag[]>("/api/tags");
}

export async function upsertTags(tags: string[]): Promise<ImmichTag[]> {
  return immichJsonTarget<ImmichTag[]>("/api/tags", {
    method: "PUT",
    body: JSON.stringify({ tags }),
  });
}

export async function getTag(tagId: string): Promise<ImmichTag> {
  return immichJsonTarget<ImmichTag>(`/api/tags/${tagId}`);
}

/** Load by id, or upsert a path and return the row for that full value. */
export async function resolveTag(ref: TagRef): Promise<ImmichTag> {
  if (ref.tagId) {
    return getTag(ref.tagId);
  }
  const path = ref.value?.trim();
  if (!path) {
    throw new ImmichApiError("Provide tagId or value", 400);
  }
  const upserted = await upsertTags([path]);
  const match = upserted.find((tag) => tagPath(tag) === path);
  if (!match) {
    throw new ImmichApiError("Tag was not created", 502);
  }
  return match;
}

async function loadTagForDetach(ref: TagRef): Promise<ImmichTag> {
  if (ref.tagId) {
    return getTag(ref.tagId);
  }
  const path = ref.value?.trim();
  if (!path) {
    throw new ImmichApiError("Provide tagId or value", 400);
  }
  const tags = await listTags();
  const match = tags.find((tag) => tagPath(tag) === path);
  if (!match) {
    throw new ImmichApiError("Tag not found", 404);
  }
  return match;
}

export type TagLinkResults = { tag: ImmichTag; results: BulkIdResponse[] };

function assertLinkResult(
  results: BulkIdResponse[] | undefined,
  assetId: string,
  allowDuplicate: boolean,
) {
  if (!Array.isArray(results) || results.length === 0) return;
  const row = results.find((item) => item.id === assetId) ?? results[0];
  if (!row || row.success !== false) return;
  if (allowDuplicate && row.error === "duplicate") return;
  throw new ImmichApiError(row.error || "Tag update failed", 400);
}

function failuresFromResults(
  results: BulkIdResponse[] | undefined,
  allowDuplicate: boolean,
): BulkIdResponse[] {
  if (!Array.isArray(results)) return [];
  return results.filter(
    (row) =>
      row.success === false &&
      !(allowDuplicate && row.error === "duplicate"),
  );
}

async function linkTag(
  method: "PUT" | "DELETE",
  tagId: string,
  assetIds: string[],
  allowDuplicate: boolean,
): Promise<BulkIdResponse[]> {
  const results = await immichJsonTarget<BulkIdResponse[]>(
    `/api/tags/${tagId}/assets`,
    {
      method,
      body: JSON.stringify({ ids: assetIds }),
    },
  );
  if (assetIds.length === 1) {
    assertLinkResult(results, assetIds[0]!, allowDuplicate);
  }
  return results ?? [];
}

export async function attachTagToAsset(
  assetId: string,
  ref: TagRef,
): Promise<ImmichAssetWithEnrichment> {
  const tag = await resolveTag(ref);
  await linkTag("PUT", tag.id, [assetId], true);
  return getAsset(assetId);
}

export async function detachTagFromAsset(
  assetId: string,
  ref: TagRef,
): Promise<ImmichAssetWithEnrichment> {
  const tag = await loadTagForDetach(ref);
  if (isProvenanceTag(tagPath(tag))) {
    throw new ImmichApiError("Provenance tags cannot be removed", 400);
  }
  await linkTag("DELETE", tag.id, [assetId], false);
  return getAsset(assetId);
}

export async function attachTagToAssets(
  assetIds: string[],
  ref: TagRef,
): Promise<TagLinkResults> {
  if (assetIds.length === 0) {
    throw new ImmichApiError("No assets selected", 400);
  }
  const tag = await resolveTag(ref);
  const results = await linkTag("PUT", tag.id, assetIds, true);
  const failures = failuresFromResults(results, true);
  if (failures.length > 0 && failures.length === assetIds.length) {
    throw new ImmichApiError(
      failures[0]?.error || "Tag attach failed",
      400,
    );
  }
  return { tag, results };
}

export async function detachTagFromAssets(
  assetIds: string[],
  ref: TagRef,
): Promise<TagLinkResults> {
  if (assetIds.length === 0) {
    throw new ImmichApiError("No assets selected", 400);
  }
  const tag = await loadTagForDetach(ref);
  if (isProvenanceTag(tagPath(tag))) {
    throw new ImmichApiError("Provenance tags cannot be removed", 400);
  }
  const results = await linkTag("DELETE", tag.id, assetIds, false);
  const failures = failuresFromResults(results, false);
  if (failures.length > 0 && failures.length === assetIds.length) {
    throw new ImmichApiError(
      failures[0]?.error || "Tag detach failed",
      400,
    );
  }
  return { tag, results };
}
