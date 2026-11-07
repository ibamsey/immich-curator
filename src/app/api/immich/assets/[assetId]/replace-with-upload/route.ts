import { NextResponse } from "next/server";
import { replaceAssetViaUpload } from "@/lib/immich/assets";
import { ImmichApiError } from "@/lib/immich/client";
import { getCuratorEnv } from "@/lib/config/env";

type Params = { params: Promise<{ assetId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { message: "Expected multipart field `file`" },
        { status: 400 },
      );
    }

    const fileName = String(form.get("filename") || "edited.jpg");
    const fileCreatedAt = String(
      form.get("fileCreatedAt") || new Date().toISOString(),
    );
    const fileModifiedAt = String(
      form.get("fileModifiedAt") || fileCreatedAt,
    );

    const asset = await replaceAssetViaUpload({
      oldAssetId: assetId,
      file,
      fileName,
      fileCreatedAt,
      fileModifiedAt,
    });

    return NextResponse.json({ asset });
  } catch (e) {
    getCuratorEnv();
    const message = e instanceof Error ? e.message : "Replace failed";
    const status = e instanceof ImmichApiError ? e.status : 500;
    return NextResponse.json({ message }, { status });
  }
}
