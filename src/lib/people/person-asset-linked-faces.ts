import type { UnassignedFace } from "@/lib/people/unassigned-face";

export type PersonAssetLinkedFaceHint = {
  count: number;
  /** When present (legacy face scan), used for face-crop thumbs. */
  sampleFace?: UnassignedFace;
};
