import type { UnassignedFace } from "@/lib/people/unassigned-face";

/**
 * One row in the Linked faces RHS list:
 * - **linked**: assigned to this person in Immich (library-wide)
 * - **similar_unassigned**: unassigned face where Immich’s people list for that face
 *   (`GET /api/people?closestAssetId=<faceId>`) includes the selected person; **similarityRank**
 *   is the 1-based index in that list (lower = closer match)
 */
export type PersonFacePanelRow = {
  kind: "linked" | "similar_unassigned";
  face: UnassignedFace;
  /** 1-based position of the selected person in Immich’s similarity-ordered people list */
  similarityRank: number | null;
  otherPersonId: string | null;
  otherPersonName: string | null;
};
