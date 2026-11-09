import type { ImmichAsset } from "@/lib/immich/types";

export type AssetPeopleRef = { personId: string; name: string };

export function aggregatePeopleFromAssets(
  items: Pick<ImmichAsset, "id" | "people">[],
): {
  assetCountByPerson: Record<string, number>;
  peopleByAsset: Record<string, AssetPeopleRef[]>;
  peopleInScope: Set<string>;
} {
  const assetCountByPerson: Record<string, number> = {};
  const peopleByAsset: Record<string, AssetPeopleRef[]> = {};
  const peopleInScope = new Set<string>();

  for (const asset of items) {
    const refs: AssetPeopleRef[] = [];
    for (const p of asset.people ?? []) {
      if (!p.id) continue;
      refs.push({
        personId: p.id,
        name: p.name ?? "",
      });
      peopleInScope.add(p.id);
      assetCountByPerson[p.id] = (assetCountByPerson[p.id] ?? 0) + 1;
    }
    peopleByAsset[asset.id] = refs;
  }

  return { assetCountByPerson, peopleByAsset, peopleInScope };
}
