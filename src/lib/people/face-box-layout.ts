import type { ImmichAssetFace } from "@/lib/immich/types";

/**
 * Face box coordinate pipeline (Immich → screen):
 *
 * 1. **Image pixels** — `faceBoxPixels` / Immich `boundingBox*` in `face.imageWidth` × `face.imageHeight`.
 * 2. **Image percent** — `faceBoxOnImage(face, naturalW, naturalH)` maps to the raster you display
 *    (scales when face reference size ≠ loaded image natural size).
 * 3. **Layout pixels** — `percentBoxToDisplayRect(pct, layout)` within a `ContainedImageRect`
 *    (letterboxed image area, often `{0,0, layoutW, layoutH}` on an overlay).
 * 4. **CSS %** — `faceBoxPercentStyle(pct)` for children of that overlay.
 */

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

export type FaceBoxPixels = {
  imageWidth: number;
  imageHeight: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type DisplayRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const DISPLAY_RECT_EPS = 0.5;

export function displayRectNearlyEqual(a: DisplayRect, b: DisplayRect): boolean {
  return (
    Math.abs(a.x - b.x) < DISPLAY_RECT_EPS &&
    Math.abs(a.y - b.y) < DISPLAY_RECT_EPS &&
    Math.abs(a.width - b.width) < DISPLAY_RECT_EPS &&
    Math.abs(a.height - b.height) < DISPLAY_RECT_EPS
  );
}

const MIN_FACE_PX = 8;

function clampFacePixels(
  iw: number,
  ih: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): FaceBoxPixels {
  let a1 = Math.max(0, Math.min(x1, x2));
  let a2 = Math.min(iw, Math.max(x1, x2));
  let b1 = Math.max(0, Math.min(y1, y2));
  let b2 = Math.min(ih, Math.max(y1, y2));
  if (a2 - a1 < MIN_FACE_PX) {
    a2 = Math.min(iw, a1 + MIN_FACE_PX);
    a1 = Math.max(0, a2 - MIN_FACE_PX);
  }
  if (b2 - b1 < MIN_FACE_PX) {
    b2 = Math.min(ih, b1 + MIN_FACE_PX);
    b1 = Math.max(0, b2 - MIN_FACE_PX);
  }
  return {
    imageWidth: iw,
    imageHeight: ih,
    x1: Math.round(a1),
    y1: Math.round(b1),
    x2: Math.round(a2),
    y2: Math.round(b2),
  };
}

/**
 * Face box as % of a displayed image (natural pixel size of the `<img>` you overlay).
 * Prefer this over `faceBoxPercent` whenever the overlay matches that raster.
 */
export function faceBoxOnImage(
  face: ImmichAssetFace,
  imageNaturalWidth: number,
  imageNaturalHeight: number,
): FaceBoxPercent | null {
  if (!imageNaturalWidth || !imageNaturalHeight) {
    return faceBoxPercent(face);
  }
  if (
    face.imageWidth === imageNaturalWidth &&
    face.imageHeight === imageNaturalHeight
  ) {
    return faceBoxPercent(face);
  }
  return faceBoxPercentForReference(
    face,
    imageNaturalWidth,
    imageNaturalHeight,
  );
}

/** Map a face box into percentages of a reference image size (e.g. edit preview natural size). */
export function faceBoxPercentForReference(
  face: ImmichAssetFace,
  refWidth: number,
  refHeight: number,
): FaceBoxPercent | null {
  const src = faceBoxPixels(face);
  if (!src || !refWidth || !refHeight) return null;
  const scaleX = refWidth / src.imageWidth;
  const scaleY = refHeight / src.imageHeight;
  return faceBoxPixelsToPercent({
    imageWidth: refWidth,
    imageHeight: refHeight,
    x1: src.x1 * scaleX,
    y1: src.y1 * scaleY,
    x2: src.x2 * scaleX,
    y2: src.y2 * scaleY,
  });
}

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

export function faceBoxPixels(face: ImmichAssetFace): FaceBoxPixels | null {
  const iw = face.imageWidth;
  const ih = face.imageHeight;
  if (!iw || !ih) return null;
  return clampFacePixels(
    iw,
    ih,
    face.boundingBoxX1,
    face.boundingBoxY1,
    face.boundingBoxX2,
    face.boundingBoxY2,
  );
}

export function faceBoxPixelsToPercent(pixels: FaceBoxPixels): FaceBoxPercent {
  const { imageWidth: iw, imageHeight: ih, x1, y1, x2, y2 } = pixels;
  return {
    left: (x1 / iw) * 100,
    top: (y1 / ih) * 100,
    width: ((x2 - x1) / iw) * 100,
    height: ((y2 - y1) / ih) * 100,
  };
}

export function faceBoxPercentToPixels(
  box: FaceBoxPercent,
  imageWidth: number,
  imageHeight: number,
): FaceBoxPixels {
  const x1 = (box.left / 100) * imageWidth;
  const y1 = (box.top / 100) * imageHeight;
  const x2 = x1 + (box.width / 100) * imageWidth;
  const y2 = y1 + (box.height / 100) * imageHeight;
  return clampFacePixels(imageWidth, imageHeight, x1, y1, x2, y2);
}

export function faceBoxFromPixels(
  imageWidth: number,
  imageHeight: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): FaceBoxPixels {
  return clampFacePixels(imageWidth, imageHeight, x1, y1, x2, y2);
}

/** Immich `POST /api/faces` body from pixel box. */
export function manualFacePayload(
  pixels: FaceBoxPixels,
  assetId: string,
  personId: string,
) {
  const width = pixels.x2 - pixels.x1;
  const height = pixels.y2 - pixels.y1;
  return {
    assetId,
    personId,
    imageWidth: pixels.imageWidth,
    imageHeight: pixels.imageHeight,
    x: pixels.x1,
    y: pixels.y1,
    width,
    height,
  };
}

/** Overlay sized exactly to the letterboxed image: origin top-left, no extra offset. */
export function imageOverlayLayout(
  layoutWidth: number,
  layoutHeight: number,
): ContainedImageRect {
  return { x: 0, y: 0, width: layoutWidth, height: layoutHeight };
}

export function faceBoxPercentStyle(box: FaceBoxPercent): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  };
}

export function faceBoxDisplayRect(
  face: ImmichAssetFace,
  imageNaturalWidth: number,
  imageNaturalHeight: number,
  layout: ContainedImageRect,
): DisplayRect | null {
  const pct = faceBoxOnImage(face, imageNaturalWidth, imageNaturalHeight);
  if (!pct) return null;
  return percentBoxToDisplayRect(pct, layout);
}

export function percentBoxToDisplayRect(
  box: FaceBoxPercent,
  layout: ContainedImageRect,
): DisplayRect {
  return {
    x: layout.x + (box.left / 100) * layout.width,
    y: layout.y + (box.top / 100) * layout.height,
    width: (box.width / 100) * layout.width,
    height: (box.height / 100) * layout.height,
  };
}

export function displayRectToPercentBox(
  rect: DisplayRect,
  layout: ContainedImageRect,
): FaceBoxPercent {
  const left = ((rect.x - layout.x) / layout.width) * 100;
  const top = ((rect.y - layout.y) / layout.height) * 100;
  const width = (rect.width / layout.width) * 100;
  const height = (rect.height / layout.height) * 100;
  return {
    left: Math.max(0, Math.min(100, left)),
    top: Math.max(0, Math.min(100, top)),
    width: Math.max(0.01, Math.min(100 - left, width)),
    height: Math.max(0.01, Math.min(100 - top, height)),
  };
}

export function displayRectToFacePixels(
  rect: DisplayRect,
  layout: ContainedImageRect,
  imageWidth: number,
  imageHeight: number,
): FaceBoxPixels {
  const pct = displayRectToPercentBox(rect, layout);
  return faceBoxPercentToPixels(pct, imageWidth, imageHeight);
}
