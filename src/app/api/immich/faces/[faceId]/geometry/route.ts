import { NextResponse } from "next/server";
import { z } from "zod";
import { replaceFaceBoundingBox } from "@/lib/immich/faces";

type Params = { params: Promise<{ faceId: string }> };

const bodySchema = z.object({
  assetId: z.string().uuid(),
  personId: z.string().uuid(),
  imageWidth: z.number().int().positive(),
  imageHeight: z.number().int().positive(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { faceId } = await params;
    const body = bodySchema.parse(await request.json());
    const { width, height, x, y, imageWidth, imageHeight } = body;
    if (x + width > imageWidth || y + height > imageHeight) {
      return NextResponse.json(
        { message: "Bounding box outside image dimensions" },
        { status: 400 },
      );
    }
    await replaceFaceBoundingBox({ faceId, ...body });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message =
      e instanceof Error ? e.message : "Failed to update face geometry";
    return NextResponse.json({ message }, { status: 502 });
  }
}
