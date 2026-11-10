import type { ImmichPerson } from "@/lib/immich/types";

export function parsePeopleSearchResponse(data: unknown): ImmichPerson[] {
  if (Array.isArray(data)) return data as ImmichPerson[];
  if (data && typeof data === "object" && "people" in data) {
    const people = (data as { people?: unknown }).people;
    if (Array.isArray(people)) return people as ImmichPerson[];
  }
  return [];
}
