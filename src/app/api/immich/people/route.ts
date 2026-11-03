import { NextResponse } from "next/server";
import { getPeopleInSharedScope } from "@/lib/immich/people";
import { resolveOperatorUserId } from "@/lib/immich/users";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const operatorUserId = await resolveOperatorUserId();

    if (scope === "shared") {
      const { people, sharedAlbumIds } =
        await getPeopleInSharedScope(operatorUserId);
      return NextResponse.json({ people, sharedAlbumIds });
    }

    return NextResponse.json(
      { message: "Unsupported scope; use scope=shared" },
      { status: 400 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load people";
    return NextResponse.json({ message }, { status: 502 });
  }
}
