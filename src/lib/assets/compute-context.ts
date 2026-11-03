import type { ImageResolution } from "@/lib/assets/physical-size";

export const DEFAULT_SCAN_DPI = 600;

export type ComputeContext = {
  defaultScanDpi: number;
  /** Per-asset file EXIF resolution (detail view). */
  fileResolution?: ImageResolution | null;
};

export function defaultComputeContext(
  defaultScanDpi = DEFAULT_SCAN_DPI,
): ComputeContext {
  return { defaultScanDpi };
}
