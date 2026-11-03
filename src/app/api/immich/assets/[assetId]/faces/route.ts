import { getAssetFaces } from "@/lib/immich/faces";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const faces = await getAssetFaces(assetId);
    return Response.json({ faces });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load faces";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
