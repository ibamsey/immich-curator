import { describe, expect, it } from "vitest";
import {
  bucketPeople,
  peoplePageHref,
  peopleTabForSelection,
  personIsNamed,
} from "@/lib/people/bucket-people";

describe("bucketPeople", () => {
  it("splits named persons from empty names", () => {
    const { named, unnamed } = bucketPeople([
      { id: "a", name: "Ada" },
      { id: "b", name: "  " },
      { id: "c", name: "" },
      { id: "d", name: "Bea" },
    ]);
    expect(named.map((p) => p.id)).toEqual(["a", "d"]);
    expect(unnamed.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("treats a blank name as unnamed", () => {
    expect(personIsNamed({ name: "  " })).toBe(false);
    expect(personIsNamed({ name: "Ada" })).toBe(true);
  });
});

describe("peopleTabForSelection", () => {
  it("opens People for a named person and Faces for an unnamed one", () => {
    expect(peopleTabForSelection({ name: "Ada" }, "faces")).toBe("people");
    expect(peopleTabForSelection({ name: "" }, "people")).toBe("faces");
  });

  it("uses the requested tab when no person is selected", () => {
    expect(peopleTabForSelection(undefined, "faces")).toBe("faces");
    expect(peopleTabForSelection(undefined, undefined)).toBe("people");
  });

  it("keeps Duplicates when requested even if a named person is linked", () => {
    expect(peopleTabForSelection({ name: "Ada" }, "duplicates")).toBe(
      "duplicates",
    );
  });
});

describe("peoplePageHref", () => {
  it("omits the tab param on People and keeps a person id", () => {
    expect(peoplePageHref("people", "abc")).toBe("/people?personId=abc");
    expect(peoplePageHref("faces", null)).toBe("/people?tab=faces");
    expect(peoplePageHref("duplicates", null)).toBe("/people?tab=duplicates");
    expect(peoplePageHref("people", null)).toBe("/people");
  });
});
