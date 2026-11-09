import { immichJson } from "@/lib/immich/client";
import { getSharedAlbumIds } from "@/lib/immich/shared-album-scope";
import {
  aggregatePeopleFromAssets,
  type AssetPeopleRef,
} from "@/lib/immich/shared-people-index-aggregate";
import type { ImmichAsset, ImmichSearchAssetsResponse } from "@/lib/immich/types";

export type { AssetPeopleRef };
export { aggregatePeopleFromAssets };

const INDEX_TTL_MS = 5 * 60 * 1000;
const INDEX_PAGE_SIZE = 1000;
const MAX_INDEX_PAGES = 200;

export type SharedPeopleIndexData = {
  sharedAlbumIds: string[];
  assetCountByPerson: Record<string, number>;
  peopleByAsset: Record<string, AssetPeopleRef[]>;
  peopleInScope: Set<string>;
};

type CacheEntry = { at: number; key: string; data: SharedPeopleIndexData };

let cache: CacheEntry | null = null;

function cacheKey(sharedAlbumIds: string[]): string {
  return [...sharedAlbumIds].sort().join(",");
}

async function buildSharedPeopleIndex(
  sharedAlbumIds: string[],
): Promise<SharedPeopleIndexData> {
  if (sharedAlbumIds.length === 0) {
    return {
      sharedAlbumIds: [],
      assetCountByPerson: {},
      peopleByAsset: {},
      peopleInScope: new Set(),
    };
  }

  const items: ImmichAsset[] = [];
  let page = 1;
  for (;;) {
    const data = await immichJson<ImmichSearchAssetsResponse>(
      "/api/search/metadata",
      {
        method: "POST",
        body: JSON.stringify({
          albumIds: sharedAlbumIds,
          withPeople: true,
          page,
          size: INDEX_PAGE_SIZE,
        }),
      },
    );
    const batch = data.assets.items ?? [];
    items.push(...batch);
    if (batch.length < INDEX_PAGE_SIZE) break;
    page += 1;
    if (page > MAX_INDEX_PAGES) break;
  }

  const { assetCountByPerson, peopleByAsset, peopleInScope } =
    aggregatePeopleFromAssets(items);

  return {
    sharedAlbumIds,
    assetCountByPerson,
    peopleByAsset,
    peopleInScope,
  };
}

export function invalidateSharedPeopleIndex(): void {
  cache = null;
}

export async function getSharedPeopleIndex(
  operatorUserId: string | null,
): Promise<SharedPeopleIndexData> {
  const sharedAlbumIds = await getSharedAlbumIds(operatorUserId);
  const key = cacheKey(sharedAlbumIds);
  const now = Date.now();
  if (cache && cache.key === key && now - cache.at < INDEX_TTL_MS) {
    return cache.data;
  }
  const data = await buildSharedPeopleIndex(sharedAlbumIds);
  cache = { at: now, key, data };
  return data;
}
