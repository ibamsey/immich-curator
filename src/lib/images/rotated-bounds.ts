/** Width/height of the axis-aligned bounding box after rotating a `w × h` rectangle by `deg`. */
export function rotatedBoundingBoxSize(w: number, h: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return {
    width: Math.ceil(w * c + h * s) || 1,
    height: Math.ceil(w * s + h * c) || 1,
  };
}

export type PixelRect = { x: number; y: number; width: number; height: number };

export function fullFramePixelRect(rw: number, rh: number): PixelRect {
  return { x: 0, y: 0, width: rw, height: rh };
}

export function isFullFramePixels(
  area: PixelRect,
  rw: number,
  rh: number,
): boolean {
  const eps = 1.5;
  return (
    area.x <= eps &&
    area.y <= eps &&
    area.width >= rw - eps * 2 &&
    area.height >= rh - eps * 2
  );
}

export function clampCropToBounds(area: PixelRect, rw: number, rh: number): PixelRect {
  const minSize = 4;
  let { x, y, width, height } = area;
  width = Math.max(minSize, width);
  height = Math.max(minSize, height);
  x = Math.max(0, Math.min(x, rw - minSize));
  y = Math.max(0, Math.min(y, rh - minSize));
  width = Math.min(width, rw - x);
  height = Math.min(height, rh - y);
  return { x, y, width, height };
}
