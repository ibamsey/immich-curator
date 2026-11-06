import { getDuplicateGroups } from "@/lib/immich/duplicates";
import { ImmichApiError } from "@/lib/immich/client";

export async function GET() {
  try {
    const groups = await getDuplicateGroups();
    return Response.json(groups);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load duplicate groups.";
    const status =
      e instanceof ImmichApiError
        ? e.status
        : e && typeof e === "object" && "status" in e
          ? Number((e as { status: number }).status)
          : 500;
    return Response.json({ error: message }, { status: status || 500 });
  }
}
