const WALL_CLOCK_PREFIX =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?/;

/**
 * Immich `localDateTime` stores the photographer's wall clock with UTC-labeled
 * components (see server metadata `keepLocalTime`). Do not shift by browser TZ.
 */
export function immichLocalDateTimeToDatetimeLocal(iso: string): string {
  const m = WALL_CLOCK_PREFIX.exec(iso.trim());
  if (!m) return "";
  return `${m[1]}T${m[2]}:${m[3]}`;
}

/** `datetime-local` → Immich `dateTimeOriginal` without browser timezone conversion. */
export function datetimeLocalToImmichDateTimeOriginal(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error(`Invalid datetime-local value: ${value}`);
  }
  return `${value}:00.000Z`;
}

export function sameImmichCaptureWallClock(a: string, b: string): boolean {
  const da = immichLocalDateTimeToDatetimeLocal(a);
  const db = immichLocalDateTimeToDatetimeLocal(b);
  if (!da || !db) return a.trim() === b.trim();
  return da === db;
}

export function captureDatetimeLocalMatches(
  localDateTime: string,
  datetimeLocal: string,
): boolean {
  return (
    immichLocalDateTimeToDatetimeLocal(localDateTime) === datetimeLocal
  );
}

/** Calendar date key for grouping (YYYY-MM-DD), preserving Immich wall-clock date. */
export function immichCaptureDateKey(iso: string | undefined | null): string {
  if (!iso) return "";
  const m = WALL_CLOCK_PREFIX.exec(iso.trim());
  if (m) return m[1]!;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}
