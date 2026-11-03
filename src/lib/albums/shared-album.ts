export function albumSharedWithOperator(
  album: { albumUsers?: { user: { id: string } }[] },
  operatorUserId: string | null,
): boolean {
  if (!operatorUserId) return false;
  return Boolean(
    album.albumUsers?.some((u) => u.user.id === operatorUserId),
  );
}
