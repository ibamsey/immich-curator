import { NextResponse } from "next/server";
import { z } from "zod";
import { getFacesForAssets } from "@/lib/immich/faces";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(48),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { ids } = bodySchema.parse(json);
    const facesByAssetId = await getFacesForAssets(ids);
    return NextResponse.json({ facesByAssetId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Failed to load faces";
    return NextResponse.json({ message }, { status: 502 });
  }
}
