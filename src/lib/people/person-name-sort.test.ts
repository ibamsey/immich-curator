import { describe, expect, it } from "vitest";
import {
  comparePersonDisplayNames,
  personNameSortKey,
  sortPeopleBySurnameFirst,
  uniquePeopleByDisplayName,
} from "./person-name-sort";
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

describe("personNameSortKey", () => {
  it("parses comma form as surname first", () => {
    expect(personNameSortKey("Smith, John")).toEqual({
      surname: "Smith",
      given: "John",
      full: "Smith, John",
    });
  });

  it("treats last token as surname in western order", () => {
    expect(personNameSortKey("John Quincy Smith")).toEqual({
      surname: "Smith",
      given: "John Quincy",
      full: "John Quincy Smith",
    });
  });
});

describe("sortPeopleBySurnameFirst", () => {
  it("orders by surname then given", () => {
    const sorted = sortPeopleBySurnameFirst([
      person("1", "Zoe Adams"),
      person("2", "Bob Smith"),
      person("3", "Alice Adams"),
    ]).map((p) => p.name);
    expect(sorted).toEqual(["Alice Adams", "Zoe Adams", "Bob Smith"]);
  });
});

describe("uniquePeopleByDisplayName", () => {
  it("keeps first person per name after surname sort", () => {
    const unique = uniquePeopleByDisplayName([
      person("b", "Smith, Bob"),
      person("a", "Smith, Alice"),
      person("c", "Smith, Bob"),
    ]);
    expect(unique.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("comparePersonDisplayNames", () => {
  it("sorts comma and western forms consistently by family name", () => {
    expect(
      comparePersonDisplayNames("Smith, Ann", "Taylor, Ben"),
    ).toBeLessThan(0);
    expect(comparePersonDisplayNames("Ann Smith", "Bob Taylor")).toBeLessThan(0);
  });
});
