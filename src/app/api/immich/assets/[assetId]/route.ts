import { z } from "zod";
import { loadCuratorConfig } from "@/lib/config/curator-config.server";
import { deleteAsset, getAsset, updateAsset } from "@/lib/immich/assets";
import { readImageResolutionFromFile } from "@/lib/immich/read-image-resolution";
import type { ImmichAssetWithEnrichment } from "@/lib/immich/types";

type Params = { params: Promise<{ assetId: string }> };

const updateSchema = z.object({
  description: z.string().optional(),
  localDateTime: z.string().min(1).optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const asset = await getAsset(assetId);
    const fileResolution = await readImageResolutionFromFile(
      assetId,
      asset.originalPath,
    );

    const payload: ImmichAssetWithEnrichment = { ...asset };
    if (fileResolution) {
      payload.curatorEnrichment = { resolution: fileResolution };
    } else {
      const config = loadCuratorConfig();
      payload.curatorEnrichment = {
        resolution: {
          dpiX: config.scanDefaultDpi,
          dpiY: config.scanDefaultDpi,
          source: "default",
        },
      };
    }

    return Response.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load asset";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const json: unknown = await request.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    if (
      parsed.data.description === undefined &&
      parsed.data.localDateTime === undefined
    ) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }
    const asset = await updateAsset(assetId, parsed.data);
    return Response.json(asset);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update asset";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    await deleteAsset(assetId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete asset";
    const status =
      e && typeof e === "object" && "status" in e
        ? Number((e as { status: number }).status)
        : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
