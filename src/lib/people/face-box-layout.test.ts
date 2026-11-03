import { describe, expect, it } from "vitest";
import type { ImmichAssetFace } from "@/lib/immich/types";
import { faceBoxPercent } from "@/lib/people/face-box-layout";

describe("faceBoxPercent", () => {
  it("maps Immich box to percentages", () => {
    const face: ImmichAssetFace = {
      id: "f1",
      boundingBoxX1: 100,
      boundingBoxY1: 50,
      boundingBoxX2: 200,
      boundingBoxY2: 150,
      imageWidth: 1000,
      imageHeight: 500,
      person: null,
    };
    expect(faceBoxPercent(face)).toEqual({
      left: 10,
      top: 10,
      width: 10,
      height: 20,
    });
  });

  it("clamps negative coordinates", () => {
    const face: ImmichAssetFace = {
      id: "f2",
      boundingBoxX1: 228,
      boundingBoxY1: -12,
      boundingBoxX2: 332,
      boundingBoxY2: 130,
      imageWidth: 2591,
      imageHeight: 1440,
      person: null,
    };
    const box = faceBoxPercent(face);
    expect(box).not.toBeNull();
    expect(box!.top).toBe(0);
  });
});
