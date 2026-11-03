import { getAsset } from "@/lib/immich/assets";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const asset = await getAsset(assetId);
    return Response.json(asset);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load asset";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
