import { getCuratorEnv, hasOperatorApiKey } from "@/lib/config/env";
import { getAlbum, getAlbumAssets } from "@/lib/immich/albums";
import { resolveExploreForAsset } from "@/lib/immich/explore-context";
import { resolveOperatorUserIdCached } from "@/lib/immich/users";
import { ExploreWorkspace } from "@/components/explore/explore-workspace";
import { ConfigError } from "@/components/config-error";
import type { ShellContext } from "@/lib/server/shell-context";
import type { ImmichAlbum, ImmichAsset } from "@/lib/immich/types";

type ExploreData =
  | {
      ok: true;
      album: ImmichAlbum;
      assets: ImmichAsset[];
      initialSelectedAssetId: string | null;
    }
  | { ok: false; message: string };

async function loadExploreData(
  assetId: string | undefined,
  albumId: string | undefined,
): Promise<ExploreData> {
  try {
    const env = getCuratorEnv();
    const operatorUserId = await resolveOperatorUserIdCached();

    if (assetId) {
      const ctx = await resolveExploreForAsset(
        assetId,
        operatorUserId,
        env.defaultAlbumId ?? null,
        albumId ?? null,
      );
      return {
        ok: true,
        album: ctx.album,
        assets: ctx.assets,
        initialSelectedAssetId: ctx.selectedAssetId,
      };
    }

    if (!env.defaultAlbumId) {
      return {
        ok: false,
        message:
          "Set CURATOR_DEFAULT_ALBUM_ID or POUNDSGATE_ALBUM_ID in .env.local to the Poundsgate (or default) album UUID.",
      };
    }
    const album = await getAlbum(env.defaultAlbumId);
    const assets = await getAlbumAssets(env.defaultAlbumId);
    return {
      ok: true,
      album,
      assets,
      initialSelectedAssetId: null,
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unexpected error loading album.";
    return { ok: false, message };
  }
}

type ExploreDataProps = {
  shell: ShellContext;
  assetId: string | undefined;
  albumId: string | undefined;
};

/**
 * Async server segment: uncached Immich fetches run inside Suspense on the parent route
 * so Cache Components / partial prefetch does not warn on navigation.
 */
export async function ExploreData({
  shell,
  assetId,
  albumId,
}: ExploreDataProps) {
  const data = await loadExploreData(assetId, albumId);

  if (!data.ok) {
    return <ConfigError shell={shell} message={data.message} />;
  }

  const operatorUserId = await resolveOperatorUserIdCached();
  return (
    <ExploreWorkspace
      shell={shell}
      album={data.album}
      assets={data.assets}
      initialSelectedAssetId={data.initialSelectedAssetId}
      curationConfig={{
        operatorUserId,
        operatorCommentsEnabled: hasOperatorApiKey(),
      }}
    />
  );
}
