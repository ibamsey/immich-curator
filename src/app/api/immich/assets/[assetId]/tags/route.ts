import { z } from "zod";
import { attachTagToAsset, detachTagFromAsset } from "@/lib/immich/tags";

type Params = { params: Promise<{ assetId: string }> };

const tagRefSchema = z
  .object({
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

async function readRef(request: Request) {
  const json: unknown = await request.json();
  return tagRefSchema.safeParse(json);
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const parsed = await readRef(request);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const asset = await attachTagToAsset(assetId, parsed.data);
    return Response.json(asset);
  } catch (e) {
    return errorResponse(e, "Failed to add tag");
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const parsed = await readRef(request);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const asset = await detachTagFromAsset(assetId, parsed.data);
    return Response.json(asset);
  } catch (e) {
    return errorResponse(e, "Failed to remove tag");
  }
}
