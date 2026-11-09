import { describe, expect, it } from "vitest";
import { aggregatePeopleFromAssets } from "@/lib/immich/shared-people-index-aggregate";

describe("aggregatePeopleFromAssets", () => {
  it("counts assets per person and records people on each asset", () => {
    const { assetCountByPerson, peopleByAsset, peopleInScope } =
      aggregatePeopleFromAssets([
        {
          id: "a1",
          people: [
            { id: "p1", name: "Ada", birthDate: null, thumbnailPath: "", isHidden: false },
            { id: "p2", name: "Bob", birthDate: null, thumbnailPath: "", isHidden: false },
          ],
        },
        {
          id: "a2",
          people: [
            { id: "p1", name: "Ada", birthDate: null, thumbnailPath: "", isHidden: false },
          ],
        },
        { id: "a3", people: [] },
      ]);

    expect(peopleInScope).toEqual(new Set(["p1", "p2"]));
    expect(assetCountByPerson).toEqual({ p1: 2, p2: 1 });
    expect(peopleByAsset.a1).toEqual([
      { personId: "p1", name: "Ada" },
      { personId: "p2", name: "Bob" },
    ]);
    expect(peopleByAsset.a3).toEqual([]);
  });
});
