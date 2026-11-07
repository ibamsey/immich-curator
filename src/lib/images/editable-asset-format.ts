/** Raster formats we can decode in-browser and upload back via Immich. */

const EDITABLE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function normalizeMime(mime: string | null | undefined): string {
  if (!mime) return "";
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  return base;
}

function mimeFromFileName(fileName: string | undefined | null): string | null {
  if (!fileName) return null;
  const lower = fileName.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = lower.slice(dot);
  return EXT_TO_MIME[ext] ?? null;
}

/**
 * Whether this asset can use the in-modal editor.
 * @param assetType Immich `type` (e.g. IMAGE, VIDEO)
 * @param contentType MIME from HEAD/GET original response
 * @param originalFileName fallback for octet-stream etc.
 */
export function isEditableRasterImage(
  assetType: string | undefined | null,
  contentType: string | null | undefined,
  originalFileName: string | undefined | null,
): boolean {
  if (assetType && assetType !== "IMAGE") return false;

  const mime = normalizeMime(contentType);
  if (mime && EDITABLE_MIME.has(mime)) return true;

  const fromName = mimeFromFileName(originalFileName);
  if (fromName && EDITABLE_MIME.has(fromName)) return true;

  return false;
}

export { EDITABLE_MIME };
