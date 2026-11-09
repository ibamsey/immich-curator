import type { GridAsset } from "@/lib/assets/grid-asset";
import type { PersonAssetLinkedFaceHint } from "@/lib/people/person-asset-linked-faces";

/** Multi-person badges for RHS photo list (from search `withPeople` on assets). */
export function peopleCountHintsFromAssets(
  assets: GridAsset[],
): Record<string, PersonAssetLinkedFaceHint> {
  const out: Record<string, PersonAssetLinkedFaceHint> = {};
  for (const asset of assets) {
    const count = asset.people?.length ?? 0;
    if (count > 1) {
      out[asset.id] = { count };
    }
  }
  return out;
}
