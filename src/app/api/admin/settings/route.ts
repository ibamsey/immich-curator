import {
  adminSettingsPutSchema,
} from "@/lib/config/admin-settings-schema";
import {
  applyAdminSettingsPut,
  buildSanitizedAdminSettings,
} from "@/lib/config/admin-settings";

export async function GET() {
  try {
    const settings = await buildSanitizedAdminSettings();
    return Response.json(settings);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load settings";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = adminSettingsPutSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
    const result = await applyAdminSettingsPut(parsed.data);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    const settings = await buildSanitizedAdminSettings();
    return Response.json(settings);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save settings";
    return Response.json({ error: message }, { status: 500 });
  }
}
