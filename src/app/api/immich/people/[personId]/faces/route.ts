import { NextResponse } from "next/server";
import {
  listLinkedFacePanelRowsForPerson,
  listPersonFacePanelRowsForPerson,
} from "@/lib/immich/faces";
import { getSharedAlbumIds } from "@/lib/immich/shared-album-scope";
import { resolveOperatorUserId } from "@/lib/immich/users";

export const maxDuration = 120;

type Params = { params: Promise<{ personId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { personId } = await params;
    const operatorUserId = await resolveOperatorUserId();
    const mode = new URL(request.url).searchParams.get("mode");
    const sharedAlbumIds = await getSharedAlbumIds(operatorUserId);
    const rows =
      mode === "scan"
        ? await listPersonFacePanelRowsForPerson(personId, operatorUserId)
        : await listLinkedFacePanelRowsForPerson(personId, sharedAlbumIds);
    return NextResponse.json({ rows });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load person faces";
    return NextResponse.json({ message }, { status: 502 });
  }
}
