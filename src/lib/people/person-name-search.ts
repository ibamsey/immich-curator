import type { ImmichPerson } from "@/lib/immich/types";

/** Case-insensitive name key (Immich web `normalizeSearchString` behaviour). */
export function normalizeSearchString(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = temp;
    }
  }
  return row[b.length];
}

/** Exact (Immich) or single-edit near match on normalized full names. */
export function namesMatchForMergeSuggestion(a: string, b: string): boolean {
  const na = normalizeSearchString(a);
  const nb = normalizeSearchString(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const minLen = Math.min(na.length, nb.length);
  if (minLen < 5) return false;
  return levenshtein(na, nb) <= 1;
}

export function findPersonWithSimilarName(
  name: string,
  excludePersonId: string,
  candidates: ImmichPerson[],
): ImmichPerson | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  const exact = candidates.find(
    (p) =>
      p.id !== excludePersonId &&
      Boolean(p.name?.trim()) &&
      normalizeSearchString(p.name) === normalizeSearchString(trimmed),
  );
  if (exact) return exact;

  return candidates.find(
    (p) =>
      p.id !== excludePersonId &&
      Boolean(p.name?.trim()) &&
      namesMatchForMergeSuggestion(trimmed, p.name),
  );
}

export function collectSameNamePeople(
  name: string,
  excludeIds: readonly string[],
  pools: readonly ImmichPerson[],
  limit = 3,
): ImmichPerson[] {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const excluded = new Set(excludeIds);
  const seen = new Set<string>();
  const out: ImmichPerson[] = [];
  for (const p of pools) {
    if (excluded.has(p.id) || seen.has(p.id)) continue;
    if (!p.name?.trim()) continue;
    if (!namesMatchForMergeSuggestion(trimmed, p.name)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
