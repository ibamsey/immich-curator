import {
  collectSameNamePeople,
  findPersonWithSimilarName,
} from "@/lib/people/person-name-search";
import type { ImmichPerson } from "@/lib/immich/types";
import { parsePeopleSearchResponse } from "@/lib/people/parse-people-search";

export type PersonMergeSuggestionRequest = {
  newName: string;
  editingPerson: ImmichPerson;
  primaryMatch: ImmichPerson;
  alternates: ImmichPerson[];
  /** Shown for the face being named when it has no person thumbnail. */
  editingImageUrl?: string;
};

export async function fetchMergeSuggestionIfNeeded(
  person: ImmichPerson,
  newName: string,
  cataloguePeople: ImmichPerson[],
): Promise<PersonMergeSuggestionRequest | null> {
  const trimmed = newName.trim();
  if (!trimmed) return null;
  if (trimmed === (person.name ?? "").trim()) return null;

  const res = await fetch(
    `/api/immich/people/search?name=${encodeURIComponent(trimmed)}&withHidden=true`,
  );
  const data: unknown = await res.json();
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: string }).message)
        : "Name check failed";
    throw new Error(message);
  }

  const searchPool = parsePeopleSearchResponse(data);
  const pool = [...searchPool, ...cataloguePeople];
  const primaryMatch = findPersonWithSimilarName(trimmed, person.id, pool);
  if (!primaryMatch) return null;

  const alternates = collectSameNamePeople(
    trimmed,
    [person.id, primaryMatch.id],
    pool,
    3,
  );

  return {
    newName: trimmed,
    editingPerson: person,
    primaryMatch,
    alternates,
  };
}
