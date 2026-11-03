import { getCuratorEnv } from "@/lib/config/env";
import { resolveOperatorUserId } from "@/lib/immich/users";

export async function GET() {
  try {
    const env = getCuratorEnv();
    const operatorUserId = await resolveOperatorUserId();
    return Response.json({
      operatorEmail: env.operatorEmail ?? null,
      operatorUserId,
      defaultShareRole: env.defaultShareRole,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuration error";
    return Response.json({ error: message }, { status: 503 });
  }
}
