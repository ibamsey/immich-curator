import { describe, expect, it } from "vitest";
import type { ImmichAssetFace } from "@/lib/immich/types";
import {
  computeBrowsePeekTransform,
  targetFaceHeightPx,
  TARGET_FACE_HEIGHT_FRACTION,
} from "@/lib/people/browse-peek-framing";

const face: ImmichAssetFace = {
  id: "f1",
  boundingBoxX1: 400,
  boundingBoxY1: 200,
  boundingBoxX2: 600,
  boundingBoxY2: 400,
  imageWidth: 1000,
  imageHeight: 1000,
  person: null,
};

describe("targetFaceHeightPx", () => {
  it("uses fraction of viewport height within clamps", () => {
    expect(targetFaceHeightPx(500)).toBeCloseTo(500 * TARGET_FACE_HEIGHT_FRACTION);
    expect(targetFaceHeightPx(100)).toBe(80);
    expect(targetFaceHeightPx(2000)).toBe(220);
  });
});

describe("computeBrowsePeekTransform", () => {
  it("centers face and scales to target face height at multiplier 1", () => {
    const containerW = 800;
    const containerH = 600;
    const naturalW = 1000;
    const naturalH = 1000;
    const viewportH = 500;

    const result = computeBrowsePeekTransform({
      containerW,
      containerH,
      naturalW,
      naturalH,
      viewportH,
      face,
      zoomMultiplier: 1,
    });

    const targetH = targetFaceHeightPx(viewportH);
    const imageH = 600;
    const faceHeightBase = 0.2 * imageH;
    expect(result.baseScale).toBeCloseTo(targetH / faceHeightBase);
    expect(result.scale).toBeCloseTo(result.baseScale);

    expect(result.tx).not.toBe(0);
    expect(result.ty).not.toBe(0);
  });

  it("applies zoom multiplier to scale", () => {
    const base = computeBrowsePeekTransform({
      containerW: 800,
      containerH: 600,
      naturalW: 1000,
      naturalH: 1000,
      viewportH: 500,
      face,
      zoomMultiplier: 1,
    });
    const zoomed = computeBrowsePeekTransform({
      containerW: 800,
      containerH: 600,
      naturalW: 1000,
      naturalH: 1000,
      viewportH: 500,
      face,
      zoomMultiplier: 2,
    });
    expect(zoomed.scale).toBeCloseTo(
      Math.min(48, Math.max(0.25, base.baseScale * 2)),
    );
    expect(zoomed.tx).toBeCloseTo(base.tx * 2, 0);
    expect(zoomed.ty).toBeCloseTo(base.ty * 2, 0);
  });

  it("returns identity when face is missing", () => {
    expect(
      computeBrowsePeekTransform({
        containerW: 800,
        containerH: 600,
        naturalW: 1000,
        naturalH: 1000,
        viewportH: 500,
        face: null,
        zoomMultiplier: 1,
      }),
    ).toEqual({ scale: 1, tx: 0, ty: 0, baseScale: 1 });
  });
});
