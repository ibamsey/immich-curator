import type { ImmichPerson } from "@/lib/immich/types";

export type PersonNameSortKey = {
  surname: string;
  given: string;
  full: string;
};

/** Parse a display name for surname-first ordering (supports "Surname, Given"). */
export function personNameSortKey(name: string): PersonNameSortKey {
  const full = name.trim();
  if (!full) {
    return { surname: "", given: "", full: "" };
  }
  const comma = full.indexOf(",");
  if (comma >= 0) {
    const surname = full.slice(0, comma).trim();
    const given = full.slice(comma + 1).trim();
    return { surname, given, full };
  }
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { surname: parts[0]!, given: "", full };
  }
  const surname = parts[parts.length - 1]!;
  const given = parts.slice(0, -1).join(" ");
  return { surname, given, full };
}

export function comparePersonDisplayNames(a: string, b: string): number {
  const ka = personNameSortKey(a);
  const kb = personNameSortKey(b);
  const s = ka.surname.localeCompare(kb.surname, undefined, {
    sensitivity: "base",
  });
  if (s !== 0) return s;
  const g = ka.given.localeCompare(kb.given, undefined, {
    sensitivity: "base",
  });
  if (g !== 0) return g;
  return ka.full.localeCompare(kb.full, undefined, { sensitivity: "base" });
}

export function sortPeopleBySurnameFirst<T extends { name?: string | null }>(
  people: readonly T[],
): T[] {
  return [...people].sort((a, b) =>
    comparePersonDisplayNames(a.name ?? "", b.name ?? ""),
  );
}

function catalogNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** One catalogue tile per distinct display name (after surname sort). */
export function uniquePeopleByDisplayName(
  people: readonly ImmichPerson[],
): ImmichPerson[] {
  const sorted = sortPeopleBySurnameFirst(people);
  const seen = new Set<string>();
  const out: ImmichPerson[] = [];
  for (const person of sorted) {
    const key = catalogNameKey(person.name ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(person);
  }
  return out;
}
