import { getAllAlbums } from "@/lib/immich/albums";
import { getCuratorEnv } from "@/lib/config/env";
import { resolveOperatorUserId } from "@/lib/immich/users";
import { loadShellContext } from "@/lib/server/shell-context";
import { AlbumsWorkspace } from "@/components/albums/albums-workspace";
import { ConfigError } from "@/components/config-error";
import type { CuratorShareConfig } from "@/components/albums/album-detail-panel";
import type { ImmichAlbum } from "@/lib/immich/types";

type AlbumsData =
  | { ok: true; albums: ImmichAlbum[]; shareConfig: CuratorShareConfig }
  | { ok: false; message: string };

async function loadAlbumsData(): Promise<AlbumsData> {
  try {
    const env = getCuratorEnv();
    const albums = await getAllAlbums();
    const operatorUserId = await resolveOperatorUserId();
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

export default async function AlbumsPage() {
  const shell = await loadShellContext();
  const data = await loadAlbumsData();

  if (!data.ok) {
    return <ConfigError shell={shell} message={data.message} />;
  }

  return (
    <AlbumsWorkspace
      shell={shell}
      initialAlbums={data.albums}
      shareConfig={data.shareConfig}
    />
  );
}
