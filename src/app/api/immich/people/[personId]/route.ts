import { NextResponse } from "next/server";
import { z } from "zod";
import { deletePerson, getPerson, updatePerson } from "@/lib/immich/people";

type Params = { params: Promise<{ personId: string }> };

const updateSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().nullable().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const { personId } = await params;
    const person = await getPerson(personId);
    return NextResponse.json(person);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load person";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { personId } = await params;
    const body = updateSchema.parse(await request.json());
    const payload: { name?: string; birthDate?: string | null } = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.birthDate !== undefined) payload.birthDate = body.birthDate;
    const person = await updatePerson(personId, payload);
    return NextResponse.json(person);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Failed to update person";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { personId } = await params;
    await deletePerson(personId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to delete person";
    return NextResponse.json({ message }, { status: 502 });
  }
}
