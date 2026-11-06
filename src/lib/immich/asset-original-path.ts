/** Same-origin proxy for the asset’s original file (Immich `GET /api/assets/{id}/original`). */
export function assetOriginalPath(assetId: string): string {
  return `/api/immich/assets/${assetId}/original`;
}
