import { getCuratorEnv } from "@/lib/config/env";
import { immichFetch } from "@/lib/immich/client";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const { searchParams } = new URL(request.url);
    const size = searchParams.get("size") ?? "preview";
    const res = await immichFetch(
      `/api/assets/${assetId}/thumbnail?size=${encodeURIComponent(size)}`,
    );
    if (!res.ok) {
      return new Response(null, { status: res.status });
    }
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
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
