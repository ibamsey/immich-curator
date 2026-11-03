import { NextResponse } from "next/server";
import {
  getPersonAssetsInSharedAlbums,
  getSharedAlbumIds,
} from "@/lib/immich/shared-album-scope";
import { resolveOperatorUserId } from "@/lib/immich/users";

type Params = { params: Promise<{ personId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { personId } = await params;
    const operatorUserId = await resolveOperatorUserId();
    const sharedAlbumIds = await getSharedAlbumIds(operatorUserId);
    const assets = await getPersonAssetsInSharedAlbums(
      personId,
      sharedAlbumIds,
    );
    return NextResponse.json({ assets, sharedAlbumIds });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load person assets";
    return NextResponse.json({ message }, { status: 502 });
  }
}
