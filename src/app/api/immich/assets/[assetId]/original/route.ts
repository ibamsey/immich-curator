import { getCuratorEnv } from "@/lib/config/env";
import { immichFetch } from "@/lib/immich/client";

type Params = { params: Promise<{ assetId: string }> };

async function originalFromImmich(assetId: string, method: "GET" | "HEAD") {
  return immichFetch(`/api/assets/${assetId}/original`, { method });
}

export async function HEAD(_request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const res = await originalFromImmich(assetId, "HEAD");
    if (!res.ok) {
      return new Response(null, { status: res.status });
    }
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    return new Response(null, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    getCuratorEnv();
    return new Response(null, { status: 503 });
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const res = await originalFromImmich(assetId, "GET");
    if (!res.ok) {
      return new Response(null, { status: res.status });
    }
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    return new Response(res.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    getCuratorEnv();
    return new Response(null, { status: 503 });
  }
}
