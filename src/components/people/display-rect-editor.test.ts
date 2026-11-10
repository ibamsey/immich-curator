import { describe, expect, it } from "vitest";
import {
  clientPointToLayoutLocal,
  hitHandle,
} from "@/components/people/display-rect-editor";

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

describe("clientPointToLayoutLocal", () => {
  it("maps through CSS scale on the painted box", () => {
    const bounds = {
      left: 50,
      top: 40,
      width: 400,
      height: 300,
    } as DOMRect;
    const local = clientPointToLayoutLocal(250, 190, bounds, 200, 150);
    expect(local).toEqual({ lx: 100, ly: 75 });
  });
});
