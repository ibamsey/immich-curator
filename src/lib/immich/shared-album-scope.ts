import { albumSharedWithOperator } from "@/lib/albums/shared-album";
import { getAllAlbums, getAlbumAssets } from "@/lib/immich/albums";
import { immichJson } from "@/lib/immich/client";
import type { ImmichAsset, ImmichSearchAssetsResponse } from "@/lib/immich/types";

const SEARCH_PAGE_SIZE = 500;

export type SharedAlbumScope = {
  sharedAlbumIds: string[];
  sharedAssetIds: Set<string>;
};

export async function getSharedAlbumIds(
  operatorUserId: string | null,
): Promise<string[]> {
  if (!operatorUserId) return [];
  const albums = await getAllAlbums();
  return albums
    .filter((a) => albumSharedWithOperator(a, operatorUserId))
    .map((a) => a.id);
}

export async function getSharedAlbumScope(
  operatorUserId: string | null,
): Promise<SharedAlbumScope> {
  const sharedAlbumIds = await getSharedAlbumIds(operatorUserId);
  const sharedAssetIds = new Set<string>();
  for (const albumId of sharedAlbumIds) {
    const assets = await getAlbumAssets(albumId);
    for (const asset of assets) {
      sharedAssetIds.add(asset.id);
    }
  }
  return { sharedAlbumIds, sharedAssetIds };
}

export async function personHasAssetsInSharedAlbums(
  personId: string,
  sharedAlbumIds: string[],
): Promise<boolean> {
  if (sharedAlbumIds.length === 0) return false;
  const data = await immichJson<ImmichSearchAssetsResponse>(
    "/api/search/metadata",
    {
      method: "POST",
      body: JSON.stringify({
        personIds: [personId],
        albumIds: sharedAlbumIds,
        size: 1,
      }),
    },
  );
  return data.assets.total > 0;
}

export async function getPersonAssetsInSharedAlbums(
  personId: string,
  sharedAlbumIds: string[],
): Promise<ImmichAsset[]> {
  if (sharedAlbumIds.length === 0) return [];
  const data = await immichJson<ImmichSearchAssetsResponse>(
    "/api/search/metadata",
    {
      method: "POST",
      body: JSON.stringify({
        personIds: [personId],
        albumIds: sharedAlbumIds,
        size: SEARCH_PAGE_SIZE,
      }),
    },
  );
  return data.assets.items;
}

export async function albumContainsAsset(
  albumId: string,
  assetId: string,
): Promise<boolean> {
  const assets = await getAlbumAssets(albumId);
  return assets.some((a) => a.id === assetId);
}
