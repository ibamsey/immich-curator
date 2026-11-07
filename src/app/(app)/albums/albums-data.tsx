import { connection } from "next/server";
import { getAllAlbums } from "@/lib/immich/albums";
import { getCuratorEnv, hasOperatorApiKey } from "@/lib/config/env";
import { resolveOperatorUserIdCached } from "@/lib/immich/users";
import { AlbumsWorkspace } from "@/components/albums/albums-workspace";
import { ConfigError } from "@/components/config-error";
import type { CuratorShareConfig } from "@/components/albums/album-detail-panel";
import type { ImmichAlbum } from "@/lib/immich/types";
import type { ShellContext } from "@/lib/server/shell-context";

type AlbumsLoadResult =
  | { ok: true; albums: ImmichAlbum[]; shareConfig: CuratorShareConfig }
  | { ok: false; message: string };

async function loadAlbumsData(): Promise<AlbumsLoadResult> {
  try {
    const env = getCuratorEnv();
    const albums = await getAllAlbums();
    const operatorUserId = await resolveOperatorUserIdCached();
    return {
      ok: true,
      albums,
      shareConfig: {
        operatorEmail: env.operatorEmail ?? null,
        operatorUserId,
        defaultShareRole: env.defaultShareRole,
      },
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unexpected error loading albums.";
    return { ok: false, message };
  }
}

type AlbumsDataProps = {
  shell: ShellContext;
};

export async function AlbumsData({ shell }: AlbumsDataProps) {
  await connection();
  const data = await loadAlbumsData();

  if (!data.ok) {
    return (
      <ConfigError
        shell={shell}
        message={data.message}
        headerTitle="Albums"
        heading="Cannot load albums"
      />
    );
  }

  return (
    <AlbumsWorkspace
      shell={shell}
      initialAlbums={data.albums}
      shareConfig={data.shareConfig}
      curationConfig={{
        operatorUserId: data.shareConfig.operatorUserId,
        operatorCommentsEnabled: hasOperatorApiKey(),
      }}
    />
  );
}
