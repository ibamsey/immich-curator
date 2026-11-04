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

/** Scale an asset thumbnail so this face box fills a square tile. */
export function faceCropImageStyle(box: FaceBoxPercent): {
  position: "absolute";
  maxWidth: "none";
  width: string;
  height: string;
  left: string;
  top: string;
} {
  const width = Math.max(box.width, 0.01);
  const height = Math.max(box.height, 0.01);
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return {
    position: "absolute",
    maxWidth: "none",
    width: `${round((100 / width) * 100)}%`,
    height: `${round((100 / height) * 100)}%`,
    left: `${round(-(box.left / width) * 100)}%`,
    top: `${round(-(box.top / height) * 100)}%`,
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

/**
 * Map a face box from full-image percentages onto an `object-cover` tile.
 * `containerAspect` is container width / height (1 for the square explore grid).
 * Returns null when the face lies entirely in the cropped-away region.
 */
export function objectCoverFaceBox(
  box: FaceBoxPercent,
  imageWidth: number,
  imageHeight: number,
  containerAspect: number,
): FaceBoxPercent | null {
  if (!imageWidth || !imageHeight || !containerAspect) return null;

  const imageAspect = imageWidth / imageHeight;
  let left = box.left;
  let top = box.top;
  let width = box.width;
  let height = box.height;

  if (imageAspect > containerAspect) {
    const visible = containerAspect / imageAspect;
    const crop = (1 - visible) / 2;
    left = ((box.left / 100 - crop) / visible) * 100;
    width = (box.width / 100 / visible) * 100;
  } else if (imageAspect < containerAspect) {
    const visible = imageAspect / containerAspect;
    const crop = (1 - visible) / 2;
    top = ((box.top / 100 - crop) / visible) * 100;
    height = (box.height / 100 / visible) * 100;
  }

  const right = left + width;
  const bottom = top + height;
  const clippedLeft = Math.max(0, left);
  const clippedTop = Math.max(0, top);
  const clippedRight = Math.min(100, right);
  const clippedBottom = Math.min(100, bottom);
  if (clippedRight - clippedLeft < 0.5 || clippedBottom - clippedTop < 0.5) {
    return null;
  }

  const round = (value: number) => Math.round(value * 1000) / 1000;
  return {
    left: round(clippedLeft),
    top: round(clippedTop),
    width: round(clippedRight - clippedLeft),
    height: round(clippedBottom - clippedTop),
  };
}

export function faceDisplayLabel(face: ImmichAssetFace): string {
  const name = face.person?.name?.trim();
  if (name) return name;
  return "Unnamed";
}
