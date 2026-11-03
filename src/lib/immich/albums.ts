import { ImmichApiError, immichFetch, immichJson } from "@/lib/immich/client";
import type { AlbumShareRole, ImmichAlbum, ImmichAsset } from "@/lib/immich/types";

const ALBUM_ASSET_PAGE_SIZE = 500;

export async function getAllAlbums(): Promise<ImmichAlbum[]> {
  return immichJson<ImmichAlbum[]>("/api/albums");
}

export async function getAlbum(albumId: string): Promise<ImmichAlbum> {
  return immichJson<ImmichAlbum>(`/api/albums/${albumId}`);
}

export async function getAlbumAssets(albumId: string): Promise<ImmichAsset[]> {
  const body = {
    albumIds: [albumId],
    size: ALBUM_ASSET_PAGE_SIZE,
  };
  const data = await immichJson<{
    assets: { items: ImmichAsset[]; total: number };
  }>("/api/search/metadata", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.assets.items;
}

async function parseAlbumMutationResponse(
  albumId: string,
  res: Response,
): Promise<ImmichAlbum> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
  if (res.status === 204) {
    return getAlbum(albumId);
  }
  const text = await res.text();
  if (!text) {
    return getAlbum(albumId);
  }
  return JSON.parse(text) as ImmichAlbum;
}

export async function addUsersToAlbum(
  albumId: string,
  albumUsers: { userId: string; role: AlbumShareRole }[],
): Promise<ImmichAlbum> {
  const res = await immichFetch(`/api/albums/${albumId}/users`, {
    method: "PUT",
    body: JSON.stringify({ albumUsers }),
  });
  return parseAlbumMutationResponse(albumId, res);
}

export async function updateAlbumUserRole(
  albumId: string,
  userId: string,
  role: AlbumShareRole,
): Promise<ImmichAlbum> {
  const res = await immichFetch(`/api/albums/${albumId}/user/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  return parseAlbumMutationResponse(albumId, res);
}

export async function shareOrUpdateAlbumUser(
  albumId: string,
  userId: string,
  role: AlbumShareRole,
  existingRole: string | undefined,
): Promise<ImmichAlbum> {
  if (existingRole && existingRole !== "owner") {
    return updateAlbumUserRole(albumId, userId, role);
  }
  return addUsersToAlbum(albumId, [{ userId, role }]);
}

export async function removeAlbumUser(
  albumId: string,
  userId: string,
): Promise<ImmichAlbum> {
  const res = await immichFetch(`/api/albums/${albumId}/user/${userId}`, {
    method: "DELETE",
  });
  return parseAlbumMutationResponse(albumId, res);
}
