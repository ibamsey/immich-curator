import { describe, expect, it } from "vitest";
import { hitHandle } from "@/components/people/display-rect-editor";

describe("hitHandle", () => {
  const rect = { x: 100, y: 80, width: 120, height: 100 };

  it("detects move in the interior", () => {
    expect(hitHandle(160, 130, rect)).toBe("move");
  });

  it("detects east edge resize", () => {
    expect(hitHandle(rect.x + rect.width, 130, rect)).toBe("e");
  });

  it("detects south-east corner", () => {
    expect(hitHandle(rect.x + rect.width, rect.y + rect.height, rect)).toBe(
      "se",
    );
  });

  it("returns null outside the box slop region", () => {
    expect(hitHandle(10, 10, rect)).toBeNull();
  });
});
