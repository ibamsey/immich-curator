import { describe, expect, it } from "vitest";
import type { ImmichAssetFace } from "@/lib/immich/types";
import {
  faceBoxPercent,
  faceCropImageStyle,
  objectCoverFaceBox,
} from "@/lib/people/face-box-layout";

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

describe("faceCropImageStyle", () => {
  it("scales the thumbnail so the face box fills the tile", () => {
    expect(
      faceCropImageStyle({ left: 10, top: 10, width: 10, height: 20 }),
    ).toEqual({
      position: "absolute",
      maxWidth: "none",
      width: "1000%",
      height: "500%",
      left: "-100%",
      top: "-50%",
    });
  });
});

describe("objectCoverFaceBox", () => {
  it("leaves a square image unchanged in a square tile", () => {
    const box = { left: 10, top: 20, width: 30, height: 40 };
    expect(objectCoverFaceBox(box, 1000, 1000, 1)).toEqual(box);
  });

  it("shifts a centered face inward when a wide photo is cover-cropped", () => {
    const box = { left: 40, top: 10, width: 20, height: 30 };
    expect(objectCoverFaceBox(box, 2000, 1000, 1)).toEqual({
      left: 30,
      top: 10,
      width: 40,
      height: 30,
    });
  });

  it("drops a face that sits entirely in the cropped side margin", () => {
    const box = { left: 2, top: 40, width: 8, height: 20 };
    expect(objectCoverFaceBox(box, 2000, 1000, 1)).toBeNull();
  });

  it("crops a tall photo from the top and bottom", () => {
    const box = { left: 10, top: 40, width: 20, height: 20 };
    expect(objectCoverFaceBox(box, 1000, 2000, 1)).toEqual({
      left: 10,
      top: 30,
      width: 20,
      height: 40,
    });
  });
});
