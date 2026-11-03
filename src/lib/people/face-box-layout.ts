import type { ImmichAssetFace } from "@/lib/immich/types";

export type FaceBoxPercent = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ContainedImageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function faceBoxPercent(face: ImmichAssetFace): FaceBoxPercent | null {
  const iw = face.imageWidth;
  const ih = face.imageHeight;
  if (!iw || !ih) return null;

  const x1 = Math.max(0, Math.min(face.boundingBoxX1, face.boundingBoxX2));
  const x2 = Math.min(iw, Math.max(face.boundingBoxX1, face.boundingBoxX2));
  const y1 = Math.max(0, Math.min(face.boundingBoxY1, face.boundingBoxY2));
  const y2 = Math.min(ih, Math.max(face.boundingBoxY1, face.boundingBoxY2));
  if (x2 <= x1 || y2 <= y1) return null;

  return {
    left: (x1 / iw) * 100,
    top: (y1 / ih) * 100,
    width: ((x2 - x1) / iw) * 100,
    height: ((y2 - y1) / ih) * 100,
  };
}

export function containedImageRect(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): ContainedImageRect {
  if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }
  const scale = Math.min(
    containerWidth / naturalWidth,
    containerHeight / naturalHeight,
  );
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function faceDisplayLabel(face: ImmichAssetFace): string {
  const name = face.person?.name?.trim();
  if (name) return name;
  return "Unnamed";
}
