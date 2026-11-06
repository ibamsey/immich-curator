import { z } from "zod";
import { listTags, upsertTags } from "@/lib/immich/tags";

const upsertSchema = z.object({
  tags: z.array(z.string().trim().min(1)).min(1),
});

function errorResponse(e: unknown, fallback: string) {
  const message = e instanceof Error ? e.message : fallback;
  const status =
    e && typeof e === "object" && "status" in e
      ? Number((e as { status: number }).status)
      : 500;
  return Response.json({ error: message }, { status: status || 500 });
}

export async function GET() {
  try {
    const tags = await listTags();
    return Response.json(tags);
  } catch (e) {
    return errorResponse(e, "Failed to list tags");
  }
}

export async function PUT(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = upsertSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const tags = await upsertTags(parsed.data.tags);
    return Response.json(tags);
  } catch (e) {
    return errorResponse(e, "Failed to upsert tags");
  }
}
