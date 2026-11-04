import { NextResponse } from "next/server";
import { listUnassignedFacesInSharedAlbums } from "@/lib/immich/faces";
import { resolveOperatorUserId } from "@/lib/immich/users";

export const maxDuration = 120;

export async function GET() {
  try {
    const operatorUserId = await resolveOperatorUserId();
    const faces = await listUnassignedFacesInSharedAlbums(operatorUserId);
    return NextResponse.json({ faces });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load unidentified faces";
    return NextResponse.json({ message }, { status: 502 });
  }
}
