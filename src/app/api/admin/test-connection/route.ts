import { testConnectionSchema } from "@/lib/config/admin-settings-schema";
import { testImmichActor } from "@/lib/config/admin-settings";

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json().catch(() => ({}));
    const parsed = testConnectionSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const which = parsed.data.actor ?? "both";
    const results: {
      target?: { ok: boolean; user?: unknown; error?: string };
      operator?: { ok: boolean; user?: unknown; error?: string };
    } = {};

    if (which === "target" || which === "both") {
      const t = await testImmichActor("target");
      results.target = t.ok
        ? { ok: true, user: t.user }
        : { ok: false, error: t.error };
    }
    if (which === "operator" || which === "both") {
      const o = await testImmichActor("operator");
      results.operator = o.ok
        ? { ok: true, user: o.user }
        : { ok: false, error: o.error };
    }

    const allOk =
      (results.target?.ok ?? true) && (results.operator?.ok ?? true);
    return Response.json({ ok: allOk, ...results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Test failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
