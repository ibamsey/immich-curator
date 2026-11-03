import { getAlbum, getAlbumAssets } from "@/lib/immich/albums";
import { getAsset } from "@/lib/immich/assets";
import {
  albumContainsAsset,
  getSharedAlbumIds,
} from "@/lib/immich/shared-album-scope";
import type { ImmichAlbum, ImmichAsset } from "@/lib/immich/types";

export type ExploreContext = {
  album: ImmichAlbum;
  assets: ImmichAsset[];
  selectedAssetId: string;
};

export async function resolveExploreForAsset(
  assetId: string,
  operatorUserId: string | null,
  defaultAlbumId: string | null,
  preferredAlbumId: string | null,
): Promise<ExploreContext> {
  const sharedIds = await getSharedAlbumIds(operatorUserId);
  const candidateOrder: string[] = [];

  if (preferredAlbumId && sharedIds.includes(preferredAlbumId)) {
    candidateOrder.push(preferredAlbumId);
  }
  if (
    defaultAlbumId &&
    sharedIds.includes(defaultAlbumId) &&
    !candidateOrder.includes(defaultAlbumId)
  ) {
    candidateOrder.push(defaultAlbumId);
  }
  for (const id of sharedIds) {
    if (!candidateOrder.includes(id)) candidateOrder.push(id);
  }

  let albumId: string | null = null;
  for (const id of candidateOrder) {
    if (await albumContainsAsset(id, assetId)) {
      albumId = id;
      break;
    }
  }

  if (!albumId) {
    if (defaultAlbumId) {
      albumId = defaultAlbumId;
    } else if (sharedIds[0]) {
      albumId = sharedIds[0];
    } else {
      throw new Error("No shared album available for Explore context.");
    }
  }

  const [album, assets, selectedAsset] = await Promise.all([
    getAlbum(albumId),
    getAlbumAssets(albumId),
    getAsset(assetId),
  ]);

  const assetIds = new Set(assets.map((a) => a.id));
  const mergedAssets = assetIds.has(assetId)
    ? assets
    : [selectedAsset, ...assets];

  return {
    album,
    assets: mergedAssets,
    selectedAssetId: assetId,
  };
}
