import { NextResponse } from "next/server";
import { z } from "zod";
import { createPerson, getPeopleInSharedScope } from "@/lib/immich/people";
import { resolveOperatorUserId } from "@/lib/immich/users";

const createSchema = z.object({ name: z.string().min(1) });

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

export async function POST(request: Request) {
  try {
    const body = createSchema.parse(await request.json());
    const person = await createPerson(body.name);
    return NextResponse.json(person);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message =
      e instanceof Error ? e.message : "Failed to create person";
    return NextResponse.json({ message }, { status: 502 });
  }
}
