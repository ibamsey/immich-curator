import { immichJson, immichJsonTarget } from "@/lib/immich/client";
import { getPerson } from "@/lib/immich/people";
import { getSharedAlbumIds } from "@/lib/immich/shared-album-scope";
import type { UnassignedFace } from "@/lib/people/unassigned-face";
import type {
  ImmichAssetFace,
  ImmichPerson,
  ImmichSearchAssetsResponse,
} from "@/lib/immich/types";

const FACE_BATCH_CONCURRENCY = 6;
const UNASSIGNED_FACE_CONCURRENCY = 12;
const ALBUM_ASSET_PAGE_SIZE = 1000;

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
