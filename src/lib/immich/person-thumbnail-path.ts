export function personThumbnailPath(personId: string): string {
  return `/api/immich/people/${encodeURIComponent(personId)}/thumbnail`;
}
