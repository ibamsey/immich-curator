import { z } from "zod";
import { getCuratorEnv } from "@/lib/config/env";
import {
  getAlbum,
  removeAlbumUser,
  shareOrUpdateAlbumUser,
} from "@/lib/immich/albums";
import { resolveOperatorUserId } from "@/lib/immich/users";

const bodySchema = z.object({
  role: z.enum(["editor", "viewer"]).optional(),
  userId: z.string().uuid().optional(),
});

type Params = { params: Promise<{ albumId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { albumId } = await params;
    const json: unknown = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const env = getCuratorEnv();
    const role = parsed.data.role ?? env.defaultShareRole;
    const userId =
      parsed.data.userId ?? (await resolveOperatorUserId()) ?? undefined;
    if (!userId) {
      return Response.json(
        {
          error:
            "Set CURATOR_OPERATOR_USER_ID or CURATOR_OPERATOR_EMAIL (and optional IMMICH_ADMIN_API_KEY for lookup) in .env.local",
        },
        { status: 400 },
      );
    }
    const album = await getAlbum(albumId);
    const existing = album.albumUsers?.find((u) => u.user.id === userId);
    const updated = await shareOrUpdateAlbumUser(
      albumId,
      userId,
      role,
      existing?.role,
    );
    return Response.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Share failed";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { albumId } = await params;
    const userId = (await resolveOperatorUserId()) ?? undefined;
    if (!userId) {
      return Response.json(
        {
          error:
            "Set CURATOR_OPERATOR_USER_ID or CURATOR_OPERATOR_EMAIL (and optional IMMICH_ADMIN_API_KEY for lookup) in .env.local",
        },
        { status: 400 },
      );
    }
    const album = await getAlbum(albumId);
    const existing = album.albumUsers?.find((u) => u.user.id === userId);
    if (!existing || existing.role === "owner") {
      return Response.json(
        { error: "Operator is not a collaborator on this album" },
        { status: 400 },
      );
    }
    const updated = await removeAlbumUser(albumId, userId);
    return Response.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unshare failed";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
