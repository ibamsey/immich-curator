import type { GridAsset } from "@/lib/assets/grid-asset";

/** EXIF ResolutionUnit: 2 = inches, 3 = centimetres. */
export type ResolutionUnit = 2 | 3;

export type ImageResolution = {
  dpiX: number;
  dpiY: number;
  source: "exif" | "default";
};

export type PhysicalSizeMm = {
  widthMm: number;
  heightMm: number;
  areaMm2: number;
  resolution: ImageResolution;
};

const ORIENTATION_SWAP = new Set(["5", "6", "7", "8"]);

export function getPixelDimensions(asset: GridAsset): {
  widthPx: number;
  heightPx: number;
} | null {
  const exif = asset.exifInfo;
  let w =
    asset.width ??
    exif?.exifImageWidth ??
    exif?.imageWidth;
  let h =
    asset.height ??
    exif?.exifImageHeight ??
    exif?.imageHeight;
  if (w == null || h == null || w <= 0 || h <= 0) return null;

  const orientation = asset.exifInfo?.orientation;
  if (orientation && ORIENTATION_SWAP.has(String(orientation))) {
    [w, h] = [h, w];
  }
  return { widthPx: w, heightPx: h };
}

export function parseExifResolution(
  xRes: number | undefined,
  yRes: number | undefined,
  unit: number | undefined,
): { dpiX: number; dpiY: number } | null {
  if (xRes == null || xRes <= 0) return null;
  const y = yRes != null && yRes > 0 ? yRes : xRes;
  const u = unit ?? 2;
  if (u === 2) {
    return { dpiX: xRes, dpiY: y };
  }
  if (u === 3) {
    return { dpiX: xRes * 2.54, dpiY: y * 2.54 };
  }
  return null;
}

export function pixelsToMm(pixels: number, dpi: number): number {
  return (pixels / dpi) * 25.4;
}

export function effectiveResolution(
  fileResolution: ImageResolution | null | undefined,
  defaultScanDpi: number,
): ImageResolution {
  if (
    fileResolution &&
    fileResolution.dpiX > 0 &&
    fileResolution.dpiY > 0
  ) {
    return fileResolution;
  }
  const d = defaultScanDpi > 0 ? defaultScanDpi : 600;
  return { dpiX: d, dpiY: d, source: "default" };
}

export function computePhysicalSizeMm(
  asset: GridAsset,
  defaultScanDpi: number,
  fileResolution?: ImageResolution | null,
): PhysicalSizeMm | null {
  const pixels = getPixelDimensions(asset);
  if (!pixels) return null;

  const resolution = effectiveResolution(
    fileResolution?.source === "exif" ? fileResolution : null,
    defaultScanDpi,
  );

  const widthMm = pixelsToMm(pixels.widthPx, resolution.dpiX);
  const heightMm = pixelsToMm(pixels.heightPx, resolution.dpiY);
  return {
    widthMm,
    heightMm,
    areaMm2: widthMm * heightMm,
    resolution,
  };
}

export function formatMm(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function formatPhysicalSizeLabel(size: PhysicalSizeMm): string {
  return `${formatMm(size.widthMm)} × ${formatMm(size.heightMm)} mm`;
}

export function formatAreaMm2(area: number): string {
  if (area >= 1_000_000) {
    return `${(area / 1_000_000).toFixed(2)} m²`;
  }
  return `${Math.round(area).toLocaleString()} mm²`;
}
