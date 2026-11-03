/** Trim, collapse whitespace, title-case each name part (words and segments after - or '). */
export function normalizePersonName(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  if (!collapsed) return "";

  return collapsed
    .split(" ")
    .map((word) => titleCaseWord(word))
    .join(" ");
}

function titleCaseWord(word: string): string {
  return word
    .split(/([-'])/)
    .map((segment) => {
      if (segment === "-" || segment === "'") return segment;
      if (!segment) return segment;
      return (
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
      );
    })
    .join("");
}
