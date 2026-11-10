import { z } from "zod";
import { getAssetsTagSummaries } from "@/lib/immich/asset-tag-summaries";

const bodySchema = z.object({
  assetIds: z.array(z.string().uuid()).min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const assets = await getAssetsTagSummaries(parsed.data.assetIds);
    return Response.json({ assets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load tags";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
