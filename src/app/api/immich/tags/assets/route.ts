import { z } from "zod";
import {
  attachTagToAssets,
  detachTagFromAssets,
} from "@/lib/immich/tags";

const bulkTagBodySchema = z
  .object({
    assetIds: z.array(z.string().uuid()).min(1),
    tagId: z.string().min(1).optional(),
    value: z.string().trim().min(1).optional(),
  })
  .refine((body) => Boolean(body.tagId) !== Boolean(body.value), {
    message: "Provide tagId or value",
  });

function errorResponse(e: unknown, fallback: string) {
  const message = e instanceof Error ? e.message : fallback;
  const status =
    e && typeof e === "object" && "status" in e
      ? Number((e as { status: number }).status)
      : 500;
  return Response.json({ error: message }, { status: status || 500 });
}

export async function PUT(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bulkTagBodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const { assetIds, tagId, value } = parsed.data;
    const outcome = await attachTagToAssets(assetIds, {
      tagId,
      value,
    });
    return Response.json(outcome);
  } catch (e) {
    return errorResponse(e, "Failed to attach tag");
  }
}

export async function DELETE(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bulkTagBodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const { assetIds, tagId, value } = parsed.data;
    const outcome = await detachTagFromAssets(assetIds, {
      tagId,
      value,
    });
    return Response.json(outcome);
  } catch (e) {
    return errorResponse(e, "Failed to detach tag");
  }
}
