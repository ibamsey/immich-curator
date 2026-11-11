import { describe, expect, it } from "vitest";
import type { ImmichAssetFace } from "@/lib/immich/types";
import { faceBoxIouFaces } from "@/lib/people/face-box-layout";
import {
  listOverlappingFaceIds,
  pickFaceMatchingBox,
} from "@/lib/people/face-overlap";

const face = (
  id: string,
  box: [number, number, number, number],
  personId?: string,
): ImmichAssetFace => ({
  id,
  boundingBoxX1: box[0],
  boundingBoxY1: box[1],
  boundingBoxX2: box[2],
  boundingBoxY2: box[3],
  imageWidth: 1000,
  imageHeight: 1000,
  person: personId
    ? {
        id: personId,
        name: "Test",
        birthDate: null,
        thumbnailPath: "",
        isHidden: false,
      }
    : null,
});

describe("faceBoxIouFaces", () => {
  it("returns high iou for overlapping boxes", () => {
    const a = face("a", [100, 100, 200, 200]);
    const b = face("b", [110, 110, 210, 210]);
    expect(faceBoxIouFaces(a, b)).toBeGreaterThan(0.6);
  });
});

describe("listOverlappingFaceIds", () => {
  it("lists other faces that overlap the keeper", () => {
    const keep = face("keep", [100, 100, 300, 300], "p1");
    const overlap = face("dup", [120, 120, 280, 280]);
    const far = face("far", [500, 500, 600, 600]);
    const ids = listOverlappingFaceIds([keep, overlap, far], keep.id);
    expect(ids).toEqual(["dup"]);
  });
});

describe("pickFaceMatchingBox", () => {
  it("prefers a linked face near the target box", () => {
    const linked = face("linked", [100, 100, 200, 200], "p1");
    const stray = face("stray", [500, 500, 600, 600]);
    const picked = pickFaceMatchingBox(
      [linked, stray],
      {
        imageWidth: 1000,
        imageHeight: 1000,
        x1: 105,
        y1: 105,
        x2: 195,
        y2: 195,
      },
      "p1",
    );
    expect(picked?.id).toBe("linked");
  });
});
