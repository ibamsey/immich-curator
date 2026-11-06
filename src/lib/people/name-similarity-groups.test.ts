import { describe, expect, it } from "vitest";
import {
  groupPeopleBySimilarNames,
  namesSimilarForDuplicateReview,
} from "./name-similarity-groups";

describe("namesSimilarForDuplicateReview", () => {
  it("treats reorder of tokens as similar", () => {
    expect(namesSimilarForDuplicateReview("John Smith", "Smith John")).toBe(
      true,
    );
  });

  it("ignores case and light punctuation", () => {
    expect(namesSimilarForDuplicateReview("O'Brien", "O Brien")).toBe(true);
  });

  it("allows small edit distance for longer names", () => {
    expect(
      namesSimilarForDuplicateReview(
        "Christopher",
        "Christpher",
      ),
    ).toBe(true);
  });

  it("does not use birth dates (not in API — names only)", () => {
    expect(
      namesSimilarForDuplicateReview("Alex 1990", "Alex 2001"),
    ).toBe(false);
  });
});

describe("groupPeopleBySimilarNames", () => {
  it("returns only multi-member clusters", () => {
    const g = groupPeopleBySimilarNames([
      { id: "1", name: "Only One" },
      { id: "2", name: "Someone Else" },
    ]);
    expect(g).toEqual([]);
  });

  it("merges transitive chains", () => {
    const g = groupPeopleBySimilarNames([
      { id: "a", name: "Al" },
      { id: "b", name: "Ali" },
      { id: "c", name: "Alia" },
    ]);
    const flat = g.flatMap((x) => x.members.map((m) => m.id)).sort();
    expect(flat).toEqual(["a", "b", "c"]);
  });
});
