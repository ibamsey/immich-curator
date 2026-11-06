import { immichJson } from "@/lib/immich/client";
import {
  getSharedAlbumScope,
  personHasAssetsInSharedAlbums,
} from "@/lib/immich/shared-album-scope";
import type {
  ImmichPeopleResponse,
  ImmichPerson,
  PersonUpdatePayload,
} from "@/lib/immich/types";

const PEOPLE_PAGE_SIZE = 500;

export async function getAllPeople(): Promise<ImmichPerson[]> {
  const all: ImmichPerson[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    const data = await immichJson<ImmichPeopleResponse>(
      `/api/people?page=${page}&size=${PEOPLE_PAGE_SIZE}`,
    );
    all.push(...data.people);
    hasNext = data.hasNextPage;
    page += 1;
    if (page > 20) break;
  }
  return all;
}

export async function getPerson(personId: string): Promise<ImmichPerson> {
  return immichJson<ImmichPerson>(`/api/people/${personId}`);
}

/**
 * Immich ranks people by facial similarity to a **face** (`closestAssetId` — same parameter
 * the official UI uses when picking a person for a face).
 * Returns 1-based rank of {@param targetPersonId} in that order, or null if not in range.
 */
export async function getPersonSimilarityRankToFace(
  targetPersonId: string,
  faceId: string,
  opts: { maxPages?: number; pageSize?: number; withHidden?: boolean } = {},
): Promise<number | null> {
  const pageSize = opts.pageSize ?? 500;
  const maxPages = opts.maxPages ?? 4;
  const withHidden = opts.withHidden ?? true;
  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({
      closestAssetId: faceId,
      page: String(page),
      size: String(pageSize),
      withHidden: String(withHidden),
    });
    const data = await immichJson<ImmichPeopleResponse>(
      `/api/people?${params.toString()}`,
    );
    const idx = data.people.findIndex((p) => p.id === targetPersonId);
    if (idx >= 0) {
      return (page - 1) * pageSize + idx + 1;
    }
    if (!data.hasNextPage) break;
  }
  return null;
}

export async function updatePerson(
  personId: string,
  payload: PersonUpdatePayload,
): Promise<ImmichPerson> {
  return immichJson<ImmichPerson>(`/api/people/${personId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Remove a person from Immich (`DELETE /api/people/:id` → 204). */
export async function deletePerson(personId: string): Promise<void> {
  await immichJson<void>(`/api/people/${personId}`, {
    method: "DELETE",
  });
}

export async function searchPeopleByName(
  name: string,
  withHidden = true,
): Promise<ImmichPerson[]> {
  const params = new URLSearchParams({ name });
  if (withHidden) params.set("withHidden", "true");
  return immichJson<ImmichPerson[]>(`/api/search/person?${params.toString()}`);
}

export async function mergePeopleIntoTarget(
  targetPersonId: string,
  sourcePersonIds: string[],
): Promise<void> {
  const sources = [...new Set(sourcePersonIds)].filter(
    (id) => id !== targetPersonId,
  );
  if (sources.length === 0) {
    throw new Error("At least one distinct person is required to merge");
  }
  await immichJson(`/api/people/${targetPersonId}/merge`, {
    method: "POST",
    body: JSON.stringify({ ids: sources }),
  });
}

export async function getPeopleInSharedScope(
  operatorUserId: string | null,
): Promise<{ people: ImmichPerson[]; sharedAlbumIds: string[] }> {
  const { sharedAlbumIds } = await getSharedAlbumScope(operatorUserId);
  if (sharedAlbumIds.length === 0) {
    return { people: [], sharedAlbumIds: [] };
  }

  const candidates = (await getAllPeople()).filter((p) => !p.isHidden);
  const inScope: ImmichPerson[] = [];

  for (const person of candidates) {
    const ok = await personHasAssetsInSharedAlbums(
      person.id,
      sharedAlbumIds,
    );
    if (ok) inScope.push(person);
  }

  inScope.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  return { people: inScope, sharedAlbumIds };
}
