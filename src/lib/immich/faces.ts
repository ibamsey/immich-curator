import { immichJson, immichJsonTarget } from "@/lib/immich/client";
import { getPerson, getPersonSimilarityRankToFace } from "@/lib/immich/people";
import {
  getPersonAssetIdsInLibrary,
  getSharedAlbumIds,
} from "@/lib/immich/shared-album-scope";
import type { PersonFacePanelRow } from "@/lib/people/person-face-panel-row";
import type { UnassignedFace } from "@/lib/people/unassigned-face";
import type {
  ImmichAssetFace,
  ImmichPerson,
  ImmichSearchAssetsResponse,
} from "@/lib/immich/types";

const FACE_BATCH_CONCURRENCY = 6;
const UNASSIGNED_FACE_CONCURRENCY = 12;
const ALBUM_ASSET_PAGE_SIZE = 1000;
/** Paginated metadata search (no album filter) to walk the target user’s accessible assets */
const LIBRARY_ASSET_PAGE_SIZE = 500;
/** Cap assets scanned for unassigned faces per request (library-wide search can be huge) */
const MAX_ASSETS_SCANNED_FOR_CANDIDATES = 4000;
/** Max Immich `GET /api/people?closestAssetId=<faceId>` calls per panel load */
const MAX_FACE_SIMILARITY_CHECKS = 500;
const SIMILARITY_CHECK_CONCURRENCY = 8;

async function listAccessibleAssetIdsFromMetadataSearch(
  maxAssets: number,
): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  for (;;) {
    if (ids.length >= maxAssets) break;
    const data = await immichJson<ImmichSearchAssetsResponse>(
      "/api/search/metadata",
      {
        method: "POST",
        body: JSON.stringify({
          page,
          size: LIBRARY_ASSET_PAGE_SIZE,
        }),
      },
    );
    for (const asset of data.assets.items) {
      ids.push(asset.id);
      if (ids.length >= maxAssets) break;
    }
    if (
      data.assets.items.length < LIBRARY_ASSET_PAGE_SIZE ||
      page * LIBRARY_ASSET_PAGE_SIZE >= data.assets.total
    ) {
      break;
    }
    page += 1;
    if (page > 80) break;
  }
  return ids;
}

async function getAccessibleAssetIdsForFaceScan(
  personId: string,
  operatorUserId: string | null,
): Promise<string[]> {
  const seen = new Set<string>();

  const [personAssetIds, libraryWideIds] = await Promise.all([
    getPersonAssetIdsInLibrary(personId),
    listAccessibleAssetIdsFromMetadataSearch(MAX_ASSETS_SCANNED_FOR_CANDIDATES).catch(
      () => [] as string[],
    ),
  ]);

  for (const id of personAssetIds) seen.add(id);
  for (const id of libraryWideIds) seen.add(id);

  if (seen.size === 0) {
    const albumIds = await getSharedAlbumIds(operatorUserId);
    if (albumIds.length === 0) return [];
    const fromAlbums = await assetIdsInAlbums(albumIds);
    return fromAlbums;
  }

  return [...seen];
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[];
  let i = 0;

  async function worker() {
    for (;;) {
      const idx = i;
      i += 1;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]!);
    }
  }

  const workers = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

/** Create a person and attach this detected face to them. */
export async function nameUnassignedFace(
  faceId: string,
  name: string,
): Promise<ImmichPerson> {
  const person = await immichJson<ImmichPerson>("/api/people", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  await immichJson(`/api/faces/${person.id}`, {
    method: "PUT",
    body: JSON.stringify({ id: faceId }),
  });
  return person;
}

/** Attach this face to a person that already exists. */
export async function assignFaceToPerson(
  faceId: string,
  personId: string,
): Promise<ImmichPerson> {
  await immichJson(`/api/faces/${personId}`, {
    method: "PUT",
    body: JSON.stringify({ id: faceId }),
  });
  return getPerson(personId);
}

/** Remove a face from its person (returns to unidentified); `force: false` per Immich. */
export async function unlinkFaceFromPerson(faceId: string): Promise<void> {
  await immichJson(`/api/faces/${faceId}`, {
    method: "DELETE",
    body: JSON.stringify({ force: false }),
  });
}

async function assetIdsInAlbums(albumIds: string[]): Promise<string[]> {
  const ids = new Set<string>();
  for (const albumId of albumIds) {
    let page = 1;
    for (;;) {
      const data = await immichJson<ImmichSearchAssetsResponse>(
        "/api/search/metadata",
        {
          method: "POST",
          body: JSON.stringify({
            albumIds: [albumId],
            page,
            size: ALBUM_ASSET_PAGE_SIZE,
          }),
        },
      );
      for (const asset of data.assets.items) ids.add(asset.id);
      if (
        data.assets.items.length < ALBUM_ASSET_PAGE_SIZE ||
        page * ALBUM_ASSET_PAGE_SIZE >= data.assets.total
      ) {
        break;
      }
      page += 1;
      if (page > 50) break;
    }
  }
  return [...ids];
}

export async function listUnassignedFacesInSharedAlbums(
  operatorUserId: string | null,
): Promise<UnassignedFace[]> {
  const albumIds = await getSharedAlbumIds(operatorUserId);
  if (albumIds.length === 0) return [];
  const assetIds = await assetIdsInAlbums(albumIds);
  const facesByAsset = await getFacesForAssets(
    assetIds,
    UNASSIGNED_FACE_CONCURRENCY,
  );
  const faces: UnassignedFace[] = [];
  for (const [assetId, assetFaces] of Object.entries(facesByAsset)) {
    for (const face of assetFaces) {
      if (face.person) continue;
      faces.push({
        id: face.id,
        assetId,
        boundingBoxX1: face.boundingBoxX1,
        boundingBoxY1: face.boundingBoxY1,
        boundingBoxX2: face.boundingBoxX2,
        boundingBoxY2: face.boundingBoxY2,
        imageWidth: face.imageWidth,
        imageHeight: face.imageHeight,
      });
    }
  }
  return faces;
}

export async function getAssetFaces(assetId: string): Promise<ImmichAssetFace[]> {
  const path = `/api/faces?id=${encodeURIComponent(assetId)}`;
  return immichJsonTarget<ImmichAssetFace[]>(path);
}

export async function getFacesForAssets(
  assetIds: string[],
  concurrency = FACE_BATCH_CONCURRENCY,
): Promise<Record<string, ImmichAssetFace[]>> {
  const ids = [...new Set(assetIds)];
  const out: Record<string, ImmichAssetFace[]> = {};
  let cursor = 0;

  async function worker() {
    while (cursor < ids.length) {
      const id = ids[cursor];
      cursor += 1;
      try {
        out[id] = await getAssetFaces(id);
      } catch {
        out[id] = [];
      }
    }
  }

  const workers = Math.min(concurrency, ids.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

function toUnassignedShape(
  face: ImmichAssetFace,
  assetId: string,
): UnassignedFace {
  return {
    id: face.id,
    assetId,
    boundingBoxX1: face.boundingBoxX1,
    boundingBoxY1: face.boundingBoxY1,
    boundingBoxX2: face.boundingBoxX2,
    boundingBoxY2: face.boundingBoxY2,
    imageWidth: face.imageWidth,
    imageHeight: face.imageHeight,
  };
}

/**
 * (a) All faces linked to this person (library-wide).
 * (b) Unassigned faces on scanned assets where Immich’s `GET /api/people?closestAssetId=<faceId>`
 * ranked list includes this person. **Metric:** 1-based rank in that list (lower = more similar).
 * We walk up to 4000 accessible assets from metadata search
 * (plus this person’s assets). Large libraries may not list every unlinked face in one response.
 */
export async function listPersonFacePanelRowsForPerson(
  personId: string,
  operatorUserId: string | null,
): Promise<PersonFacePanelRow[]> {
  const scanAssetIds = await getAccessibleAssetIdsForFaceScan(
    personId,
    operatorUserId,
  );
  if (scanAssetIds.length === 0) return [];

  const facesByAsset = await getFacesForAssets(
    scanAssetIds,
    UNASSIGNED_FACE_CONCURRENCY,
  );

  const linkedFaceIds = new Set<string>();
  const linked: PersonFacePanelRow[] = [];

  for (const assetId of scanAssetIds) {
    for (const face of facesByAsset[assetId] ?? []) {
      if (face.person?.id !== personId) continue;
      const shape = toUnassignedShape(face, assetId);
      linkedFaceIds.add(shape.id);
      linked.push({
        kind: "linked",
        face: shape,
        similarityRank: null,
        otherPersonId: null,
        otherPersonName: null,
      });
    }
  }

  function sortByAssetThenFaceId(a: PersonFacePanelRow, b: PersonFacePanelRow) {
    const c = a.face.assetId.localeCompare(b.face.assetId);
    if (c !== 0) return c;
    return a.face.id.localeCompare(b.face.id);
  }
  linked.sort(sortByAssetThenFaceId);

  const candidates = new Map<string, UnassignedFace>();
  for (const assetId of scanAssetIds) {
    for (const face of facesByAsset[assetId] ?? []) {
      if (face.person != null) continue;
      const shape = toUnassignedShape(face, assetId);
      if (linkedFaceIds.has(shape.id)) continue;
      candidates.set(shape.id, shape);
    }
  }

  const candidateList = [...candidates.values()];
  let toRank = candidateList;
  if (candidateList.length > MAX_FACE_SIMILARITY_CHECKS) {
    toRank = candidateList
      .map((face) => ({ face, h: hashUuid(face.id) }))
      .sort((a, b) => a.h - b.h)
      .slice(0, MAX_FACE_SIMILARITY_CHECKS)
      .map((x) => x.face);
  }

  const rankOpts = { maxPages: 2, pageSize: 500 } as const;

  const ranks = await mapWithConcurrency(
    toRank,
    SIMILARITY_CHECK_CONCURRENCY,
    async (shape) => {
      const rank = await getPersonSimilarityRankToFace(
        personId,
        shape.id,
        rankOpts,
      );
      return { shape, bestRank: rank };
    },
  );

  const similar: PersonFacePanelRow[] = [];
  for (const { shape, bestRank } of ranks) {
    if (bestRank == null) continue;
    similar.push({
      kind: "similar_unassigned",
      face: shape,
      similarityRank: bestRank,
      otherPersonId: null,
      otherPersonName: null,
    });
  }

  similar.sort((a, b) => {
    const ra = a.similarityRank ?? 999999;
    const rb = b.similarityRank ?? 999999;
    if (ra !== rb) return ra - rb;
    return sortByAssetThenFaceId(a, b);
  });
  return [...linked, ...similar];
}

function hashUuid(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}
