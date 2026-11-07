import { describe, expect, it } from "vitest";
import { isEditableRasterImage } from "./editable-asset-format";

describe("isEditableRasterImage", () => {
  it("allows JPEG by MIME", () => {
    expect(isEditableRasterImage("IMAGE", "image/jpeg", "x.heic")).toBe(true);
  });

  it("allows PNG with charset in Content-Type", () => {
    expect(
      isEditableRasterImage("IMAGE", "image/png; charset=binary", "x.png"),
    ).toBe(true);
  });

  it("allows WebP by extension when MIME is octet-stream", () => {
    expect(isEditableRasterImage("IMAGE", "application/octet-stream", "a.webp")).toBe(
      true,
    );
  });

  it("rejects non-IMAGE type", () => {
    expect(isEditableRasterImage("VIDEO", "image/jpeg", "a.jpg")).toBe(false);
  });

  it("rejects HEIC", () => {
    expect(isEditableRasterImage("IMAGE", "image/heic", "a.heic")).toBe(false);
  });

  it("rejects unknown extension and unknown MIME", () => {
    expect(isEditableRasterImage("IMAGE", undefined, "scan")).toBe(false);
  });
});
