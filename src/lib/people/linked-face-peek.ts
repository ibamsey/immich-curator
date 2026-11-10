import type { UnassignedFace } from "@/lib/people/unassigned-face";

export type LinkedFacePeek = {
  assetId: string;
  faceId: string;
  /** RHS row face (bbox); used if asset face batch cache omits this id. */
  face: UnassignedFace;
  rowKind: "linked" | "similar_unassigned";
};
