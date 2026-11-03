export function assetThumbnailPath(assetId: string, size = "preview"): string {
  return `/api/immich/assets/${assetId}/thumbnail?size=${size}`;
}
