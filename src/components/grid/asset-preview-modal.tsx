"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  BROWSE_PEEK_MAX_SCALE,
  BROWSE_PEEK_MIN_SCALE,
  computeBrowsePeekTransform,
} from "@/lib/people/browse-peek-framing";
import {
  containedImageRect,
  displayRectNearlyEqual,
  displayRectToFacePixels,
  faceBoxDisplayRect,
  faceBoxOnImage,
  faceBoxPercentStyle,
  imageOverlayLayout,
  manualFacePayload,
  type ContainedImageRect,
  type DisplayRect,
} from "@/lib/people/face-box-layout";
import {
  invalidateAssetFaces,
  loadAssetFaces,
  patchCachedFacePerson,
  patchCachedFaceUnlinked,
  subscribePersonRenames,
  withPersonName,
} from "@/lib/people/load-asset-faces";
import type {
  ImmichAssetFace,
  ImmichAssetWithEnrichment,
  ImmichPerson,
} from "@/lib/immich/types";
import { isEditableRasterImage } from "@/lib/images/editable-asset-format";
import {
  fullFramePixelRect,
  isFullFramePixels,
  rotatedBoundingBoxSize,
} from "@/lib/images/rotated-bounds";
import { AddFaceTagPanel } from "@/components/grid/add-face-tag-panel";
import { EditImageCrop } from "@/components/grid/edit-image-crop";
import { EditImageFacesOverlay } from "@/components/grid/edit-image-faces-overlay";
import { displayRectIsUsable } from "@/components/people/display-rect-editor";
import { normalizeAssetDetail } from "@/lib/assets/grid-asset";

/** Minimal fields for loading original + labeling; matches `GridAsset` subset. */
export type AssetPreviewTarget = {
  id: string;
  originalFileName: string;
  /** Immich `type` (e.g. IMAGE). Used to gate editing. */
  type?: string | null;
  /** When set (e.g. opening from Linked faces), this face keeps primary emphasis until hover moves. */
  highlightFaceId?: string | null;
  /** Linked-faces row geometry when batched face fetch may not include this id yet. */
  rowFace?: Pick<
    ImmichAssetFace,
    | "id"
    | "boundingBoxX1"
    | "boundingBoxY1"
    | "boundingBoxX2"
    | "boundingBoxY2"
    | "imageWidth"
    | "imageHeight"
  >;
  /** Linked-faces peek: show this person on the row face before full face fetch. */
  highlightPerson?: Pick<ImmichPerson, "id" | "name"> | null;
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

function pickFaceAtPercent(
  faces: ImmichAssetFace[],
  pxPct: number,
  pyPct: number,
  imageNaturalWidth: number,
  imageNaturalHeight: number,
): ImmichAssetFace | null {
  const hits = faces.flatMap((face) => {
    const box = faceBoxOnImage(face, imageNaturalWidth, imageNaturalHeight);
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
  /** After description or other metadata saved from the modal footer. */
  onAssetUpdated?: (asset: ImmichAssetWithEnrichment) => void;
  /** Hide Edit / Crop / Add face until the user chooses Enable editing (e.g. People linked-faces browse). */
  editingLocked?: boolean;
  /** Prev/next through a caller-defined sequence (e.g. linked face rows). */
  onNavigate?: (delta: 1 | -1) => void;
  navPosition?: { index: number; total: number };
  /** Renders in a positioned pane (not a viewport-covering dialog). */
  embedded?: boolean;
  /** Description footer; default hidden when `embedded`. */
  showDescriptionFooter?: boolean;
  /** User zoom multiplier for linked-faces hover peek (persists across row hovers). */
  browsePeekZoomMultiplier?: number;
  onBrowsePeekZoomMultiplierChange?: (multiplier: number) => void;
  /** For unlinked face naming (autocomplete + merge check). */
  cataloguePeople?: ImmichPerson[];
};

export function AssetPreviewModal({
  open,
  onOpenChange,
  asset,
  onAssetReplaced,
  onAssetUpdated,
  editingLocked = false,
  onNavigate,
  navPosition,
  embedded = false,
  showDescriptionFooter,
  browsePeekZoomMultiplier = 1,
  onBrowsePeekZoomMultiplierChange,
  cataloguePeople = [],
}: AssetPreviewModalProps) {
  const descriptionFooterVisible =
    showDescriptionFooter ?? !embedded;
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [faces, setFaces] = useState<ImmichAssetFace[]>([]);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [editingFaceId, setEditingFaceId] = useState<string | null>(null);
  const editingFaceIdRef = useRef<string | null>(null);
  const highlightFaceId = asset?.highlightFaceId ?? null;
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const wheelCleanupRef = useRef<(() => void) | null>(null);
  const browsePeekBaseScaleRef = useRef(1);
  const browsePeekZoomMultiplierRef = useRef(browsePeekZoomMultiplier);

  const [contentType, setContentType] = useState<string | null>(null);
  const [mimeHint, setMimeHint] = useState<string | null>(null);
  const [metaTimes, setMetaTimes] = useState<{
    fileCreatedAt: string;
    fileModifiedAt: string;
  } | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const descriptionSavedRef = useRef("");
  const descriptionFocusedRef = useRef(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [descriptionSaving, setDescriptionSaving] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const [editUnlocked, setEditUnlocked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const prevAssetIdRef = useRef<string | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [cropToolActive, setCropToolActive] = useState(false);
  const [rotationQuarters, setRotationQuarters] = useState(0);
  /** Continuous rotation in addition to quarter turns (degrees). */
  const [freeRotationDeg, setFreeRotationDeg] = useState(0);
  const cropRotationDeg = rotationQuarters * 90 + freeRotationDeg;
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const prevCropRotationRef = useRef(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [geometryEditingFaceId, setGeometryEditingFaceId] = useState<
    string | null
  >(null);
  const [draftDisplayRect, setDraftDisplayRect] = useState<DisplayRect | null>(
    null,
  );
  const [geometrySaving, setGeometrySaving] = useState(false);
  const [addFaceMode, setAddFaceMode] = useState(false);
  /** Step 2 done: show link-to-person UI (step 3). */
  const [addFaceRectConfirmed, setAddFaceRectConfirmed] = useState(false);
  const [addFaceSaving, setAddFaceSaving] = useState(false);
  const [faceToolError, setFaceToolError] = useState<string | null>(null);
  const [unlinkFaceId, setUnlinkFaceId] = useState<string | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const editImageLayoutRef = useRef({ w: 0, h: 0 });

  /** Linked-faces hover peek: keep the list row’s face emphasized, not image hit-testing. */
  const browsePeekMode = embedded && editingLocked && !editUnlocked;

  useEffect(() => {
    browsePeekZoomMultiplierRef.current = browsePeekZoomMultiplier;
  }, [browsePeekZoomMultiplier]);

  const resolveBrowsePeekFace = useCallback((): ImmichAssetFace | null => {
    if (!highlightFaceId) return null;
    const fromFaces = faces.find((f) => f.id === highlightFaceId);
    if (fromFaces) return fromFaces;
    const row = asset?.rowFace;
    if (row && row.id === highlightFaceId) {
      const person = asset?.highlightPerson ?? null;
      return {
        id: row.id,
        boundingBoxX1: row.boundingBoxX1,
        boundingBoxY1: row.boundingBoxY1,
        boundingBoxX2: row.boundingBoxX2,
        boundingBoxY2: row.boundingBoxY2,
        imageWidth: row.imageWidth,
        imageHeight: row.imageHeight,
        person: person
          ? {
              ...person,
              birthDate: null,
              isHidden: false,
              thumbnailPath: "",
            }
          : null,
      };
    }
    return null;
  }, [faces, highlightFaceId, asset?.rowFace, asset?.highlightPerson]);

  const applyBrowsePeekFrame = useCallback(() => {
    if (!browsePeekMode || !open || !layout) return;
    if (dragging.current) return;
    const viewport = viewportRef.current;
    if (!viewport?.clientHeight) return;
    const face = resolveBrowsePeekFace();
    const result = computeBrowsePeekTransform({
      containerW: layout.containerW,
      containerH: layout.containerH,
      naturalW: layout.naturalW,
      naturalH: layout.naturalH,
      viewportH: viewport.clientHeight,
      face,
      zoomMultiplier: browsePeekZoomMultiplier,
      minScale: BROWSE_PEEK_MIN_SCALE,
      maxScale: BROWSE_PEEK_MAX_SCALE,
    });
    browsePeekBaseScaleRef.current = result.baseScale;
    setScale(result.scale);
    setTx(result.tx);
    setTy(result.ty);
  }, [
    browsePeekMode,
    open,
    layout,
    browsePeekZoomMultiplier,
    resolveBrowsePeekFace,
  ]);

  /** While editing a name or face box we keep that face emphasized. */
  const emphasizedFaceId =
    browsePeekMode && highlightFaceId
      ? highlightFaceId
      : editingFaceId ??
        geometryEditingFaceId ??
        hoveredFaceId ??
        selectedFaceId ??
        highlightFaceId;

  const stackFrontFaceId = emphasizedFaceId;

  const facesPaintOrder = useMemo(() => {
    if (!stackFrontFaceId) return faces;
    const front = stackFrontFaceId;
    return [...faces].sort((a, b) => {
      if (a.id === front) return 1;
      if (b.id === front) return -1;
      return 0;
    });
  }, [faces, stackFrontFaceId]);

  const modalFaceOverlayList = useMemo(() => {
    if (browsePeekMode && highlightFaceId) {
      const face = resolveBrowsePeekFace();
      return face ? [face] : [];
    }
    return facesPaintOrder;
  }, [browsePeekMode, highlightFaceId, resolveBrowsePeekFace, facesPaintOrder]);

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
    setCropToolActive(false);
    setRotationQuarters(0);
    setFreeRotationDeg(0);
    setCroppedAreaPixels(null);
    prevCropRotationRef.current = 0;
    setBrightness(100);
    setContrast(100);
    setSaveError(null);
    setGeometryEditingFaceId(null);
    setDraftDisplayRect(null);
    setGeometrySaving(false);
    setAddFaceMode(false);
    setAddFaceRectConfirmed(false);
    setAddFaceSaving(false);
    setFaceToolError(null);
  }, []);

  const mergeRowFace = useCallback(
    (loaded: ImmichAssetFace[]): ImmichAssetFace[] => {
      const highlightId = asset?.highlightFaceId;
      const row = asset?.rowFace;
      if (
        !highlightId ||
        !row ||
        row.id !== highlightId ||
        loaded.some((f) => f.id === highlightId)
      ) {
        return loaded;
      }
      const person = asset?.highlightPerson ?? null;
      return [
        ...loaded,
        {
          id: row.id,
          boundingBoxX1: row.boundingBoxX1,
          boundingBoxY1: row.boundingBoxY1,
          boundingBoxX2: row.boundingBoxX2,
          boundingBoxY2: row.boundingBoxY2,
          imageWidth: row.imageWidth,
          imageHeight: row.imageHeight,
          person: person
            ? {
                ...person,
                birthDate: null,
                isHidden: false,
                thumbnailPath: "",
              }
            : null,
        },
      ];
    },
    [asset?.highlightFaceId, asset?.highlightPerson, asset?.rowFace],
  );

  const reloadAssetFaces = useCallback(async () => {
    if (!asset) return;
    invalidateAssetFaces(asset.id);
    const next = await loadAssetFaces(asset.id);
    setFaces(mergeRowFace(next));
  }, [asset, mergeRowFace]);

  const confirmUnlinkFace = useCallback(async () => {
    if (!unlinkFaceId || !asset) return;
    setUnlinkLoading(true);
    setFaceToolError(null);
    try {
      const res = await fetch(`/api/immich/faces/${unlinkFaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message ?? "Unlink failed");
      }
      setFaces((prev) =>
        prev.map((item) =>
          item.id === unlinkFaceId ? { ...item, person: null } : item,
        ),
      );
      patchCachedFaceUnlinked(asset.id, unlinkFaceId);
      if (geometryEditingFaceId === unlinkFaceId) {
        setGeometryEditingFaceId(null);
        setDraftDisplayRect(null);
      }
      setEditingFaceId((current) =>
        current === unlinkFaceId ? null : current,
      );
      setUnlinkFaceId(null);
    } catch (e) {
      setFaceToolError(e instanceof Error ? e.message : "Unlink failed");
      setUnlinkFaceId(null);
    } finally {
      setUnlinkLoading(false);
    }
  }, [asset, geometryEditingFaceId, unlinkFaceId]);

  const handleGeometryCommitted = useCallback(
    async (
      faceId: string,
      pixels: ReturnType<typeof displayRectToFacePixels>,
    ) => {
      if (!asset) return;
      const face = faces.find((f) => f.id === faceId);
      const personId = face?.person?.id;
      if (!personId) return;
      setGeometrySaving(true);
      setFaceToolError(null);
      try {
        const payload = manualFacePayload(pixels, asset.id, personId);
        const res = await fetch(`/api/immich/faces/${faceId}/geometry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(data.message ?? "Could not save face rectangle");
        }
        setGeometryEditingFaceId(null);
        setDraftDisplayRect(null);
        await reloadAssetFaces();
      } catch (e) {
        setFaceToolError(
          e instanceof Error ? e.message : "Could not save face rectangle",
        );
      } finally {
        setGeometrySaving(false);
      }
    },
    [asset, faces, reloadAssetFaces],
  );

  const saveDescriptionIfChanged = useCallback(async () => {
    if (!asset || descriptionSaving) return;
    if (descriptionDraft === descriptionSavedRef.current) return;
    setDescriptionSaving(true);
    setDescriptionError(null);
    try {
      const res = await fetch(`/api/immich/assets/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: descriptionDraft }),
      });
      const data = (await res.json()) as ImmichAssetWithEnrichment & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Save failed");
      }
      const enriched = normalizeAssetDetail(
        data as unknown as Record<string, unknown>,
      );
      const saved = enriched.description ?? "";
      descriptionSavedRef.current = saved;
      setDescriptionDraft(saved);
      onAssetUpdated?.(enriched);
    } catch (e) {
      setDescriptionError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setDescriptionSaving(false);
    }
  }, [asset, descriptionDraft, descriptionSaving, onAssetUpdated]);

  const resetViewportForAssetSwitch = useCallback(() => {
    const peekBrowse = embedded && editingLocked && !editUnlocked;
    if (!peekBrowse) {
      setScale(1);
      setTx(0);
      setTy(0);
    }
    setLayout(null);
    setHoveredFaceId(null);
    setSelectedFaceId(null);
    setEditingFaceId(null);
    setEditMode(false);
    setEditUnlocked(false);
    resetEditState();
    setContentType(null);
    setMimeHint(null);
    setMetaTimes(null);
    setDescriptionDraft("");
    descriptionSavedRef.current = "";
    descriptionFocusedRef.current = false;
    setDescriptionSaving(false);
    setDescriptionError(null);
    setUnlinkFaceId(null);
    setUnlinkLoading(false);
    setSaveError(null);
    setSaveOpen(false);
    setFaces([]);
  }, [resetEditState, embedded, editingLocked, editUnlocked]);

  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        if (descriptionDraft !== descriptionSavedRef.current) {
          void saveDescriptionIfChanged();
        }
        prevAssetIdRef.current = null;
        resetViewportForAssetSwitch();
      }
      onOpenChange(next);
    },
    [
      onOpenChange,
      resetViewportForAssetSwitch,
      descriptionDraft,
      saveDescriptionIfChanged,
    ],
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

  const editingAllowed = canEdit && (!editingLocked || editUnlocked);

  const dirty = useMemo(() => {
    if (!naturalSize || !croppedAreaPixels) return false;
    const { width: rw, height: rh } = rotatedBoundingBoxSize(
      naturalSize.w,
      naturalSize.h,
      cropRotationDeg,
    );
    if (rotationQuarters % 4 !== 0) return true;
    if (Math.abs(freeRotationDeg) > 0.05) return true;
    if (brightness !== 100 || contrast !== 100) return true;
    return !isFullFramePixels(croppedAreaPixels, rw, rh);
  }, [
    croppedAreaPixels,
    cropRotationDeg,
    naturalSize,
    rotationQuarters,
    freeRotationDeg,
    brightness,
    contrast,
  ]);

  const faceChromeVisible = !editMode && Boolean(layout);
  const faceToolsInteractive =
    faceChromeVisible && !geometrySaving && !addFaceSaving;
  const faceToolCaptureActive = Boolean(
    geometryEditingFaceId || (addFaceMode && !addFaceRectConfirmed),
  );

  useEffect(() => {
    if (!dirty) return;
    setAddFaceMode(false);
    setGeometryEditingFaceId(null);
    setDraftDisplayRect(null);
  }, [dirty]);

  useEffect(() => {
    if (!editMode || !naturalSize) return;
    const { width: rw, height: rh } = rotatedBoundingBoxSize(
      naturalSize.w,
      naturalSize.h,
      cropRotationDeg,
    );
    if (prevCropRotationRef.current !== cropRotationDeg) {
      prevCropRotationRef.current = cropRotationDeg;
      setCroppedAreaPixels(fullFramePixelRect(rw, rh));
      return;
    }
    setCroppedAreaPixels((prev) => {
      if (!prev) return fullFramePixelRect(rw, rh);
      return prev;
    });
  }, [editMode, naturalSize, cropRotationDeg]);

  const outputMime = useMemo(() => {
    const mime = (mimeHint ?? contentType ?? "").split(";")[0]?.trim().toLowerCase();
    if (mime === "image/png" || mime === "image/webp") return mime;
    return "image/jpeg";
  }, [mimeHint, contentType]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (
          embedded ||
          !onNavigate ||
          descriptionFocusedRef.current ||
          editingFaceIdRef.current ||
          editMode ||
          faceToolCaptureActive ||
          addFaceMode
        ) {
          return;
        }
        e.preventDefault();
        onNavigate(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.key !== "Escape") return;
      if (descriptionFocusedRef.current) {
        e.preventDefault();
        descriptionTextareaRef.current?.blur();
        return;
      }
      if (editingFaceIdRef.current) {
        e.preventDefault();
        setEditingFaceId(null);
        return;
      }
      if (editMode) {
        e.preventDefault();
        close();
        return;
      }
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close, editMode, onNavigate, addFaceMode, faceToolCaptureActive, embedded]);

  useEffect(() => {
    if (!open || asset?.highlightFaceId == null) return;
    setHoveredFaceId(null);
    setSelectedFaceId(null);
    setEditingFaceId(null);
  }, [open, asset?.highlightFaceId]);

  useEffect(() => {
    if (!open || !asset) return;
    if (browsePeekMode) {
      setFaces(mergeRowFace([]));
    }
    let cancelled = false;
    void loadAssetFaces(asset.id)
      .then((loaded) => {
        if (!cancelled) setFaces(mergeRowFace(loaded));
      })
      .catch(() => {
        if (!cancelled) setFaces(mergeRowFace([]));
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    asset,
    asset?.id,
    asset?.highlightFaceId,
    asset?.rowFace,
    browsePeekMode,
    mergeRowFace,
  ]);

  useEffect(() => {
    if (!open || !asset?.id) {
      prevAssetIdRef.current = null;
      return;
    }
    const prev = prevAssetIdRef.current;
    prevAssetIdRef.current = asset.id;
    if (prev !== null && prev !== asset.id) {
      const flush =
        descriptionDraft !== descriptionSavedRef.current
          ? saveDescriptionIfChanged()
          : Promise.resolve();
      void flush.finally(() => resetViewportForAssetSwitch());
    }
  }, [
    open,
    asset?.id,
    descriptionDraft,
    resetViewportForAssetSwitch,
    saveDescriptionIfChanged,
  ]);

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
          description?: string | null;
          exifInfo?: { description?: string | null };
        } | null) => {
          if (cancelled || !data) return;
          if (data.originalMimeType) {
            setMimeHint(data.originalMimeType);
          }
          const desc = (
            data.description ??
            data.exifInfo?.description ??
            ""
          ).trim();
          if (!descriptionFocusedRef.current) {
            setDescriptionDraft(desc);
            descriptionSavedRef.current = desc;
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

  useEffect(() => {
    if (!browsePeekMode || !open) return;
    applyBrowsePeekFrame();
  }, [
    browsePeekMode,
    open,
    layout,
    asset?.id,
    asset?.highlightFaceId,
    faces,
    browsePeekZoomMultiplier,
    applyBrowsePeekFrame,
  ]);

  useEffect(() => {
    if (!browsePeekMode || !open) return;
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => applyBrowsePeekFrame());
    ro.observe(el);
    return () => ro.disconnect();
  }, [browsePeekMode, open, applyBrowsePeekFrame, asset?.id]);

  const imageRect = useMemo((): ContainedImageRect | null => {
    if (editMode || !layout) return null;
    return containedImageRect(
      layout.containerW,
      layout.containerH,
      layout.naturalW,
      layout.naturalH,
    );
  }, [
    editMode,
    layout?.containerW,
    layout?.containerH,
    layout?.naturalW,
    layout?.naturalH,
  ]);

  useEffect(() => {
    if (editMode || !imageRect) return;
    editImageLayoutRef.current = {
      w: imageRect.width,
      h: imageRect.height,
    };
  }, [editMode, imageRect]);

  const previewImageLayout = useMemo((): ContainedImageRect | null => {
    if (!imageRect) return null;
    return imageOverlayLayout(imageRect.width, imageRect.height);
  }, [imageRect]);

  const handleAddFaceTagged = useCallback(
    async (person: ImmichPerson) => {
      if (!asset || !draftDisplayRect) return;
      const imageW = editMode ? naturalSize?.w : layout?.naturalW;
      const imageH = editMode ? naturalSize?.h : layout?.naturalH;
      if (!imageW || !imageH) return;
      const layoutRect = editMode
        ? {
            x: 0,
            y: 0,
            width: editImageLayoutRef.current.w,
            height: editImageLayoutRef.current.h,
          }
        : previewImageLayout;
      if (!layoutRect?.width || !layoutRect.height) return;
      setAddFaceSaving(true);
      setFaceToolError(null);
      try {
        const pixels = displayRectToFacePixels(
          draftDisplayRect,
          layoutRect,
          imageW,
          imageH,
        );
        const payload = manualFacePayload(pixels, asset.id, person.id);
        const res = await fetch("/api/immich/faces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(data.message ?? "Could not add face");
        }
        setAddFaceMode(false);
        setAddFaceRectConfirmed(false);
        setDraftDisplayRect(null);
        await reloadAssetFaces();
      } catch (e) {
        setFaceToolError(
          e instanceof Error ? e.message : "Could not add face",
        );
      } finally {
        setAddFaceSaving(false);
      }
    },
    [
      asset,
      draftDisplayRect,
      editMode,
      layout,
      naturalSize,
      previewImageLayout,
      reloadAssetFaces,
    ],
  );

  const facesRef = useRef(faces);
  facesRef.current = faces;

  /** Re-anchor draft rect when the image layout resizes during geometry edit (not on every render). */
  useEffect(() => {
    if (!geometryEditingFaceId || !layout || !previewImageLayout) return;
    const face = facesRef.current.find((f) => f.id === geometryEditingFaceId);
    if (!face) return;
    const disp = faceBoxDisplayRect(
      face,
      layout.naturalW,
      layout.naturalH,
      previewImageLayout,
    );
    if (!disp) return;
    setDraftDisplayRect((prev) =>
      prev && displayRectNearlyEqual(prev, disp) ? prev : disp,
    );
  }, [
    geometryEditingFaceId,
    layout?.containerW,
    layout?.containerH,
    layout?.naturalW,
    layout?.naturalH,
    previewImageLayout?.width,
    previewImageLayout?.height,
  ]);

  const startFaceGeometryEdit = useCallback(
    (face: ImmichAssetFace) => {
      if (!layout || !previewImageLayout) return;
      const disp = faceBoxDisplayRect(
        face,
        layout.naturalW,
        layout.naturalH,
        previewImageLayout,
      );
      if (!disp) return;
      setDraftDisplayRect(disp);
      setGeometryEditingFaceId(face.id);
      setAddFaceMode(false);
      setFaceToolError(null);
    },
    [layout, previewImageLayout],
  );

  const saveFaceGeometry = useCallback(() => {
    if (
      !geometryEditingFaceId ||
      !draftDisplayRect ||
      !layout ||
      !previewImageLayout
    ) {
      return;
    }
    const pixels = displayRectToFacePixels(
      draftDisplayRect,
      previewImageLayout,
      layout.naturalW,
      layout.naturalH,
    );
    void handleGeometryCommitted(geometryEditingFaceId, pixels);
  }, [
    draftDisplayRect,
    geometryEditingFaceId,
    handleGeometryCommitted,
    layout,
    previewImageLayout,
  ]);

  const cancelFaceGeometry = useCallback(() => {
    setGeometryEditingFaceId(null);
    setDraftDisplayRect(null);
    setFaceToolError(null);
  }, []);

  const cancelAddFace = useCallback(() => {
    setAddFaceMode(false);
    setAddFaceRectConfirmed(false);
    setDraftDisplayRect(null);
    setFaceToolError(null);
  }, []);

  const confirmAddFaceRect = useCallback(() => {
    if (!draftDisplayRect || !displayRectIsUsable(draftDisplayRect)) {
      setFaceToolError("Draw a face box on the image first");
      return;
    }
    setAddFaceRectConfirmed(true);
    setFaceToolError(null);
  }, [draftDisplayRect]);

  const toggleAddFaceMode = useCallback(() => {
    setAddFaceMode((on) => {
      const next = !on;
      if (next) {
        setCropToolActive(false);
        setGeometryEditingFaceId(null);
        setAddFaceRectConfirmed(false);
        setDraftDisplayRect(null);
      } else {
        setDraftDisplayRect(null);
        setAddFaceRectConfirmed(false);
      }
      return next;
    });
    setFaceToolError(null);
  }, []);

  const updateHoverFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (browsePeekMode) {
        setHoveredFaceId(null);
        return;
      }
      const container = imageContainerRef.current;
      if (
        !container ||
        !layout ||
        faces.length === 0 ||
        editMode ||
        addFaceMode ||
        geometryEditingFaceId ||
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
      const hit = pickFaceAtPercent(
        faces,
        pctX,
        pctY,
        layout.naturalW,
        layout.naturalH,
      );
      setHoveredFaceId(hit?.id ?? null);
    },
    [browsePeekMode, faces, layout, editMode, addFaceMode, geometryEditingFaceId],
  );

  const applyBrowsePeekWheelDelta = useCallback(
    (delta: number) => {
      if (delta === 0) return;
      const factor = delta < 0 ? 1.08 : 1 / 1.08;
      const base = browsePeekBaseScaleRef.current || 1;
      const prevMult = browsePeekZoomMultiplierRef.current;
      let nextMult = Math.max(0.01, prevMult * factor);
      const unclampedScale = base * nextMult;
      const nextScale = Math.min(
        BROWSE_PEEK_MAX_SCALE,
        Math.max(BROWSE_PEEK_MIN_SCALE, unclampedScale),
      );
      if (base > 0) {
        nextMult = nextScale / base;
      }
      onBrowsePeekZoomMultiplierChange?.(nextMult);
    },
    [onBrowsePeekZoomMultiplierChange],
  );

  const attachViewportWheel = useCallback(() => {
    wheelCleanupRef.current?.();
    wheelCleanupRef.current = null;
    const el = viewportRef.current;
    if (!open || !el || editMode || faceToolCaptureActive) return;

    const onWheel = (e: WheelEvent) => {
      let delta =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0 && e.deltaZ !== 0) delta = e.deltaZ;
      if (delta === 0) return;

      if (browsePeekMode) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = e.clientX - cx;
      const my = e.clientY - cy;

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
  }, [
    applyBrowsePeekWheelDelta,
    browsePeekMode,
    editMode,
    faceToolCaptureActive,
    open,
  ]);

  useEffect(() => {
    if (!browsePeekMode || !open) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      let delta =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0 && e.deltaZ !== 0) delta = e.deltaZ;
      if (delta === 0) return;
      e.preventDefault();
      e.stopPropagation();
      applyBrowsePeekWheelDelta(delta);
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () =>
      window.removeEventListener("wheel", onWheel, { capture: true });
  }, [applyBrowsePeekWheelDelta, browsePeekMode, open]);

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
    if (editMode || faceToolCaptureActive || e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateHoverFromClientPoint(e.clientX, e.clientY);
    if (editMode || faceToolCaptureActive || !dragging.current) return;
    const { x, y, tx: stx, ty: sty } = dragStart.current;
    setTx(stx + (e.clientX - x));
    setTy(sty + (e.clientY - y));
  };

  const onPointerLeave = () => {
    setHoveredFaceId(null);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editMode || faceToolCaptureActive || !dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const enterEditMode = useCallback(async (opts?: { crop?: boolean }) => {
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
      const w = bmp.width;
      const h = bmp.height;
      setNaturalSize({ w, h });
      const { width: rw, height: rh } = rotatedBoundingBoxSize(w, h, 0);
      setCroppedAreaPixels(fullFramePixelRect(rw, rh));
      prevCropRotationRef.current = 0;
      bmp.close();
      setAddFaceMode(false);
      setGeometryEditingFaceId(null);
      setDraftDisplayRect(null);
      setEditMode(true);
      setCropToolActive(!!opts?.crop);
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
    setCropToolActive(false);
    prevCropRotationRef.current = 0;
    if (naturalSize) {
      const { width: rw, height: rh } = rotatedBoundingBoxSize(
        naturalSize.w,
        naturalSize.h,
        0,
      );
      setCroppedAreaPixels(fullFramePixelRect(rw, rh));
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

  if (!asset || !open) return null;

  const src = assetOriginalPath(asset.id);

  const shellClassName = embedded
    ? "flex h-[min(85vh,calc(100dvh-5.5rem))] min-h-0 w-full max-w-5xl flex-col gap-0 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
  : cn(
        "!flex max-h-[85vh] h-[85vh] min-h-0 w-[85vw] max-w-[85vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[85vw]",
      );

  const footerHelp = editMode
    ? cropToolActive
      ? "Crop: drag on the image to draw a rectangle · drag inside to move · drag handles to resize · Rotate and sliders apply to the full image (rotate first, then crop on save)."
      : "Crop, rotate, and brightness — save when done. Adjust face rectangles in the normal preview (close Edit or choose Done editing)."
    : faceToolCaptureActive
      ? "Drag handles to resize the face box · save or cancel on the toolbar chip · Esc closes the modal"
      : addFaceMode && !addFaceRectConfirmed
        ? "New face: drag a box on the image · resize with handles · ✓ when positioned"
        : addFaceMode && addFaceRectConfirmed
          ? "Link the new face to a person or create one · Back to reposition the box"
          : embedded
            ? "Wheel: zoom · drag: pan · hover another face in the panel to switch"
            : "Wheel: zoom · drag: pan · face names always shown · pen on linked faces to move the box · Add face for a new rectangle · Esc or ✕: close";

  const previewTitle = `Preview: ${asset.originalFileName || asset.id}`;

  const previewPanel = (
      <>
        <div className="flex shrink-0 flex-col gap-1.5 border-b border-border/60 bg-popover px-2 py-1.5">
          {canEdit && editingLocked && !editUnlocked ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setEditUnlocked(true)}
              >
                Enable editing
              </Button>
              {navPosition ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {navPosition.index + 1} / {navPosition.total}
                </span>
              ) : null}
            </div>
          ) : null}
          {editingAllowed ? (
            <>
              {!editMode ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void enterEditMode()}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => void enterEditMode({ crop: true })}
                  >
                    Crop
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={addFaceMode ? "secondary" : "outline"}
                    disabled={
                      !faceToolsInteractive ||
                      !!geometryEditingFaceId ||
                      geometrySaving
                    }
                    onClick={toggleAddFaceMode}
                  >
                    {addFaceMode ? "Add face (on)" : "Add face"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={exitEditMode}>
                      Done editing
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={cropToolActive ? "secondary" : "default"}
                      onClick={() => {
                        setCropToolActive((on) => !on);
                        setAddFaceMode(false);
                        setGeometryEditingFaceId(null);
                        setDraftDisplayRect(null);
                      }}
                    >
                      {cropToolActive ? "Crop (on)" : "Crop"}
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
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
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
                  </div>
                </>
              )}
            </>
          ) : !editingLocked ? (
            <span className="text-xs text-muted-foreground">
              Editing not available for this file type.
            </span>
          ) : null}
          {saveError ? (
            <span className="text-xs text-destructive">{saveError}</span>
          ) : null}
          {faceToolError ? (
            <span className="text-xs text-destructive">{faceToolError}</span>
          ) : null}
        </div>

        <div
          ref={setViewportRef}
          className={cn(
            "relative min-h-0 flex-1 overflow-hidden bg-black/90",
            editMode
              ? "flex w-full cursor-default flex-col"
              : "flex cursor-grab items-center justify-center active:cursor-grabbing",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
          style={{ touchAction: editMode ? "auto" : "none" }}
        >
          {onNavigate && navPosition && navPosition.total > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 z-40 -translate-y-1/2 bg-popover/90 shadow-md"
                aria-label="Previous photo"
                onClick={() => onNavigate(-1)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 z-40 -translate-y-1/2 bg-popover/90 shadow-md"
                aria-label="Next photo"
                onClick={() => onNavigate(1)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ChevronRight className="size-5" />
              </Button>
              <span className="pointer-events-none absolute bottom-2 left-1/2 z-40 -translate-x-1/2 rounded-md bg-popover/90 px-2 py-0.5 text-xs tabular-nums text-muted-foreground shadow-md">
                {navPosition.index + 1} / {navPosition.total}
              </span>
            </>
          ) : null}
          {editMode && cropImageUrl && naturalSize && croppedAreaPixels ? (
            <div className="relative min-h-0 flex-1">
              <EditImageCrop
                imageUrl={cropImageUrl}
                naturalW={naturalSize.w}
                naturalH={naturalSize.h}
                rotationDeg={cropRotationDeg}
                brightness={brightness}
                contrast={contrast}
                cropPixels={croppedAreaPixels}
                onCropPixelsChange={setCroppedAreaPixels}
                cropToolActive={cropToolActive}
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
                {imageRect &&
                layout &&
                faceChromeVisible &&
                editingAllowed ? (
                  <div
                    className={cn(
                      "absolute",
                      geometryEditingFaceId ||
                      (addFaceMode && !addFaceRectConfirmed)
                        ? "z-[55]"
                        : "pointer-events-none z-20",
                    )}
                    style={{
                      left: imageRect.x,
                      top: imageRect.y,
                      width: imageRect.width,
                      height: imageRect.height,
                    }}
                  >
                    <EditImageFacesOverlay
                      layoutW={imageRect.width}
                      layoutH={imageRect.height}
                      imageWidth={layout.naturalW}
                      imageHeight={layout.naturalH}
                      faces={faces}
                      faceChromeVisible
                      faceToolsInteractive={faceToolsInteractive}
                      geometryEditingFaceId={geometryEditingFaceId}
                      onGeometryEditingFaceIdChange={setGeometryEditingFaceId}
                      draftDisplayRect={draftDisplayRect}
                      onDraftDisplayRectChange={setDraftDisplayRect}
                      onGeometryCommitted={(faceId, pixels) =>
                        void handleGeometryCommitted(faceId, pixels)
                      }
                      geometrySaving={geometrySaving}
                      addFaceMode={addFaceMode}
                      addFaceRectConfirmed={addFaceRectConfirmed}
                      onAddFaceRectConfirm={confirmAddFaceRect}
                      onAddFaceCancel={cancelAddFace}
                      showFaceOutlines={Boolean(addFaceMode)}
                      showRectanglePens={false}
                      onGeometrySave={() => void saveFaceGeometry()}
                      onGeometryCancel={cancelFaceGeometry}
                    />
                  </div>
                ) : null}
                {imageRect && layout && modalFaceOverlayList.length > 0 ? (
                  <div
                    key={`${asset.id}:${highlightFaceId ?? ""}`}
                    className="pointer-events-none absolute z-30"
                    style={{
                      left: imageRect.x,
                      top: imageRect.y,
                      width: imageRect.width,
                      height: imageRect.height,
                    }}
                  >
                    {modalFaceOverlayList.map((face) => {
                      const box = faceBoxOnImage(
                        face,
                        layout.naturalW,
                        layout.naturalH,
                      );
                      if (!box) return null;
                      const emphasized = emphasizedFaceId === face.id;
                      const stackFront = stackFrontFaceId === face.id;
                      const isLinked = Boolean(face.person?.id);
                      const rectEditing = geometryEditingFaceId === face.id;
                      return (
                        <FaceNameBox
                          key={`${face.id}-${face.person?.id ?? "unlinked"}`}
                          faceId={face.id}
                          personId={face.person?.id ?? null}
                          name={face.person?.name ?? ""}
                          imageZoomScale={scale}
                          assetId={asset.id}
                          cataloguePeople={cataloguePeople}
                          syncEditingFaceId={editingFaceId}
                          accurateFaceOutline
                          faceOutlineEmphasis={emphasized ? "primary" : "subtle"}
                          suppressOutline={rectEditing}
                          className="transition-colors duration-150"
                          style={faceBoxPercentStyle(box)}
                          stackFront={stackFront}
                          showLabel={emphasized}
                          alwaysShowLabel={!browsePeekMode || emphasized}
                          unlinkedPlaceholder="Unknown"
                          onSelectedChange={(selected) => {
                            setSelectedFaceId((current) => {
                              if (selected) return face.id;
                              return current === face.id ? null : current;
                            });
                          }}
                          rectangleAdjust={
                            editingAllowed && faceChromeVisible && isLinked
                              ? {
                                  enabled: true,
                                  disabled: !faceToolsInteractive,
                                  editing: geometryEditingFaceId === face.id,
                                  saving: geometrySaving,
                                  blockedByOther:
                                    addFaceMode ||
                                    Boolean(
                                      geometryEditingFaceId &&
                                        geometryEditingFaceId !== face.id,
                                    ),
                                  onStart: () => startFaceGeometryEdit(face),
                                }
                              : undefined
                          }
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
                          onRequestUnlink={(faceId) => setUnlinkFaceId(faceId)}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <AddFaceTagPanel
            open={
              addFaceMode &&
              addFaceRectConfirmed &&
              faceToolsInteractive &&
              !geometryEditingFaceId &&
              !editMode
            }
            onOpenChange={(open) => {
              if (!open) {
                cancelAddFace();
              }
            }}
            onBack={() => {
              setAddFaceRectConfirmed(false);
              setFaceToolError(null);
            }}
            onCancel={cancelAddFace}
            onTagged={(person) => void handleAddFaceTagged(person)}
            saving={addFaceSaving}
            setSaving={setAddFaceSaving}
            error={faceToolError}
            setError={setFaceToolError}
          />
        </div>

        {descriptionFooterVisible ? (
          <div className="relative z-10 flex shrink-0 flex-col border-t border-border/60 bg-popover">
            <div className="px-3 py-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </span>
                <textarea
                  ref={descriptionTextareaRef}
                  value={descriptionDraft}
                  disabled={descriptionSaving || !asset}
                  rows={3}
                  placeholder="Add a description…"
                  className={cn(
                    "max-h-[5.5rem] min-h-[3.5rem] resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    descriptionError && "border-destructive",
                  )}
                  onChange={(e) => {
                    setDescriptionDraft(e.target.value);
                    setDescriptionError(null);
                  }}
                  onFocus={() => {
                    descriptionFocusedRef.current = true;
                    setDescriptionError(null);
                  }}
                  onBlur={() => {
                    descriptionFocusedRef.current = false;
                    void saveDescriptionIfChanged();
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                />
                {descriptionSaving ? (
                  <span className="text-[11px] text-muted-foreground">
                    Saving…
                  </span>
                ) : descriptionError ? (
                  <span className="text-[11px] text-destructive">
                    {descriptionError}
                  </span>
                ) : null}
              </label>
            </div>
            <p className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              {footerHelp}
            </p>
          </div>
        ) : (
          <p className="shrink-0 border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
            {footerHelp}
          </p>
        )}
      </>
  );

  return (
    <>
    {embedded ? (
      <div
        className={shellClassName}
        role="region"
        aria-label={previewTitle}
      >
        <p className="sr-only">{previewTitle}</p>
        {previewPanel}
      </div>
    ) : (
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent showCloseButton className={shellClassName}>
          <DialogTitle className="sr-only">{previewTitle}</DialogTitle>
          {previewPanel}
        </DialogContent>
      </Dialog>
    )}

    <ConfirmDialog
      open={unlinkFaceId !== null}
      onOpenChange={(next) => {
        if (!next && !unlinkLoading) setUnlinkFaceId(null);
      }}
      title="Unlink this face?"
      description="This removes the face from the linked person in Immich. You can assign a name again afterward."
      confirmLabel="Unlink"
      confirmVariant="destructive"
      loading={unlinkLoading}
      elevated
      onConfirm={() => void confirmUnlinkFace()}
    />

    <ConfirmDialog
      open={saveOpen}
      elevated
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
