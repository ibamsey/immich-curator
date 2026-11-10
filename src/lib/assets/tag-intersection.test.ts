import { describe, expect, it } from "vitest";
import { partitionCommonTags, tagsInCommon } from "./tag-intersection";
import type { ImmichTag } from "@/lib/immich/types";

function tag(id: string, value: string, name = value.split("/").pop()!): ImmichTag {
  return { id, name, value };
}

describe("tagsInCommon", () => {
  it("returns intersection by id", () => {
    const t1 = tag("1", "place/Leusdon");
    const t2 = tag("2", "event/Wedding");
    const assets = [
      { tags: [t1, t2] },
      { tags: [t1] },
      { tags: [t1, t2] },
    ];
    expect(tagsInCommon(assets).map((t) => t.id)).toEqual(["1"]);
  });

  it("returns empty when no overlap", () => {
    const assets = [{ tags: [tag("1", "a")] }, { tags: [tag("2", "b")] }];
    expect(tagsInCommon(assets)).toEqual([]);
  });
});

describe("partitionCommonTags", () => {
  it("splits provenance from catalog", () => {
    const catalog = tag("c", "archive/file/batch4");
    const prov = tag("p", "import/scanner/foo");
    const { catalog: cat, provenanceLocked } = partitionCommonTags([
      catalog,
      prov,
    ]);
    expect(cat).toEqual([catalog]);
    expect(provenanceLocked).toEqual([prov]);
  });
});
