import { NextResponse } from "next/server";
import { z } from "zod";
import { createManualFace } from "@/lib/immich/faces";
import { invalidateSharedPeopleIndex } from "@/lib/immich/shared-people-index";

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

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const { width, height, x, y, imageWidth, imageHeight } = body;
    if (x + width > imageWidth || y + height > imageHeight) {
      return NextResponse.json(
        { message: "Bounding box outside image dimensions" },
        { status: 400 },
      );
    }
    await createManualFace(body);
    invalidateSharedPeopleIndex();
    return new NextResponse(null, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Failed to create face";
    return NextResponse.json({ message }, { status: 502 });
  }
}
