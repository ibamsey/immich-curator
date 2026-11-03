import { getCuratorEnv } from "@/lib/config/env";
import { immichFetch } from "@/lib/immich/client";
import { getCurrentUser } from "@/lib/immich/assets";

export async function GET() {
  try {
    getCuratorEnv();
    const ping = await immichFetch("/api/server/ping");
    if (!ping.ok) {
      return Response.json(
        { ok: false, error: "Immich ping failed" },
        { status: 502 },
      );
    }
    const target = await getCurrentUser();
    const env = getCuratorEnv();
    return Response.json({
      ok: true,
      target: { id: target.id, email: target.email, name: target.name },
      operatorEmail: env.operatorEmail ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuration error";
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}
