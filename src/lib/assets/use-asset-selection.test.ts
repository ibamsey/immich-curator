import { describe, expect, it } from "vitest";
import { groupSelectionState } from "./use-asset-selection";

describe("groupSelectionState", () => {
  it("returns none when nothing selected", () => {
    expect(groupSelectionState(["a", "b"], new Set())).toBe("none");
  });

  it("returns all when every id selected", () => {
    expect(groupSelectionState(["a", "b"], new Set(["a", "b"]))).toBe("all");
  });

  it("returns some for partial selection", () => {
    expect(groupSelectionState(["a", "b", "c"], new Set(["b"]))).toBe("some");
  });

  it("returns none for empty group", () => {
    expect(groupSelectionState([], new Set(["a"]))).toBe("none");
  });
});
