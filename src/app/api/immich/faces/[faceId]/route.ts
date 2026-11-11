import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assignFaceToPerson,
  deleteFaceForce,
  nameUnassignedFace,
  unlinkFaceFromPerson,
} from "@/lib/immich/faces";
import { invalidateSharedPeopleIndex } from "@/lib/immich/shared-people-index";

type Params = { params: Promise<{ faceId: string }> };

const bodySchema = z.union([
  z.object({ personId: z.string().uuid() }),
  z.object({ name: z.string().min(1) }),
]);

export async function PUT(request: Request, { params }: Params) {
  try {
    const { faceId } = await params;
    const body = bodySchema.parse(await request.json());
    const person =
      "personId" in body
        ? await assignFaceToPerson(faceId, body.personId)
        : await nameUnassignedFace(faceId, body.name.trim());
    invalidateSharedPeopleIndex();
    return NextResponse.json(person);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Failed to name face";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { faceId } = await params;
    const force = new URL(request.url).searchParams.get("force") === "true";
    if (force) {
      await deleteFaceForce(faceId);
    } else {
      await unlinkFaceFromPerson(faceId);
    }
    invalidateSharedPeopleIndex();
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update face";
    return NextResponse.json({ message }, { status: 502 });
  }
}
