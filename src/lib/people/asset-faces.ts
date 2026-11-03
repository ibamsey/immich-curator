import type { ImmichPerson } from "@/lib/immich/types";

export type AssetFacesLayout =
  | { mode: "none" }
  | { mode: "sole"; person: ImmichPerson }
  | {
      mode: "wheel";
      context: ImmichPerson;
      spokes: ImmichPerson[];
    };

function dedupeVisible(people: ImmichPerson[]): ImmichPerson[] {
  const seen = new Set<string>();
  const out: ImmichPerson[] = [];
  for (const p of people) {
    if (p.isHidden || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export function assetPeopleForWheel(
  contextPersonId: string,
  people: ImmichPerson[] | undefined,
  contextFromCatalog: ImmichPerson | null,
): AssetFacesLayout {
  const visible = dedupeVisible(people ?? []);
  if (visible.length === 0) {
    if (contextFromCatalog) {
      return { mode: "sole", person: contextFromCatalog };
    }
    return { mode: "none" };
  }

  const contextInAsset = visible.find((p) => p.id === contextPersonId);
  const context = contextInAsset ?? contextFromCatalog ?? visible[0];
  const spokes = visible.filter((p) => p.id !== context.id);

  if (spokes.length === 0) {
    return { mode: "sole", person: context };
  }

  return { mode: "wheel", context, spokes };
}
