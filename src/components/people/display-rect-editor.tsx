"use client";

import { useCallback, useRef, useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DisplayRect } from "@/lib/people/face-box-layout";

const HANDLE_PX = 8;
export const MIN_FACE_DISPLAY_PX = 14;
const MIN_DISPLAY_PX = MIN_FACE_DISPLAY_PX;
const HANDLE_HIT = HANDLE_PX + 6;

export function displayRectIsUsable(rect: DisplayRect): boolean {
  return rect.width >= MIN_DISPLAY_PX && rect.height >= MIN_DISPLAY_PX;
}

/**
 * Map viewport coordinates to layout-local pixels when the editor root is
 * visually scaled (e.g. CSS transform on an ancestor). `layoutW`/`layoutH` are
 * the coordinate system used for `rect` and handles; `bounds` is from
 * getBoundingClientRect() (post-transform painted size).
 */
export function clientPointToLayoutLocal(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
  layoutW: number,
  layoutH: number,
): { lx: number; ly: number } | null {
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const lx = (clientX - bounds.left) * (layoutW / bounds.width);
  const ly = (clientY - bounds.top) * (layoutH / bounds.height);
  return { lx, ly };
}

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

function normalizeDragRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  maxW: number,
  maxH: number,
): DisplayRect {
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

export function hitHandle(
  layoutX: number,
  layoutY: number,
  disp: DisplayRect,
): HandleId | null {
  const { x, y, width, height } = disp;
  const onLeft = Math.abs(layoutX - x) <= HANDLE_HIT;
  const onRight = Math.abs(layoutX - (x + width)) <= HANDLE_HIT;
  const onTop = Math.abs(layoutY - y) <= HANDLE_HIT;
  const onBottom = Math.abs(layoutY - (y + height)) <= HANDLE_HIT;
  const insideX =
    layoutX >= x + HANDLE_HIT && layoutX <= x + width - HANDLE_HIT;
  const insideY =
    layoutY >= y + HANDLE_HIT && layoutY <= y + height - HANDLE_HIT;

  if (onTop && onLeft) return "nw";
  if (onTop && onRight) return "ne";
  if (onBottom && onLeft) return "sw";
  if (onBottom && onRight) return "se";
  if (onTop && layoutX >= x && layoutX <= x + width) return "n";
  if (onBottom && layoutX >= x && layoutX <= x + width) return "s";
  if (onLeft && layoutY >= y && layoutY <= y + height) return "w";
  if (onRight && layoutY >= y && layoutY <= y + height) return "e";
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

type DisplayRectEditorProps = {
  layoutW: number;
  layoutH: number;
  rect: DisplayRect;
  onRectChange: (next: DisplayRect) => void;
  active: boolean;
  mode: "edit" | "draw";
  className?: string;
  onSave?: () => void;
  onCancel?: () => void;
  saveDisabled?: boolean;
};

export function DisplayRectEditor({
  layoutW,
  layoutH,
  rect,
  onRectChange,
  active,
  mode,
  className,
  onSave,
  onCancel,
  saveDisabled = false,
}: DisplayRectEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hoverMode, setHoverMode] = useState<HandleId | null>(null);
  const dragRef = useRef<{
    mode: HandleId;
    startLocal: { x: number; y: number };
    dispAtStart: DisplayRect;
  } | null>(null);

  const localFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const root = rootRef.current;
      if (!root) return null;
      return clientPointToLayoutLocal(
        clientX,
        clientY,
        root.getBoundingClientRect(),
        layoutW,
        layoutH,
      );
    },
    [layoutW, layoutH],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!active || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const local = localFromClient(e.clientX, e.clientY);
    if (!local) return;
    const { lx, ly } = local;
    if (lx < 0 || ly < 0 || lx > layoutW || ly > layoutH) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (mode === "draw") {
      dragRef.current = {
        mode: "draw",
        startLocal: { x: lx, y: ly },
        dispAtStart: { ...rect },
      };
      return;
    }

    const handleMode = hitHandle(lx, ly, rect);
    if (!handleMode) return;

    dragRef.current = {
      mode: handleMode,
      startLocal: { x: lx, y: ly },
      dispAtStart: { ...rect },
    };
    setHoverMode(handleMode);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!active) return;

    const local = localFromClient(e.clientX, e.clientY);
    if (!local) return;
    const { lx, ly } = local;
    const drag = dragRef.current;

    if (!drag) {
      const h =
        mode === "draw" ? "draw" : hitHandle(lx, ly, rect);
      setHoverMode(h);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { mode: dragMode, startLocal, dispAtStart } = drag;
    let next: DisplayRect;

    if (dragMode === "draw") {
      next = normalizeDragRect(
        startLocal.x,
        startLocal.y,
        lx,
        ly,
        layoutW,
        layoutH,
      );
    } else if (dragMode === "move") {
      const dx = lx - startLocal.x;
      const dy = ly - startLocal.y;
      let x = dispAtStart.x + dx;
      let y = dispAtStart.y + dy;
      x = Math.max(0, Math.min(x, layoutW - dispAtStart.width));
      y = Math.max(0, Math.min(y, layoutH - dispAtStart.height));
      next = { ...dispAtStart, x, y };
    } else {
      let { x, y, width, height } = dispAtStart;
      const right = x + width;
      const bottom = y + height;
      if (dragMode.includes("n")) {
        y = Math.min(ly, bottom - MIN_DISPLAY_PX);
        height = bottom - y;
      }
      if (dragMode.includes("s")) {
        height = Math.max(MIN_DISPLAY_PX, ly - y);
      }
      if (dragMode.includes("w")) {
        x = Math.min(lx, right - MIN_DISPLAY_PX);
        width = right - x;
      }
      if (dragMode.includes("e")) {
        width = Math.max(MIN_DISPLAY_PX, lx - x);
      }
      next = normalizeDragRect(x, y, x + width, y + height, layoutW, layoutH);
    }

    onRectChange(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handlePositions = [
    ["nw", rect.x, rect.y],
    ["n", rect.x + rect.width / 2, rect.y],
    ["ne", rect.x + rect.width, rect.y],
    ["w", rect.x, rect.y + rect.height / 2],
    ["e", rect.x + rect.width, rect.y + rect.height / 2],
    ["sw", rect.x, rect.y + rect.height],
    ["s", rect.x + rect.width / 2, rect.y + rect.height],
    ["se", rect.x + rect.width, rect.y + rect.height],
  ] as const;

  if (!active) return null;

  const activeCursor = cursorForHandle(dragRef.current?.mode ?? hoverMode);
  const showRectChrome = displayRectIsUsable(rect);

  const TOOLBAR_H = 28;
  const TOOLBAR_W = 56;
  const toolbarTop = Math.max(0, rect.y - TOOLBAR_H - 4);
  const toolbarLeft = Math.min(
    Math.max(0, rect.x + rect.width - TOOLBAR_W),
    layoutW - TOOLBAR_W,
  );

  return (
    <div
      ref={rootRef}
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {showRectChrome ? (
        <div
          className="pointer-events-none absolute border-2 border-primary shadow-[0_0_0_1px_rgba(0,0,0,0.75)]"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : mode === "draw" ? (
        <p className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-xs text-white/80 drop-shadow">
          Drag on the image to draw the face box
        </p>
      ) : null}
      {mode === "edit"
        ? handlePositions.map(([id, hx, hy]) => (
            <div
              key={id}
              className="pointer-events-none absolute z-10 rounded-sm border border-black/60 bg-white shadow"
              style={{
                width: HANDLE_PX,
                height: HANDLE_PX,
                left: hx - HANDLE_PX / 2,
                top: hy - HANDLE_PX / 2,
              }}
            />
          ))
        : null}
      {(mode === "edit" || mode === "draw") && onSave && onCancel ? (
        <div
          className="pointer-events-auto absolute z-30 flex gap-0.5"
          style={{
            left: showRectChrome ? toolbarLeft : Math.max(0, layoutW - TOOLBAR_W),
            top: showRectChrome ? toolbarTop : 4,
          }}
        >
          <Button
            type="button"
            size="icon-xs"
            variant="default"
            className="size-7"
            disabled={saveDisabled || (mode === "draw" && !showRectChrome)}
            aria-label={
              mode === "draw" ? "Continue to link person" : "Save face rectangle"
            }
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave();
            }}
          >
            <CheckIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            className="size-7 bg-background"
            disabled={saveDisabled}
            aria-label={
              mode === "draw" ? "Cancel new face" : "Cancel face rectangle edit"
            }
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      ) : null}
      <div
        className="pointer-events-auto absolute inset-0 z-20 touch-none"
        style={{ cursor: activeCursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          if (!dragRef.current) setHoverMode(null);
        }}
      />
    </div>
  );
}
