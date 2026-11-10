import { isProvenanceTag, tagPath } from "@/lib/immich/tag-policy";
import type { ImmichTag } from "@/lib/immich/types";

/** Catalog tags attached to every asset in the list (by tag id). */
export function tagsInCommon(assets: { tags?: ImmichTag[] }[]): ImmichTag[] {
  if (assets.length === 0) return [];
  const lists = assets.map((asset) => asset.tags ?? []);
  const common = new Map<string, ImmichTag>();
  for (const tag of lists[0] ?? []) {
    common.set(tag.id, tag);
  }
  for (let i = 1; i < lists.length; i += 1) {
    const ids = new Set((lists[i] ?? []).map((t) => t.id));
    for (const id of [...common.keys()]) {
      if (!ids.has(id)) common.delete(id);
    }
  }
  return [...common.values()].sort((a, b) =>
    tagPath(a).localeCompare(tagPath(b)),
  );
}

export function partitionCommonTags(tags: ImmichTag[]): {
  catalog: ImmichTag[];
  provenanceLocked: ImmichTag[];
} {
  const catalog: ImmichTag[] = [];
  const provenanceLocked: ImmichTag[] = [];
  for (const tag of tags) {
    const path = tagPath(tag);
    if (isProvenanceTag(path)) provenanceLocked.push(tag);
    else catalog.push(tag);
  }
  return { catalog, provenanceLocked };
}
