"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { containedImageRect } from "@/lib/people/face-box-layout";
import {
  clampCropToBounds,
  isFullFramePixels,
  rotatedBoundingBoxSize,
  type PixelRect,
} from "@/lib/images/rotated-bounds";

const HANDLE_PX = 8;
const MIN_DISPLAY_PX = 14;
const HANDLE_HIT = HANDLE_PX + 6;

type HandleId =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw"
  | "draw";

function pixelsToDisplay(
  crop: PixelRect,
  rw: number,
  rh: number,
  layoutW: number,
  layoutH: number,
): PixelRect {
  const sx = layoutW / rw;
  const sy = layoutH / rh;
  return {
    x: crop.x * sx,
    y: crop.y * sy,
    width: crop.width * sx,
    height: crop.height * sy,
  };
}

function normalizeDragRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  maxW: number,
  maxH: number,
): PixelRect {
  let x = Math.min(x0, x1);
  let y = Math.min(y0, y1);
  let width = Math.abs(x1 - x0);
  let height = Math.abs(y1 - y0);
  if (width < MIN_DISPLAY_PX) width = MIN_DISPLAY_PX;
  if (height < MIN_DISPLAY_PX) height = MIN_DISPLAY_PX;
  x = Math.max(0, Math.min(x, maxW - width));
  y = Math.max(0, Math.min(y, maxH - height));
  width = Math.min(width, maxW - x);
  height = Math.min(height, maxH - y);
  return { x, y, width, height };
}

function hitHandle(
  localX: number,
  localY: number,
  disp: PixelRect,
): HandleId | null {
  const { x, y, width, height } = disp;
  const onLeft = Math.abs(localX - x) <= HANDLE_HIT;
  const onRight = Math.abs(localX - (x + width)) <= HANDLE_HIT;
  const onTop = Math.abs(localY - y) <= HANDLE_HIT;
  const onBottom = Math.abs(localY - (y + height)) <= HANDLE_HIT;
  const insideX = localX >= x + HANDLE_HIT && localX <= x + width - HANDLE_HIT;
  const insideY = localY >= y + HANDLE_HIT && localY <= y + height - HANDLE_HIT;

  if (onTop && onLeft) return "nw";
  if (onTop && onRight) return "ne";
  if (onBottom && onLeft) return "sw";
  if (onBottom && onRight) return "se";
  if (onTop && localX >= x && localX <= x + width) return "n";
  if (onBottom && localX >= x && localX <= x + width) return "s";
  if (onLeft && localY >= y && localY <= y + height) return "w";
  if (onRight && localY >= y && localY <= y + height) return "e";
  if (insideX && insideY) return "move";
  return null;
}

function cursorForHandle(h: HandleId | null): string {
  if (!h || h === "draw") return "crosshair";
  if (h === "move") return "move";
  const map: Record<string, string> = {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
  };
  return map[h] ?? "crosshair";
}

function CropShade({
  layoutW,
  layoutH,
  crop,
}: {
  layoutW: number;
  layoutH: number;
  crop: PixelRect;
}) {
  const { x, y, width, height } = crop;
  const shade = "absolute bg-black/45 pointer-events-none";
  return (
    <>
      <div className={shade} style={{ left: 0, top: 0, width: layoutW, height: y }} />
      <div
        className={shade}
        style={{ left: 0, top: y + height, width: layoutW, height: layoutH - y - height }}
      />
      <div className={shade} style={{ left: 0, top: y, width: x, height }} />
      <div
        className={shade}
        style={{
          left: x + width,
          top: y,
          width: layoutW - x - width,
          height,
        }}
      />
    </>
  );
}

type EditImageCropProps = {
  imageUrl: string;
  naturalW: number;
  naturalH: number;
  rotationDeg: number;
  brightness: number;
  contrast: number;
  cropPixels: PixelRect;
  onCropPixelsChange: (next: PixelRect) => void;
  cropToolActive: boolean;
  /** Rendered above the image, inside the fitted image bounds (face overlays). */
  overlay?: (ctx: {
    layoutW: number;
    layoutH: number;
    rootRef: React.RefObject<HTMLDivElement | null>;
    layoutOffsetX: number;
    layoutOffsetY: number;
  }) => ReactNode;
};

export function EditImageCrop({
  imageUrl,
  naturalW,
  naturalH,
  rotationDeg,
  brightness,
  contrast,
  cropPixels,
  onCropPixelsChange,
  cropToolActive,
  overlay,
}: EditImageCropProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [hoverMode, setHoverMode] = useState<HandleId | null>(null);

  const { width: rw, height: rh } = useMemo(
    () => rotatedBoundingBoxSize(naturalW, naturalH, rotationDeg),
    [naturalW, naturalH, rotationDeg],
  );

  const layout = useMemo(() => {
    if (!containerSize.w || !containerSize.h) return null;
    const rect = containedImageRect(containerSize.w, containerSize.h, rw, rh);
    return { ...rect, rw, rh };
  }, [containerSize, rw, rh]);

  const scale = layout ? layout.width / rw : 1;
  const imgW = naturalW * scale;
  const imgH = naturalH * scale;

  const dragRef = useRef<{
    mode: HandleId;
    startLocal: { x: number; y: number };
    startCrop: PixelRect;
    dispAtStart: PixelRect;
  } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const displayCrop = layout
    ? pixelsToDisplay(cropPixels, rw, rh, layout.width, layout.height)
    : null;

  const commitDisplayRect = useCallback(
    (disp: PixelRect) => {
      if (!layout) return;
      const sx = rw / layout.width;
      const sy = rh / layout.height;
      onCropPixelsChange(
        clampCropToBounds(
          {
            x: disp.x * sx,
            y: disp.y * sy,
            width: disp.width * sx,
            height: disp.height * sy,
          },
          rw,
          rh,
        ),
      );
    },
    [layout, onCropPixelsChange, rh, rw],
  );

  const localFromClient = useCallback(
    (clientX: number, clientY: number) => {
      if (!layout || !rootRef.current) return null;
      const root = rootRef.current.getBoundingClientRect();
      const lx = clientX - root.left - layout.x;
      const ly = clientY - root.top - layout.y;
      return { lx, ly };
    },
    [layout],
  );

  const onAreaPointerDown = (e: React.PointerEvent) => {
    if (!cropToolActive || !layout || !displayCrop || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const local = localFromClient(e.clientX, e.clientY);
    if (!local) return;
    const { lx, ly } = local;
    if (lx < 0 || ly < 0 || lx > layout.width || ly > layout.height) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const atFull = isFullFramePixels(cropPixels, rw, rh);
    let mode = hitHandle(lx, ly, displayCrop);
    if (atFull && mode === "move") mode = "draw";
    if (!mode) mode = "draw";

    dragRef.current = {
      mode,
      startLocal: { x: lx, y: ly },
      startCrop: { ...cropPixels },
      dispAtStart: { ...displayCrop },
    };
  };

  const onAreaPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const local = localFromClient(e.clientX, e.clientY);
    if (!cropToolActive || !layout || !displayCrop || !local) return;

    if (!drag) {
      const atFull = isFullFramePixels(cropPixels, rw, rh);
      let h = hitHandle(local.lx, local.ly, displayCrop);
      if (atFull && h === "move") h = "draw";
      setHoverMode(h ?? "draw");
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { lx, ly } = local;
    const { mode, startLocal, dispAtStart } = drag;
    let nextDisp: PixelRect;

    if (mode === "draw") {
      nextDisp = normalizeDragRect(
        startLocal.x,
        startLocal.y,
        lx,
        ly,
        layout.width,
        layout.height,
      );
    } else if (mode === "move") {
      const dx = lx - startLocal.x;
      const dy = ly - startLocal.y;
      let x = dispAtStart.x + dx;
      let y = dispAtStart.y + dy;
      x = Math.max(0, Math.min(x, layout.width - dispAtStart.width));
      y = Math.max(0, Math.min(y, layout.height - dispAtStart.height));
      nextDisp = { ...dispAtStart, x, y };
    } else {
      let { x, y, width, height } = dispAtStart;
      const right = x + width;
      const bottom = y + height;
      if (mode.includes("n")) {
        y = Math.min(ly, bottom - MIN_DISPLAY_PX);
        height = bottom - y;
      }
      if (mode.includes("s")) {
        height = Math.max(MIN_DISPLAY_PX, ly - y);
      }
      if (mode.includes("w")) {
        x = Math.min(lx, right - MIN_DISPLAY_PX);
        width = right - x;
      }
      if (mode.includes("e")) {
        width = Math.max(MIN_DISPLAY_PX, lx - x);
      }
      nextDisp = normalizeDragRect(x, y, x + width, y + height, layout.width, layout.height);
    }

    commitDisplayRect(nextDisp);
  };

  const onAreaPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const customCrop =
    cropPixels.width < rw - 2 ||
    cropPixels.height < rh - 2 ||
    cropPixels.x > 1 ||
    cropPixels.y > 1;

  const showShade = customCrop || cropToolActive;

  const handlePositions =
    displayCrop && cropToolActive
      ? ([
          ["nw", displayCrop.x, displayCrop.y],
          ["n", displayCrop.x + displayCrop.width / 2, displayCrop.y],
          ["ne", displayCrop.x + displayCrop.width, displayCrop.y],
          ["w", displayCrop.x, displayCrop.y + displayCrop.height / 2],
          ["e", displayCrop.x + displayCrop.width, displayCrop.y + displayCrop.height / 2],
          ["sw", displayCrop.x, displayCrop.y + displayCrop.height],
          ["s", displayCrop.x + displayCrop.width / 2, displayCrop.y + displayCrop.height],
          ["se", displayCrop.x + displayCrop.width, displayCrop.y + displayCrop.height],
        ] as const)
      : [];

  return (
    <div ref={rootRef} className="absolute inset-0 min-h-0 w-full">
      {layout && displayCrop ? (
        <div
          className="absolute"
          style={{
            left: layout.x,
            top: layout.y,
            width: layout.width,
            height: layout.height,
          }}
        >
          <div className="relative h-full w-full overflow-hidden bg-black/20">
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: imgW,
                height: imgH,
                marginLeft: -imgW / 2,
                marginTop: -imgH / 2,
                transform: `rotate(${rotationDeg}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                className="block h-full w-full select-none"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                }}
              />
            </div>
          </div>

          {showShade ? (
            <CropShade
              layoutW={layout.width}
              layoutH={layout.height}
              crop={displayCrop}
            />
          ) : null}

          <div
            className={cn(
              "absolute border-2 border-white/90",
              cropToolActive ? "pointer-events-none" : "pointer-events-none",
            )}
            style={{
              left: displayCrop.x,
              top: displayCrop.y,
              width: displayCrop.width,
              height: displayCrop.height,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.75)",
            }}
          >
            {cropToolActive
              ? handlePositions.map(([id, hx, hy]) => (
                  <div
                    key={id}
                    className="absolute z-10 rounded-sm border border-black/60 bg-white shadow"
                    style={{
                      width: HANDLE_PX,
                      height: HANDLE_PX,
                      left: hx - displayCrop.x - HANDLE_PX / 2,
                      top: hy - displayCrop.y - HANDLE_PX / 2,
                    }}
                  />
                ))
              : null}
          </div>

          {cropToolActive ? (
            <div
              className="absolute inset-0 z-30 touch-none"
              style={{ cursor: cursorForHandle(dragRef.current?.mode ?? hoverMode) }}
              onPointerDown={onAreaPointerDown}
              onPointerMove={onAreaPointerMove}
              onPointerUp={onAreaPointerUp}
              onPointerCancel={onAreaPointerUp}
              onPointerLeave={() => {
                if (!dragRef.current) setHoverMode(null);
              }}
            />
          ) : null}

          {overlay && !cropToolActive
            ? overlay({
                layoutW: layout.width,
                layoutH: layout.height,
                rootRef,
                layoutOffsetX: layout.x,
                layoutOffsetY: layout.y,
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
