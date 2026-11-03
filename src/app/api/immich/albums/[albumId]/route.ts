import { getAlbum } from "@/lib/immich/albums";

type Params = { params: Promise<{ albumId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { albumId } = await params;
    const album = await getAlbum(albumId);
    return Response.json(album);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load album";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
