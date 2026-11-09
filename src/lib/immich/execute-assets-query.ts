import { applyClientQueryPhase } from "@/lib/assets/apply-grid-query";
import { defaultComputeContext } from "@/lib/assets/compute-context";
import { normalizeGridAsset } from "@/lib/assets/grid-asset";
import { loadCuratorConfig } from "@/lib/config/curator-config.server";
import type {
  AssetQueryResult,
  GridQuery,
  GridQueryScope,
} from "@/lib/assets/grid-query-types";
import { immichJson } from "@/lib/immich/client";
import { buildMetadataSearchBody } from "@/lib/immich/search-metadata-mapper";
import { getSearchStatisticsTotal } from "@/lib/immich/search-statistics";
import { getSharedAlbumIds } from "@/lib/immich/shared-album-scope";
import { resolveOperatorUserId } from "@/lib/immich/users";

type SearchResponse = {
  assets: { items: Record<string, unknown>[]; total: number };
};

export async function executeAssetsQuery(
  scope: GridQueryScope,
  query: GridQuery,
  page = 1,
  size = 500,
): Promise<AssetQueryResult> {
  const operatorUserId = await resolveOperatorUserId();
  const sharedAlbumIds =
    scope.mode === "personShared"
      ? await getSharedAlbumIds(operatorUserId)
      : [];

  const { body, clientFilters } = buildMetadataSearchBody(
    scope,
    query,
    sharedAlbumIds,
    page,
    size,
  );

  const statsBody = { ...body };
  delete statsBody.page;
  delete statsBody.size;
  delete statsBody.sortBy;

  const [data, exactTotal] = await Promise.all([
    immichJson<SearchResponse>("/api/search/metadata", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    scope.mode === "personShared"
      ? getSearchStatisticsTotal(statsBody)
      : Promise.resolve(null as number | null),
  ]);

  const normalized = data.assets.items.map(normalizeGridAsset);
  const config = loadCuratorConfig();
  const computeCtx = defaultComputeContext(config.scanDefaultDpi);
  const { assets, groups } = applyClientQueryPhase(
    normalized,
    query,
    clientFilters,
    computeCtx,
  );

  return {
    assets,
    total: exactTotal ?? data.assets.total,
    groups,
  };
}
