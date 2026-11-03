import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_GRID_QUERY } from "@/lib/assets/grid-query-types";
import { executeAssetsQuery } from "@/lib/immich/execute-assets-query";

const filterSchema = z.object({
  fieldId: z.string(),
  op: z.enum(["eq", "neq", "contains", "empty", "notEmpty", "gt", "lt"]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const bodySchema = z.object({
  scope: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("album"), albumId: z.string().uuid() }),
    z.object({ mode: z.literal("personShared"), personId: z.string().uuid() }),
  ]),
  query: z
    .object({
      sort: z.object({
        fieldId: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
      filters: z.array(filterSchema).optional(),
      groupBy: z.string().nullable().optional(),
    })
    .optional(),
  page: z.number().int().min(1).optional(),
  size: z.number().int().min(1).max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.parse(json);
    const query = {
      ...DEFAULT_GRID_QUERY,
      ...parsed.query,
      filters: parsed.query?.filters ?? DEFAULT_GRID_QUERY.filters,
      groupBy: parsed.query?.groupBy ?? DEFAULT_GRID_QUERY.groupBy,
    };
    const result = await executeAssetsQuery(
      parsed.scope,
      query,
      parsed.page ?? 1,
      parsed.size ?? 500,
    );
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Query failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
