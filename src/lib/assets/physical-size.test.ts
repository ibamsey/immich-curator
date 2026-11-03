import { describe, expect, it } from "vitest";
import type { GridAsset } from "@/lib/assets/grid-asset";
import {
  computePhysicalSizeMm,
  parseExifResolution,
  pixelsToMm,
} from "@/lib/assets/physical-size";

describe("parseExifResolution", () => {
  it("converts inch resolution to dpi", () => {
    expect(parseExifResolution(300, 300, 2)).toEqual({ dpiX: 300, dpiY: 300 });
  });

  it("converts cm resolution to dpi", () => {
    const r = parseExifResolution(118.11, 118.11, 3);
    expect(r?.dpiX).toBeCloseTo(300, 0);
  });
});

describe("pixelsToMm", () => {
  it("converts at 300 dpi", () => {
    expect(pixelsToMm(3000, 300)).toBeCloseTo(254, 1);
  });
});

describe("computePhysicalSizeMm", () => {
  const asset: GridAsset = {
    id: "a",
    originalFileName: "scan.jpg",
    fileCreatedAt: "",
    localDateTime: "",
    updatedAt: "",
    width: 3000,
    height: 2000,
  };

  it("uses default dpi when no file resolution", () => {
    const s = computePhysicalSizeMm(asset, 300, null);
    expect(s).not.toBeNull();
    expect(s!.widthMm).toBeCloseTo(254, 0);
    expect(s!.areaMm2).toBeCloseTo(s!.widthMm * s!.heightMm, 0);
    expect(s!.resolution.source).toBe("default");
  });

  it("uses file exif dpi when provided", () => {
    const s = computePhysicalSizeMm(asset, 300, {
      dpiX: 600,
      dpiY: 600,
      source: "exif",
    });
    expect(s!.widthMm).toBeCloseTo(127, 0);
    expect(s!.resolution.source).toBe("exif");
  });

  it("returns null without pixels", () => {
    expect(
      computePhysicalSizeMm({ ...asset, width: undefined }, 300, null),
    ).toBeNull();
  });
});
