import { describe, expect, it } from "vitest";
import { groupGridAssets, sortGridAssets } from "./apply-grid-query";
import type { GridAsset } from "./grid-asset";

function asset(id: string, localDateTime: string): GridAsset {
  return {
    id,
    localDateTime,
    fileCreatedAt: localDateTime,
    updatedAt: localDateTime,
    originalFileName: `${id}.jpg`,
    type: "IMAGE",
    isFavorite: false,
    tags: [],
    people: [],
  };
}

describe("groupGridAssets captureDate", () => {
  it("groups by calendar day with newest day first when sort desc", () => {
    const assets = [
      asset("a", "2024-01-01T10:00:00.000Z"),
      asset("b", "2024-01-02T09:00:00.000Z"),
      asset("c", "2024-01-02T18:00:00.000Z"),
    ];
    const groups = groupGridAssets(
      assets,
      "captureDate",
      "localDateTime",
      "desc",
    );
    expect(groups.map((g) => g.key)).toEqual(["2024-01-02", "2024-01-01"]);
    expect(groups[0]!.assets.map((a) => a.id)).toEqual(["c", "b"]);
    expect(groups[1]!.assets.map((a) => a.id)).toEqual(["a"]);
  });

  it("sorts assets within a day by captured time when sort desc", () => {
    const list = sortGridAssets(
      [
        asset("early", "2024-03-01T08:00:00.000Z"),
        asset("late", "2024-03-01T20:00:00.000Z"),
      ],
      "localDateTime",
      "desc",
    );
    expect(list.map((a) => a.id)).toEqual(["late", "early"]);
  });
});
