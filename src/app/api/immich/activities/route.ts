import { z } from "zod";
import {
  createAssetComment,
  getAssetCommentActivities,
} from "@/lib/immich/activities";
import { hasOperatorApiKey } from "@/lib/config/env";

const postSchema = z.object({
  albumId: z.string().uuid(),
  assetId: z.string().uuid(),
  comment: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");
    const assetId = searchParams.get("assetId");
    if (!albumId || !assetId) {
      return Response.json(
        { error: "albumId and assetId query params required" },
        { status: 400 },
      );
    }
    const activities = await getAssetCommentActivities(albumId, assetId);
    return Response.json({
      activities,
      operatorCommentsEnabled: hasOperatorApiKey(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load activities";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasOperatorApiKey()) {
      return Response.json(
        { error: "Set IMMICH_OPERATOR_API_KEY in .env.local" },
        { status: 503 },
      );
    }
    const json: unknown = await request.json();
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const { albumId, assetId, comment } = parsed.data;
    const activity = await createAssetComment(albumId, assetId, comment);
    return Response.json(activity, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to post comment";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
