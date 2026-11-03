import {
  ImmichApiError,
  immichFetchOperator,
  immichJsonOperator,
  immichJsonTarget,
} from "@/lib/immich/client";
import { hasOperatorApiKey } from "@/lib/config/env";
import type { ImmichActivity } from "@/lib/immich/types";

export function sortActivitiesByCreatedAt(
  activities: ImmichActivity[],
): ImmichActivity[] {
  return [...activities].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function filterCommentActivities(
  activities: ImmichActivity[],
): ImmichActivity[] {
  return activities.filter(
    (a) =>
      a.type === "comment" &&
      typeof a.comment === "string" &&
      a.comment.trim() !== "",
  );
}

export async function getAssetCommentActivities(
  albumId: string,
  assetId: string,
): Promise<ImmichActivity[]> {
  const query = new URLSearchParams({ albumId, assetId });
  const path = `/api/activities?${query.toString()}`;

  let raw: ImmichActivity[];
  if (hasOperatorApiKey()) {
    raw = await immichJsonOperator<ImmichActivity[]>(path);
  } else {
    raw = await immichJsonTarget<ImmichActivity[]>(path);
  }

  return sortActivitiesByCreatedAt(filterCommentActivities(raw ?? []));
}

export async function createAssetComment(
  albumId: string,
  assetId: string,
  comment: string,
): Promise<ImmichActivity> {
  const trimmed = comment.trim();
  if (!trimmed) {
    throw new ImmichApiError("Comment cannot be empty", 400);
  }
  const body = {
    albumId,
    assetId,
    type: "comment" as const,
    comment: trimmed,
  };
  const res = await immichFetchOperator("/api/activities", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<ImmichActivity>;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const res = await immichFetchOperator(`/api/activities/${activityId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
}

/** Load one activity via album-scoped list (Immich has no single-get in v1 path). */
export async function findActivityInAlbum(
  albumId: string,
  activityId: string,
): Promise<ImmichActivity | null> {
  const query = new URLSearchParams({ albumId });
  const path = `/api/activities?${query.toString()}`;
  const raw = hasOperatorApiKey()
    ? await immichJsonOperator<ImmichActivity[]>(path)
    : await immichJsonTarget<ImmichActivity[]>(path);
  return (raw ?? []).find((a) => a.id === activityId) ?? null;
}
