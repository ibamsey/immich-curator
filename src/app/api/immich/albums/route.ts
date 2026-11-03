import { getAllAlbums } from "@/lib/immich/albums";

export async function GET() {
  try {
    const albums = await getAllAlbums();
    return Response.json({ albums });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list albums";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
