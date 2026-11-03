/** Immich API uses yyyy-MM-dd; UI uses dd/mm/yyyy. */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function isoDateToDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = ISO_DATE.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

export function displayDateToIso(display: string): string | null | "invalid" {
  const trimmed = display.trim();
  if (!trimmed) return null;
  const m = DISPLAY_DATE.exec(trimmed);
  if (!m) return "invalid";
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 9999) {
    return "invalid";
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return "invalid";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function isoDateForPicker(iso: string | null | undefined): string {
  if (!iso || !ISO_DATE.test(iso)) return "";
  return iso;
}
