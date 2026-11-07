"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FaceNameBox } from "@/components/people/face-name-box";
import { cn } from "@/lib/utils";
import { assetOriginalPath } from "@/lib/immich/asset-original-path";
import {
  containedImageRect,
  faceBoxPercent,
  type ContainedImageRect,
} from "@/lib/people/face-box-layout";
import {
  patchCachedFacePerson,
  patchCachedFaceUnlinked,
  subscribePersonRenames,
  withPersonName,
} from "@/lib/people/load-asset-faces";
import type { ImmichAssetFace, ImmichAssetWithEnrichment } from "@/lib/immich/types";
import { isEditableRasterImage } from "@/lib/images/editable-asset-format";

/** Minimal fields for loading original + labeling; matches `GridAsset` subset. */
export type AssetPreviewTarget = {
  id: string;
  originalFileName: string;
  /** Immich `type` (e.g. IMAGE). Used to gate editing. */
  type?: string | null;
  /** When set (e.g. opening from Linked faces), this face keeps primary emphasis until hover moves. */
  highlightFaceId?: string | null;
};

const MIN_SCALE = 0.25;
/** High ceiling so wheel zoom can exceed “100%” vs the fitted base image in the viewport. */
const MAX_SCALE = 48;

type ImageLayout = {
  containerW: number;
  containerH: number;
  naturalW: number;
  naturalH: number;
};

type Area = { x: number; y: number; width: number; height: number };

type Point = { x: number; y: number };

function pickFaceAtPercent(
  faces: ImmichAssetFace[],
  pxPct: number,
  pyPct: number,
): ImmichAssetFace | null {
  const hits = faces.flatMap((face) => {
    const box = faceBoxPercent(face);
    if (!box) return [];
    const pad = 0.2;
    const inside =
      pxPct >= box.left - pad &&
      pxPct <= box.left + box.width + pad &&
      pyPct >= box.top - pad &&
      pyPct <= box.top + box.height + pad;
    return inside ? [{ face, area: box.width * box.height }] : [];
  });
  if (hits.length === 0) return null;
  hits.sort((a, b) => a.area - b.area);
  return hits[0]!.face;
}

/** Width/height of the axis-aligned bounding box after rotating a `w × h` rectangle by `deg`. */
function rotatedBoundingBoxSize(w: number, h: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return {
    width: Math.ceil(w * c + h * s) || 1,
    height: Math.ceil(w * s + h * c) || 1,
  };
}

/** True when cropped area is essentially the full image (percent space). */
function isFullFramePercent(area: {
  x: number;
  y: number;
  width: number;
  height: number;
}): boolean {
  const eps = 0.35;
  return (
    area.x <= eps &&
    area.y <= eps &&
    area.width >= 100 - eps * 2 &&
    area.height >= 100 - eps * 2
  );
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Could not encode image"));
      },
      mime,
      quality,
    );
  });
}

/**
 * Rotate source, extract crop (in rotated pixel space), apply brightness/contrast.
 */
async function renderEditedBlob(params: {
  source: CanvasImageSource;
  naturalW: number;
  naturalH: number;
  rotationDeg: number;
  crop: Area;
  brightnessPct: number;
  contrastPct: number;
  outMime: string;
  quality: number;
}): Promise<Blob> {
  const {
    source,
    naturalW,
    naturalH,
    rotationDeg,
    crop,
    brightnessPct,
    contrastPct,
    outMime,
    quality,
  } = params;

  const normalizedRot = ((rotationDeg % 360) + 360) % 360;
  const { width: rw, height: rh } = rotatedBoundingBoxSize(
    naturalW,
    naturalH,
    normalizedRot,
  );

  const rotated = document.createElement("canvas");
  rotated.width = rw;
  rotated.height = rh;
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("2D context unavailable");

  const rad = (rotationDeg * Math.PI) / 180;
  rctx.translate(rw / 2, rh / 2);
  rctx.rotate(rad);
  rctx.translate(-naturalW / 2, -naturalH / 2);
  rctx.drawImage(source, 0, 0, naturalW, naturalH);

  const out = document.createElement("canvas");
  out.width = Math.max(1, crop.width);
  out.height = Math.max(1, crop.height);
  const octx = out.getContext("2d");
  if (!octx) throw new Error("2D context unavailable");

  octx.filter = `brightness(${brightnessPct}%) contrast(${contrastPct}%)`;
  octx.drawImage(
    rotated,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const q = outMime === "image/jpeg" ? quality : undefined;
  return canvasToBlob(out, outMime, q);
}

type AssetPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetPreviewTarget | null;
  /** Called after a successful save; asset id changes. */
  onAssetReplaced?: (
    oldId: string,
    next: ImmichAssetWithEnrichment,
  ) => void;
};

export function AssetPreviewModal({
  open,
  onOpenChange,
  asset,
  onAssetReplaced,
}: AssetPreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [faces, setFaces] = useState<ImmichAssetFace[]>([]);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);
  const [editingFaceId, setEditingFaceId] = useState<string | null>(null);
  const editingFaceIdRef = useRef<string | null>(null);
  const highlightFaceId = asset?.highlightFaceId ?? null;
  /** While editing a name we keep that face emphasized. */
  const emphasizedFaceId =
    editingFaceId ?? hoveredFaceId ?? highlightFaceId;
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const wheelCleanupRef = useRef<(() => void) | null>(null);

  const [contentType, setContentType] = useState<string | null>(null);
  const [mimeHint, setMimeHint] = useState<string | null>(null);
  const [metaTimes, setMetaTimes] = useState<{
    fileCreatedAt: string;
    fileModifiedAt: string;
  } | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [rotationQuarters, setRotationQuarters] = useState(0);
  /** Continuous rotation in addition to quarter turns (degrees). */
  const [freeRotationDeg, setFreeRotationDeg] = useState(0);
  const cropRotationDeg = rotationQuarters * 90 + freeRotationDeg;
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState<Area | null>(
    null,
  );
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const cropUrlRef = useRef<string | null>(null);

  useEffect(() => {
    editingFaceIdRef.current = editingFaceId;
  }, [editingFaceId]);

  const resetEditState = useCallback(() => {
    if (cropUrlRef.current) {
      URL.revokeObjectURL(cropUrlRef.current);
      cropUrlRef.current = null;
    }
    setCropImageUrl(null);
    setNaturalSize(null);
    setCrop({ x: 0, y: 0 });
    setCropZoom(1);
    setRotationQuarters(0);
    setFreeRotationDeg(0);
    setCroppedAreaPixels(null);
    setCroppedAreaPercent(null);
    setBrightness(100);
    setContrast(100);
    setSaveError(null);
  }, []);

  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setScale(1);
        setTx(0);
        setTy(0);
        setLayout(null);
        setHoveredFaceId(null);
        setEditingFaceId(null);
        setEditMode(false);
        resetEditState();
        setContentType(null);
        setMimeHint(null);
        setMetaTimes(null);
        setSaveError(null);
        setSaveOpen(false);
      }
      onOpenChange(next);
    },
    [onOpenChange, resetEditState],
  );

  const close = useCallback(
    () => handleDialogOpenChange(false),
    [handleDialogOpenChange],
  );

  const canEdit =
    !!asset &&
    isEditableRasterImage(
      asset.type ?? "IMAGE",
      mimeHint ?? contentType,
      asset.originalFileName,
    );

  const dirty = useMemo(() => {
    if (!croppedAreaPercent) return false;
    if (rotationQuarters % 4 !== 0) return true;
    if (Math.abs(freeRotationDeg) > 0.05) return true;
    if (brightness !== 100 || contrast !== 100) return true;
    return !isFullFramePercent(croppedAreaPercent);
  }, [croppedAreaPercent, rotationQuarters, freeRotationDeg, brightness, contrast]);

  const outputMime = useMemo(() => {
    const mime = (mimeHint ?? contentType ?? "").split(";")[0]?.trim().toLowerCase();
    if (mime === "image/png" || mime === "image/webp") return mime;
    return "image/jpeg";
  }, [mimeHint, contentType]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (editMode) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
        return;
      }
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close, editMode]);

  useEffect(() => {
    if (!open || !asset) return;
    let cancelled = false;
    fetch(`/api/immich/assets/${asset.id}/faces`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { faces?: ImmichAssetFace[] } | null) => {
        if (cancelled) return;
        setFaces(data?.faces ?? []);
      })
      .catch(() => {
        if (!cancelled) setFaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, asset]);

  useEffect(() => {
    return subscribePersonRenames((personId, name) => {
      setFaces((prev) => withPersonName(prev, personId, name));
    });
  }, []);

  useEffect(() => {
    if (!open || !asset) return;
    let cancelled = false;
    const src = assetOriginalPath(asset.id);
    fetch(src, { method: "HEAD" })
      .then((res) => {
        if (cancelled || !res.ok) return;
        setContentType(res.headers.get("content-type"));
      })
      .catch(() => {});
    fetch(`/api/immich/assets/${asset.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: {
          fileCreatedAt?: string;
          fileModifiedAt?: string;
          originalMimeType?: string;
        } | null) => {
          if (cancelled || !data) return;
          if (data.originalMimeType) {
            setMimeHint(data.originalMimeType);
          }
          const fc = data.fileCreatedAt;
          const fm = data.fileModifiedAt ?? fc;
          if (fc && fm) {
            setMetaTimes({ fileCreatedAt: fc, fileModifiedAt: fm });
          }
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, asset]);

  const measureImageLayout = useCallback(() => {
    const container = imageContainerRef.current;
    const img = container?.querySelector("img");
    if (!container || !img || !img.naturalWidth) return;
    setLayout({
      containerW: container.clientWidth,
      containerH: container.clientHeight,
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
    });
  }, []);

  useEffect(() => {
    if (!open || editMode) return;
    const el = imageContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureImageLayout());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, asset?.id, measureImageLayout, editMode]);

  const imageRect: ContainedImageRect | null =
    !editMode && layout
      ? containedImageRect(
          layout.containerW,
          layout.containerH,
          layout.naturalW,
          layout.naturalH,
        )
      : null;

  const updateHoverFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const container = imageContainerRef.current;
      if (
        !container ||
        !layout ||
        faces.length === 0 ||
        editMode ||
        editingFaceIdRef.current
      ) {
        setHoveredFaceId(null);
        return;
      }
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        setHoveredFaceId(null);
        return;
      }
      const lx =
        ((clientX - rect.left) / rect.width) * container.clientWidth;
      const ly =
        ((clientY - rect.top) / rect.height) * container.clientHeight;

      const ir = containedImageRect(
        container.clientWidth,
        container.clientHeight,
        layout.naturalW,
        layout.naturalH,
      );
      if (
        lx < ir.x ||
        lx > ir.x + ir.width ||
        ly < ir.y ||
        ly > ir.y + ir.height
      ) {
        setHoveredFaceId(null);
        return;
      }
      const pctX = ((lx - ir.x) / ir.width) * 100;
      const pctY = ((ly - ir.y) / ir.height) * 100;
      const hit = pickFaceAtPercent(faces, pctX, pctY);
      setHoveredFaceId(hit?.id ?? null);
    },
    [faces, layout, editMode],
  );

  const attachViewportWheel = useCallback(() => {
    wheelCleanupRef.current?.();
    wheelCleanupRef.current = null;
    const el = viewportRef.current;
    if (!open || !el || editMode) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = e.clientX - cx;
      const my = e.clientY - cy;

      let delta =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0 && e.deltaZ !== 0) delta = e.deltaZ;

      if (delta === 0) return;

      const factor = delta < 0 ? 1.08 : 1 / 1.08;
      setScale((prev) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
        const ratio = next / prev;
        setTx((t) => t + mx * (1 - ratio));
        setTy((t) => t + my * (1 - ratio));
        return next;
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    wheelCleanupRef.current = () => {
      el.removeEventListener("wheel", onWheel);
      wheelCleanupRef.current = null;
    };
  }, [editMode, open]);

  const setViewportRef = useCallback(
    (el: HTMLDivElement | null) => {
      viewportRef.current = el;
      attachViewportWheel();
    },
    [attachViewportWheel],
  );

  useEffect(() => {
    attachViewportWheel();
    return () => {
      wheelCleanupRef.current?.();
      wheelCleanupRef.current = null;
    };
  }, [attachViewportWheel]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editMode || e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateHoverFromClientPoint(e.clientX, e.clientY);
    if (editMode || !dragging.current) return;
    const { x, y, tx: stx, ty: sty } = dragStart.current;
    setTx(stx + (e.clientX - x));
    setTy(sty + (e.clientY - y));
  };

  const onPointerLeave = () => {
    setHoveredFaceId(null);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editMode || !dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const enterEditMode = useCallback(async () => {
    if (!asset) return;
    resetEditState();
    const src = assetOriginalPath(asset.id);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("Could not load original");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      cropUrlRef.current = url;
      setCropImageUrl(url);
      const bmp = await createImageBitmap(blob);
      setNaturalSize({ w: bmp.width, h: bmp.height });
      bmp.close();
      setEditMode(true);
      setScale(1);
      setTx(0);
      setTy(0);
    } catch {
      setSaveError("Could not load image for editing.");
    }
  }, [asset, resetEditState]);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    resetEditState();
  }, [resetEditState]);

  const revertEdits = useCallback(() => {
    setRotationQuarters(0);
    setFreeRotationDeg(0);
    setBrightness(100);
    setContrast(100);
    setCropZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPercent({ x: 0, y: 0, width: 100, height: 100 });
    if (naturalSize) {
      setCroppedAreaPixels({
        x: 0,
        y: 0,
        width: naturalSize.w,
        height: naturalSize.h,
      });
    }
  }, [naturalSize]);

  const runSave = useCallback(async () => {
    if (!asset || !naturalSize || !croppedAreaPixels) return;
    setSaveLoading(true);
    setSaveError(null);
    try {
      const src = assetOriginalPath(asset.id);
      const res = await fetch(src);
      if (!res.ok) throw new Error("Could not read original");
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      const edited = await renderEditedBlob({
        source: bmp,
        naturalW: naturalSize.w,
        naturalH: naturalSize.h,
        rotationDeg: cropRotationDeg,
        crop: croppedAreaPixels,
        brightnessPct: brightness,
        contrastPct: contrast,
        outMime: outputMime,
        quality: 0.92,
      });
      bmp.close();

      const form = new FormData();
      const editedFile = new File(
        [edited],
        asset.originalFileName || "edited.jpg",
        { type: outputMime },
      );
      form.set("file", editedFile);
      form.set("filename", asset.originalFileName || "edited.jpg");
      const fc = metaTimes?.fileCreatedAt ?? new Date().toISOString();
      const fm = metaTimes?.fileModifiedAt ?? fc;
      form.set("fileCreatedAt", fc);
      form.set("fileModifiedAt", fm);

      const put = await fetch(
        `/api/immich/assets/${asset.id}/replace-with-upload`,
        { method: "POST", body: form },
      );
      const data = (await put.json()) as {
        asset?: ImmichAssetWithEnrichment;
        message?: string;
      };
      if (!put.ok) {
        throw new Error(data.message ?? "Save failed");
      }
      if (!data.asset?.id) {
        throw new Error("Invalid server response");
      }
      onAssetReplaced?.(asset.id, data.asset);
      setSaveOpen(false);
      exitEditMode();
      handleDialogOpenChange(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaveLoading(false);
    }
  }, [
    asset,
    naturalSize,
    croppedAreaPixels,
    cropRotationDeg,
    brightness,
    contrast,
    outputMime,
    metaTimes,
    onAssetReplaced,
    exitEditMode,
    handleDialogOpenChange,
  ])

  if (!asset) return null;

  const src = assetOriginalPath(asset.id);

  const footerHelp = editMode
    ? "Order: 90° steps and free angle combine to rotate first, then crop, then brightness/contrast (preview matches saved image). Zoom the crop area with the mouse wheel."
    : "Wheel: zoom · drag: pan · hover: face names · Esc or ✕: close";

  return (
    <>
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[85vh] w-[85vw] max-w-[85vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[85vw]",
          "h-[85vh]",
        )}
      >
        <DialogTitle className="sr-only">
          Preview: {asset.originalFileName || asset.id}
        </DialogTitle>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-popover px-2 py-1.5">
          {canEdit ? (
            <>
              {!editMode ? (
                <Button type="button" size="sm" variant="secondary" onClick={enterEditMode}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button type="button" size="sm" variant="outline" onClick={exitEditMode}>
                    Done editing
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!dirty}
                    onClick={revertEdits}
                  >
                    Revert
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={!dirty}
                    onClick={() => {
                      setSaveError(null);
                      setSaveOpen(true);
                    }}
                  >
                    Save…
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setRotationQuarters((q) => (q + 1) % 4)
                    }
                  >
                    Rotate 90°
                  </Button>
                  <label className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    Angle
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={0.5}
                      value={freeRotationDeg}
                      onChange={(e) =>
                        setFreeRotationDeg(Number(e.target.value))
                      }
                      className="w-28 min-w-[5rem] sm:w-32"
                      title="Free rotation in degrees (adds to 90° steps)"
                    />
                    <span className="w-8 shrink-0 tabular-nums">
                      {Math.round(freeRotationDeg)}°
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Brightness
                    <input
                      type="range"
                      min={30}
                      max={200}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-24"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Contrast
                    <input
                      type="range"
                      min={30}
                      max={200}
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-24"
                    />
                  </label>
                </>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              Editing not available for this file type.
            </span>
          )}
          {saveError ? (
            <span className="text-xs text-destructive">{saveError}</span>
          ) : null}
        </div>

        <div
          ref={setViewportRef}
          className={cn(
            "relative flex min-h-0 flex-1 overflow-hidden bg-black/90",
            editMode ? "cursor-default" : "cursor-grab items-center justify-center active:cursor-grabbing",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
          style={{ touchAction: editMode ? "auto" : "none" }}
        >
          {editMode && cropImageUrl && naturalSize ? (
            <div className="relative min-h-0 w-full flex-1">
              <Cropper
                image={cropImageUrl}
                crop={crop}
                zoom={cropZoom}
                rotation={cropRotationDeg}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setCropZoom}
                onCropComplete={(p, pixels) => {
                  setCroppedAreaPercent(p);
                  setCroppedAreaPixels(pixels);
                }}
                restrictPosition
                style={{
                  containerStyle: {
                    width: "100%",
                    height: "100%",
                    position: "relative",
                  },
                  mediaStyle: {
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  },
                }}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center",
                "will-change-transform",
              )}
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              }}
            >
              <div
                ref={imageContainerRef}
                className="relative inline-block max-h-full max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={asset.originalFileName || ""}
                  draggable={false}
                  className="block max-h-full max-w-full select-none object-contain"
                  onLoad={measureImageLayout}
                />
                {imageRect && faces.length > 0 ? (
                  <div
                    className="pointer-events-none absolute z-10"
                    style={{
                      left: imageRect.x,
                      top: imageRect.y,
                      width: imageRect.width,
                      height: imageRect.height,
                    }}
                  >
                    {faces.map((face) => {
                      const box = faceBoxPercent(face);
                      if (!box) return null;
                      const emphasized = emphasizedFaceId === face.id;
                      return (
                        <FaceNameBox
                          key={`${face.id}-${face.person?.id ?? "unlinked"}`}
                          faceId={face.id}
                          personId={face.person?.id ?? null}
                          name={face.person?.name ?? ""}
                          className={cn(
                            "box-border transition-colors duration-150",
                            emphasized
                              ? "border-2 border-primary shadow-[0_0_0_1px_rgba(0,0,0,0.85)]"
                              : "border border-white/45",
                          )}
                          style={{
                            left: `${box.left}%`,
                            top: `${box.top}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`,
                          }}
                          showLabel={emphasized}
                          onMouseEnter={() => setHoveredFaceId(face.id)}
                          onMouseLeave={() => {
                            if (editingFaceIdRef.current === face.id) {
                              return;
                            }
                            setHoveredFaceId((current) =>
                              current === face.id ? null : current,
                            );
                          }}
                          onEditingChange={(next) => {
                            setEditingFaceId(next ? face.id : null);
                          }}
                          onSaved={(faceId, person) => {
                            if (!asset) return;
                            setFaces((prev) =>
                              prev.map((item) =>
                                item.id === faceId
                                  ? { ...item, person }
                                  : item,
                              ),
                            );
                            patchCachedFacePerson(asset.id, faceId, person);
                          }}
                          onUnlinked={(faceId) => {
                            if (!asset) return;
                            setFaces((prev) =>
                              prev.map((item) =>
                                item.id === faceId
                                  ? { ...item, person: null }
                                  : item,
                              ),
                            );
                            patchCachedFaceUnlinked(asset.id, faceId);
                          }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <p className="shrink-0 border-t border-border/60 bg-popover px-3 py-2 text-xs text-muted-foreground">
          {footerHelp}
        </p>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={saveOpen}
      onOpenChange={setSaveOpen}
      title="Replace file in Immich?"
      description="This uploads a new file and removes the current asset. The photo will get a new asset id. Albums, favorites, and other links are copied from the old asset when the server allows."
      confirmLabel="Replace"
      confirmVariant="destructive"
      loading={saveLoading}
      onConfirm={runSave}
    />
    </>
  );
}
