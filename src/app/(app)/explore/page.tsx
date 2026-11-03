import { getCuratorEnv, hasOperatorApiKey } from "@/lib/config/env";
import { getAlbum, getAlbumAssets } from "@/lib/immich/albums";
import { resolveOperatorUserId } from "@/lib/immich/users";
import { loadShellContext } from "@/lib/server/shell-context";
import { ExploreWorkspace } from "@/components/explore/explore-workspace";
import { ConfigError } from "@/components/config-error";
import type { ImmichAlbum, ImmichAsset } from "@/lib/immich/types";

type ExploreData =
  | { ok: true; album: ImmichAlbum; assets: ImmichAsset[] }
  | { ok: false; message: string };

async function loadExploreData(): Promise<ExploreData> {
  try {
    const env = getCuratorEnv();
    if (!env.defaultAlbumId) {
      return {
        ok: false,
        message:
          "Set CURATOR_DEFAULT_ALBUM_ID or POUNDSGATE_ALBUM_ID in .env.local to the Poundsgate (or default) album UUID.",
      };
    }
    const album = await getAlbum(env.defaultAlbumId);
    const assets = await getAlbumAssets(env.defaultAlbumId);
    return { ok: true, album, assets };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unexpected error loading album.";
    return { ok: false, message };
  }
}

export default async function ExplorePage() {
  const shell = await loadShellContext();
  const data = await loadExploreData();

  if (!data.ok) {
    return <ConfigError shell={shell} message={data.message} />;
  }

  const operatorUserId = await resolveOperatorUserId();
  return (
    <ExploreWorkspace
      shell={shell}
      album={data.album}
      assets={data.assets}
      curationConfig={{
        operatorUserId,
        operatorCommentsEnabled: hasOperatorApiKey(),
      }}
    />
  );
}
