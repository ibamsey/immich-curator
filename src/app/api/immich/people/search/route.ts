import { NextResponse } from "next/server";
import { z } from "zod";
import { searchPeopleByName } from "@/lib/immich/people";

const querySchema = z.object({
  name: z.string().min(1),
  withHidden: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      name: url.searchParams.get("name") ?? "",
      withHidden: url.searchParams.get("withHidden") ?? undefined,
    });
    const people = await searchPeopleByName(parsed.name, parsed.withHidden);
    return NextResponse.json({ people });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Person search failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
