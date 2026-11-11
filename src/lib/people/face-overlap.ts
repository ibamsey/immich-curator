import {
  faceBoxFromPixels,
  faceBoxIouFaces,
  faceBoxPixels,
  type FaceBoxPixels,
} from "@/lib/people/face-box-layout";
import type { ImmichAssetFace } from "@/lib/immich/types";

const DEFAULT_IOU_THRESHOLD = 0.45;

const syntheticFace = (
  pixels: FaceBoxPixels,
): ImmichAssetFace => ({
  id: "target",
  boundingBoxX1: pixels.x1,
  boundingBoxY1: pixels.y1,
  boundingBoxX2: pixels.x2,
  boundingBoxY2: pixels.y2,
  imageWidth: pixels.imageWidth,
  imageHeight: pixels.imageHeight,
  person: null,
});

/** Pick the face on this asset that best matches the box we intended to create/edit. */
export function pickFaceMatchingBox(
  faces: ImmichAssetFace[],
  pixels: FaceBoxPixels,
  personId?: string | null,
): ImmichAssetFace | null {
  if (faces.length === 0) return null;
  const target = faceBoxFromPixels(
    pixels.imageWidth,
    pixels.imageHeight,
    pixels.x1,
    pixels.y1,
    pixels.x2,
    pixels.y2,
  );
  const targetFace = syntheticFace(target);

  let best: { face: ImmichAssetFace; score: number } | null = null;
  for (const face of faces) {
    if (!faceBoxPixels(face)) continue;
    const iou = faceBoxIouFaces(face, targetFace);
    let score = iou;
    if (personId && face.person?.id === personId) score += 0.5;
    if (!best || score > best.score) best = { face, score };
  }
  return best?.face ?? null;
}

/** Face ids that overlap the keeper strongly — redundant auto-detections or duplicate manual edits. */
export function listOverlappingFaceIds(
  faces: ImmichAssetFace[],
  keepFaceId: string,
  threshold = DEFAULT_IOU_THRESHOLD,
): string[] {
  const keep = faces.find((f) => f.id === keepFaceId);
  if (!keep) return [];
  return faces
    .filter((f) => {
      if (f.id === keepFaceId) return false;
      return faceBoxIouFaces(f, keep) >= threshold;
    })
    .map((f) => f.id);
}
