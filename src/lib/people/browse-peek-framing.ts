import type { ImmichAssetFace } from "@/lib/immich/types";
import {
  containedImageRect,
  faceBoxOnImage,
} from "@/lib/people/face-box-layout";

/** Desired face box height as a fraction of the peek viewport height. */
export const TARGET_FACE_HEIGHT_FRACTION = 0.32;

export const TARGET_FACE_HEIGHT_MIN_PX = 80;
export const TARGET_FACE_HEIGHT_MAX_PX = 220;

export const BROWSE_PEEK_MIN_SCALE = 0.25;
export const BROWSE_PEEK_MAX_SCALE = 48;

export type BrowsePeekTransform = {
  scale: number;
  tx: number;
  ty: number;
  /** Scale to fit face at standard size before user zoom multiplier. */
  baseScale: number;
};

export type ComputeBrowsePeekTransformInput = {
  containerW: number;
  containerH: number;
  naturalW: number;
  naturalH: number;
  viewportH: number;
  face: ImmichAssetFace | null;
  zoomMultiplier: number;
  minScale?: number;
  maxScale?: number;
};

export function targetFaceHeightPx(viewportH: number): number {
  if (!viewportH || viewportH <= 0) return TARGET_FACE_HEIGHT_MIN_PX;
  const raw = viewportH * TARGET_FACE_HEIGHT_FRACTION;
  return Math.min(
    TARGET_FACE_HEIGHT_MAX_PX,
    Math.max(TARGET_FACE_HEIGHT_MIN_PX, raw),
  );
}

/**
 * Pan/zoom so the highlighted face is centered in the viewport at a consistent on-screen size.
 * Assumes the image wrapper is flex-centered in the viewport with default transform-origin center.
 */
export function computeBrowsePeekTransform(
  input: ComputeBrowsePeekTransformInput,
): BrowsePeekTransform {
  const {
    containerW,
    containerH,
    naturalW,
    naturalH,
    viewportH,
    face,
    zoomMultiplier,
    minScale = BROWSE_PEEK_MIN_SCALE,
    maxScale = BROWSE_PEEK_MAX_SCALE,
  } = input;

  const fallback: BrowsePeekTransform = {
    scale: 1,
    tx: 0,
    ty: 0,
    baseScale: 1,
  };

  if (
    !face ||
    !containerW ||
    !containerH ||
    !naturalW ||
    !naturalH
  ) {
    return fallback;
  }

  const box = faceBoxOnImage(face, naturalW, naturalH);
  if (!box || box.height <= 0) {
    return fallback;
  }

  const imageRect = containedImageRect(
    containerW,
    containerH,
    naturalW,
    naturalH,
  );
  if (!imageRect.width || !imageRect.height) {
    return fallback;
  }

  const faceHeightBase = (box.height / 100) * imageRect.height;
  if (faceHeightBase <= 0) {
    return fallback;
  }

  const targetH = targetFaceHeightPx(viewportH);
  const baseScale = targetH / faceHeightBase;
  const scale = Math.min(
    maxScale,
    Math.max(minScale, baseScale * Math.max(0.01, zoomMultiplier)),
  );

  const faceCx =
    imageRect.x + ((box.left + box.width / 2) / 100) * imageRect.width;
  const faceCy =
    imageRect.y + ((box.top + box.height / 2) / 100) * imageRect.height;
  const centerX = containerW / 2;
  const centerY = containerH / 2;
  const vx = faceCx - centerX;
  const vy = faceCy - centerY;

  return {
    scale,
    tx: -vx * scale,
    ty: -vy * scale,
    baseScale,
  };
}
