export type PeopleTab = "people" | "faces";

export function personIsNamed(person: { name?: string | null }): boolean {
  return Boolean(person.name?.trim());
}

export function bucketPeople<T extends { name?: string | null }>(
  people: readonly T[],
): { named: T[]; unnamed: T[] } {
  const named: T[] = [];
  const unnamed: T[] = [];
  for (const person of people) {
    if (personIsNamed(person)) named.push(person);
    else unnamed.push(person);
  }
  return { named, unnamed };
}

/** `personId` wins. Otherwise an explicit Faces tab request opens Faces. */
export function peopleTabForSelection(
  person: { name?: string | null } | undefined,
  requestedTab: string | undefined,
): PeopleTab {
  if (person) return personIsNamed(person) ? "people" : "faces";
  return requestedTab === "faces" ? "faces" : "people";
}

export function peoplePageHref(tab: PeopleTab, personId: string | null): string {
  const params = new URLSearchParams();
  if (tab === "faces") params.set("tab", "faces");
  if (personId) params.set("personId", personId);
  const query = params.toString();
  return query ? `/people?${query}` : "/people";
}
