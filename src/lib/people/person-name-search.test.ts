import { describe, expect, it } from "vitest";
import {
  findPersonWithSimilarName,
  normalizeSearchString,
} from "@/lib/people/person-name-search";
import type { ImmichPerson } from "@/lib/immich/types";

function person(id: string, name: string): ImmichPerson {
  return {
    id,
    name,
    birthDate: null,
    thumbnailPath: "",
    isHidden: false,
  };
}

describe("normalizeSearchString", () => {
  it("treats case and spacing as equivalent", () => {
    expect(normalizeSearchString("  Alex  ")).toBe("alex");
    expect(normalizeSearchString("alex")).toBe(normalizeSearchString("ALEX"));
  });
});

describe("findPersonWithSimilarName", () => {
  it("finds a person with the same normalized name", () => {
    const candidates = [person("a", "Bob"), person("b", "alice")];
    const match = findPersonWithSimilarName("bob", "c", candidates);
    expect(match?.id).toBe("a");
  });

  it("excludes self", () => {
    const candidates = [person("a", "Bob")];
    expect(findPersonWithSimilarName("Bob", "a", candidates)).toBeUndefined();
  });

  it("matches near-spelling names from search results", () => {
    const candidates = [
      person("a", "Lillian Bamsey"),
      person("b", "Unnamed"),
    ];
    const match = findPersonWithSimilarName("Lilian Bamsey", "b", candidates);
    expect(match?.id).toBe("a");
  });
});
