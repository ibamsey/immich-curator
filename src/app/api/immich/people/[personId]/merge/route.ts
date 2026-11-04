import { NextResponse } from "next/server";
import { z } from "zod";
import { getPerson, mergePeopleIntoTarget, updatePerson } from "@/lib/immich/people";

type Params = { params: Promise<{ personId: string }> };

const bodySchema = z.object({
  sourcePersonIds: z.array(z.string().uuid()).min(1),
  /** When set, applied to the survivor after merge (Immich rename-on-merge). */
  name: z.string().optional(),
  birthDate: z.string().nullable().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { personId: targetPersonId } = await params;
    const body = bodySchema.parse(await request.json());
    await mergePeopleIntoTarget(targetPersonId, body.sourcePersonIds);

    const payload: { name?: string; birthDate?: string | null } = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.birthDate !== undefined) payload.birthDate = body.birthDate;

    const person =
      Object.keys(payload).length > 0
        ? await updatePerson(targetPersonId, payload)
        : await getPerson(targetPersonId);

    return NextResponse.json({ person });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Merge failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
