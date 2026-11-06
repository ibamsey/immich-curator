import { immichJsonTarget } from "@/lib/immich/client";
import type { ImmichDuplicateGroup } from "@/lib/immich/types";

export async function getDuplicateGroups(): Promise<ImmichDuplicateGroup[]> {
  return immichJsonTarget<ImmichDuplicateGroup[]>("/api/duplicates");
}
