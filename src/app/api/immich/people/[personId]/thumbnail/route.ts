import { getCuratorEnv } from "@/lib/config/env";
import { immichFetch } from "@/lib/immich/client";

type Params = { params: Promise<{ personId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { personId } = await params;
    const res = await immichFetch(`/api/people/${personId}/thumbnail`);
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
