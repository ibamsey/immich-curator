import { z } from "zod";
import {
  deleteActivity,
  findActivityInAlbum,
} from "@/lib/immich/activities";
import { hasOperatorApiKey } from "@/lib/config/env";
import { resolveOperatorUserId } from "@/lib/immich/users";

type Params = { params: Promise<{ activityId: string }> };

const querySchema = z.object({
  albumId: z.string().uuid(),
});

export async function DELETE(request: Request, { params }: Params) {
  try {
    if (!hasOperatorApiKey()) {
      return Response.json(
        { error: "Set IMMICH_OPERATOR_API_KEY in .env.local" },
        { status: 503 },
      );
    }
    const { activityId } = await params;
    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      albumId: searchParams.get("albumId"),
    });
    if (!parsedQuery.success) {
      return Response.json(
        { error: "albumId query param required" },
        { status: 400 },
      );
    }
    const operatorUserId = await resolveOperatorUserId();
    if (!operatorUserId) {
      return Response.json(
        { error: "Operator user id not configured" },
        { status: 400 },
      );
    }
    const activity = await findActivityInAlbum(
      parsedQuery.data.albumId,
      activityId,
    );
    if (!activity) {
      return Response.json({ error: "Activity not found" }, { status: 404 });
    }
    if (activity.user.id !== operatorUserId) {
      return Response.json(
        { error: "Only your own comments can be deleted" },
        { status: 403 },
      );
    }
    await deleteActivity(activityId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete activity";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
