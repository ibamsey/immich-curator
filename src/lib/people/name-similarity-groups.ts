/**
 * Group named people for duplicate review by **name text only** (never birthDate).
 */

export type NameSimilarityGroup<T> = {
  /** Representative label (shortest name in the group, for display). */
  label: string;
  members: T[];
};

/** Lowercase, trim, collapse whitespace, strip common punctuation. */
export function normalizePersonNameForCompare(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,']/g, "");
}

/** Same tokens in any order (e.g. "John Smith" vs "Smith John"). */
export function normalizeSortedTokens(name: string): string {
  const parts = normalizePersonNameForCompare(name)
    .split(/\s+/)
    .filter(Boolean)
    .sort();
  return parts.join(" ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j += 1) row[j] = j;
  for (let i = 1; i <= m; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const tmp = row[j];
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + cost,
      );
      prev = tmp;
    }
  }
  return row[n]!;
}

/** Whether two display names should be considered a single similarity edge. */
export function namesSimilarForDuplicateReview(a: string, b: string): boolean {
  const na = normalizePersonNameForCompare(a);
  const nb = normalizePersonNameForCompare(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (normalizeSortedTokens(a) === normalizeSortedTokens(b)) return true;

  const lenMax = Math.max(na.length, nb.length);
  if (lenMax <= 32) {
    const dist = levenshtein(na, nb);
    if (lenMax <= 8 && dist <= 1) return true;
    if (lenMax > 8 && dist <= 2) return true;
  }
  return false;
}

type NamedPerson = { id: string; name?: string | null };

/**
 * Union–find on named people; only returns components with ≥2 members.
 * Similarity uses {@link namesSimilarForDuplicateReview} (exact / token-reorder / light edit distance).
 */
export function groupPeopleBySimilarNames<T extends NamedPerson>(
  people: readonly T[],
): NameSimilarityGroup<T>[] {
  const named = people.filter(
    (p) => Boolean(p.name?.trim()),
  ) as (T & { name: string })[];
  const n = named.length;
  if (n < 2) return [];

  const parent = Uint32Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    let p = parent[i]!;
    while (p !== parent[p]!) {
      parent[p] = parent[parent[p]!]!;
      p = parent[p]!;
    }
    return p;
  }

  function union(i: number, j: number) {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[rj] = ri;
  }

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (namesSimilarForDuplicateReview(named[i]!.name, named[j]!.name)) {
        union(i, j);
      }
    }
  }

  const buckets = new Map<number, T[]>();
  for (let i = 0; i < n; i += 1) {
    const r = find(i);
    let arr = buckets.get(r);
    if (!arr) {
      arr = [];
      buckets.set(r, arr);
    }
    arr.push(named[i]!);
  }

  const groups: NameSimilarityGroup<T>[] = [];
  for (const members of buckets.values()) {
    if (members.length < 2) continue;
    const label = [...members]
      .map((m) => m.name?.trim() ?? "")
      .sort((a, b) => a.length - b.length || a.localeCompare(b))[0]!;
    groups.push({ label, members });
  }

  groups.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
  return groups;
}
