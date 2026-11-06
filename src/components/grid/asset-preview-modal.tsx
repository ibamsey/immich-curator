"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { assetOriginalPath } from "@/lib/immich/asset-original-path";
import {
  containedImageRect,
  faceBoxPercent,
  type ContainedImageRect,
} from "@/lib/people/face-box-layout";
import {
  subscribePersonRenames,
  withPersonName,
} from "@/lib/people/load-asset-faces";
import type { ImmichAssetFace } from "@/lib/immich/types";

/** Minimal fields for loading original + labeling; matches `GridAsset` subset. */
export type AssetPreviewTarget = {
  id: string;
  originalFileName: string;
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
    return inside
      ? [{ face, area: box.width * box.height }]
      : [];
  });
  if (hits.length === 0) return null;
  hits.sort((a, b) => a.area - b.area);
  return hits[0]!.face;
}

type AssetPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetPreviewTarget | null;
};

export function AssetPreviewModal({
  open,
  onOpenChange,
  asset,
}: AssetPreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [faces, setFaces] = useState<ImmichAssetFace[]>([]);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const wheelCleanupRef = useRef<(() => void) | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = () => {
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

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
    if (!open) return;
    const el = imageContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureImageLayout());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, asset?.id, measureImageLayout]);

  const imageRect: ContainedImageRect | null =
    layout &&
    containedImageRect(
      layout.containerW,
      layout.containerH,
      layout.naturalW,
      layout.naturalH,
    );

  const updateHoverFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const container = imageContainerRef.current;
      if (!container || !layout || faces.length === 0) {
        setHoveredFaceId(null);
        return;
      }
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        setHoveredFaceId(null);
        return;
      }
      // Map through CSS transform (translate + uniform scale): screen AABB ↔ layout box.
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
    [faces, layout],
  );

  const attachViewportRef = useCallback((el: HTMLDivElement | null) => {
    viewportRef.current = el;
    wheelCleanupRef.current?.();
    wheelCleanupRef.current = null;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Dialog/scroll-lock timing can defer portal mount; ref callback ensures we always attach.
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = e.clientX - cx;
      const my = e.clientY - cy;

      // Prefer vertical delta; fall back to horizontal (shift-trackpad / sideways scroll).
      let delta =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0 && e.deltaZ !== 0) delta = e.deltaZ;

      // Pinch-to-zoom often uses ctrl+wheel with small deltas; still zoom if any axis moves.
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
  }, []);

  useEffect(() => {
    return () => {
      wheelCleanupRef.current?.();
      wheelCleanupRef.current = null;
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateHoverFromClientPoint(e.clientX, e.clientY);
    if (!dragging.current) return;
    const { x, y, tx: stx, ty: sty } = dragStart.current;
    setTx(stx + (e.clientX - x));
    setTy(sty + (e.clientY - y));
  };

  const onPointerLeave = () => {
    setHoveredFaceId(null);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  if (!asset) return null;

  const src = assetOriginalPath(asset.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        <div
          ref={attachViewportRef}
          className={cn(
            "relative flex min-h-0 flex-1 cursor-grab items-center justify-center overflow-hidden bg-black/90",
            "active:cursor-grabbing",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
          style={{ touchAction: "none" }}
        >
          <div
            className="will-change-transform"
            style={{
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            }}
          >
            <div ref={imageContainerRef} className="relative inline-block max-h-full max-w-full">
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
                    const label =
                      face.person?.name?.trim() || "Unnamed";
                    const hovered = hoveredFaceId === face.id;
                    return (
                      <div
                        key={face.id}
                        className={cn(
                          "absolute box-border transition-colors duration-150",
                          hovered
                            ? "border-2 border-primary shadow-[0_0_0_1px_rgba(0,0,0,0.85)]"
                            : "border border-white/45",
                        )}
                        style={{
                          left: `${box.left}%`,
                          top: `${box.top}%`,
                          width: `${box.width}%`,
                          height: `${box.height}%`,
                        }}
                      >
                        {hovered ? (
                          <span
                            className="absolute bottom-full left-1/2 z-20 mb-0.5 max-w-[min(12rem,40vw)] -translate-x-1/2 truncate rounded-sm bg-background/95 px-1.5 py-0.5 text-center text-[10px] font-medium leading-tight text-foreground shadow-md"
                          >
                            {label}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <p className="shrink-0 border-t border-border/60 bg-popover px-3 py-2 text-xs text-muted-foreground">
          Wheel: zoom · drag: pan · hover: face names · any key or ✕: close
        </p>
      </DialogContent>
    </Dialog>
  );
}
