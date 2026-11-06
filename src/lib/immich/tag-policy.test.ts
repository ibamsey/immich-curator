import { describe, expect, it } from "vitest";
import { isProvenanceTag, tagPath } from "@/lib/immich/tag-policy";

describe("isProvenanceTag", () => {
  it("locks import and immich-go paths", () => {
    expect(isProvenanceTag("import/scanner")).toBe(true);
    expect(isProvenanceTag("import/scanner/batch")).toBe(true);
    expect(isProvenanceTag("import/cd-rom/jan08")).toBe(true);
    expect(isProvenanceTag("{immich-go}/2026-11-04 20:54:14")).toBe(true);
  });

  it("leaves catalog tags editable", () => {
    expect(isProvenanceTag("Leusdon")).toBe(false);
    expect(isProvenanceTag("Sally's Wedding")).toBe(false);
    expect(isProvenanceTag("place/Leusdon")).toBe(false);
    expect(isProvenanceTag("import")).toBe(false);
  });
});

describe("tagPath", () => {
  it("prefers value over the leaf name", () => {
    expect(tagPath({ name: "batch", value: "import/scanner/batch" })).toBe(
      "import/scanner/batch",
    );
    expect(tagPath({ name: "Leusdon" })).toBe("Leusdon");
  });
});
