"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Link2OffIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PersonNameAssignField } from "@/components/people/person-name-assign-field";
import { cn } from "@/lib/utils";
import type { ImmichPerson } from "@/lib/immich/types";

const CLICK_DELAY_MS = 250;
const MIN_FIELD = "8rem";

type FaceNameBoxProps = {
  faceId: string;
  personId: string | null;
  name: string;
  className?: string;
  style?: CSSProperties;
  showLabel?: boolean;
  /** Keep name chip visible without hover (e.g. preview modal). */
  alwaysShowLabel?: boolean;
  /** Shown when unlinked and name empty (default Unnamed). */
  unlinkedPlaceholder?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onEditingChange?: (editing: boolean) => void;
  onSaved: (faceId: string, person: ImmichPerson) => void;
  /** After unlinking; omitted if callers do not need to refresh face lists. */
  onUnlinked?: (faceId: string) => void;
  /** When set, skip nested confirm dialog (e.g. inside another modal). */
  onRequestUnlink?: (faceId: string) => void;
  /** Draw border on exact face bounds; hit slop does not shift the outline (modal). */
  accurateFaceOutline?: boolean;
  /** Hide the face rectangle border (e.g. while geometry editor is active). */
  suppressOutline?: boolean;
  /** Paint this box (and name chip) above overlapping siblings. */
  stackFront?: boolean;
  /** Linked face rectangle selection toggled by click. */
  onSelectedChange?: (selected: boolean) => void;
  /** Image zoom scale on an ancestor; inversely scales name chip and tools. */
  imageZoomScale?: number;
  /** Modal face rectangle stroke (with {@link screenConstantFaceOutlineStyle}). */
  faceOutlineEmphasis?: FaceOutlineEmphasis;
  /** Asset id for merge UI when naming an unlinked face in the modal. */
  assetId?: string;
  /** Shared-album catalogue for similar-name merge checks. */
  cataloguePeople?: ImmichPerson[];
  /** Parent-owned editing face id; when it changes away from this face, exit edit. */
  syncEditingFaceId?: string | null;
  /** Optional face-rectangle adjust (preview modal). */
  rectangleAdjust?: {
    enabled: boolean;
    disabled?: boolean;
    editing: boolean;
    saving?: boolean;
    blockedByOther?: boolean;
    onStart: () => void;
    onSave?: () => void;
    onCancel?: () => void;
  };
};

function fieldWidth(text: string): string {
  const ch = Math.min(28, Math.max(text.length + 1, 8));
  return `max(${MIN_FIELD}, ${ch}ch)`;
}

function chipPlacement(style?: CSSProperties): string {
  const top = typeof style?.top === "string" ? parseFloat(style.top) : 0;
  const left = typeof style?.left === "string" ? parseFloat(style.left) : 0;
  return cn(
    "absolute z-[60]",
    top >= 20 ? "bottom-full mb-0.5" : "top-0",
    left > 50 ? "right-0" : "left-0",
  );
}

/** Expand the interactive box so the name chip (drawn outside the face %) still counts as “inside”. */
function hitSlopClass(style?: CSSProperties): string {
  const top = typeof style?.top === "string" ? parseFloat(style.top) : 0;
  if (top >= 20) return "-mt-5 pt-5";
  return "-mb-4 pb-4";
}

/** Keep label chrome at constant screen size when an ancestor scales the image. */
function labelChromeInverseZoomStyle(
  imageZoom: number,
  style?: CSSProperties,
): CSSProperties | undefined {
  if (imageZoom <= 0 || Math.abs(imageZoom - 1) < 0.0001) return undefined;
  const inv = 1 / imageZoom;
  const top = typeof style?.top === "string" ? parseFloat(style.top) : 0;
  const left = typeof style?.left === "string" ? parseFloat(style.left) : 0;
  const originY = top >= 20 ? "100%" : "0%";
  const originX = left > 50 ? "100%" : "0%";
  return {
    transform: `scale(${inv})`,
    transformOrigin: `${originX} ${originY}`,
  };
}

function penInverseZoomStyle(imageZoom: number): CSSProperties | undefined {
  if (imageZoom <= 0 || Math.abs(imageZoom - 1) < 0.0001) return undefined;
  return {
    transform: `scale(${1 / imageZoom})`,
    transformOrigin: "0% 100%",
  };
}

export type FaceOutlineEmphasis = "primary" | "subtle";

/** Face bounds still scale with the image; stroke width stays ~constant on screen. */
export function screenConstantFaceOutlineStyle(
  imageZoom: number,
  emphasis: FaceOutlineEmphasis,
  opts: {
    suppressOutline: boolean;
    selected: boolean;
    editing: boolean;
    isLinked: boolean;
  },
): CSSProperties {
  if (opts.suppressOutline) {
    return {
      borderColor: "transparent",
      borderWidth: 0,
      boxShadow: "none",
    };
  }
  const z = imageZoom > 0 ? imageZoom : 1;
  const borderW = (emphasis === "primary" ? 2 : 1) / z;
  const style: CSSProperties = {
    boxSizing: "border-box",
    borderStyle: "solid",
    borderWidth: borderW,
    borderColor:
      emphasis === "primary"
        ? "hsl(var(--primary))"
        : "rgba(255,255,255,0.45)",
  };
  const shadows: string[] = [];
  if (emphasis === "primary") {
    shadows.push(`0 0 0 ${1 / z}px rgba(0,0,0,0.85)`);
  }
  if (opts.isLinked && opts.selected && !opts.editing) {
    const ringW = 2 / z;
    const gap = 1 / z;
    shadows.push(`0 0 0 ${ringW}px hsl(var(--primary))`);
    shadows.push(
      `0 0 0 ${ringW + gap}px hsl(var(--background) / 0.8)`,
    );
  }
  if (shadows.length > 0) {
    style.boxShadow = shadows.join(", ");
  }
  return style;
}

export function FaceNameBox({
  faceId,
  personId,
  name,
  className,
  style,
  showLabel = true,
  alwaysShowLabel = false,
  unlinkedPlaceholder = "Unnamed",
  onMouseEnter,
  onMouseLeave,
  onEditingChange,
  onSaved,
  onUnlinked,
  onRequestUnlink,
  accurateFaceOutline = false,
  suppressOutline = false,
  stackFront = false,
  onSelectedChange,
  imageZoomScale = 1,
  faceOutlineEmphasis = "subtle",
  assetId,
  cataloguePeople = [],
  syncEditingFaceId,
  rectangleAdjust,
}: FaceNameBoxProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  /** Linked face: pointer is over the rectangle (rollover shows chip). */
  const [hoverInside, setHoverInside] = useState(false);
  /** Linked face: rectangle was clicked to select (sticky until toggle / unlink / navigate). */
  const [selected, setSelected] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const clickTimer = useRef<number | null>(null);
  const editingRef = useRef(false);
  const personIdRef = useRef(personId);
  const blurSaveTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    personIdRef.current = personId;
  }, [personId]);

  useEffect(() => {
    if (!editingRef.current) {
      setDraft(name);
    }
  }, [name]);

  const label = name.trim() || unlinkedPlaceholder;
  const placement = chipPlacement(style);
  const hitSlop = hitSlopClass(style);
  const isLinked = Boolean(personId);
  const chipZoomStyle = labelChromeInverseZoomStyle(imageZoomScale, style);
  const penZoomStyle = penInverseZoomStyle(imageZoomScale);
  const accurateOutlineStyle = accurateFaceOutline
    ? screenConstantFaceOutlineStyle(imageZoomScale, faceOutlineEmphasis, {
        suppressOutline,
        selected,
        editing,
        isLinked,
      })
    : undefined;

  const setEditingState = (next: boolean) => {
    editingRef.current = next;
    setEditing(next);
    onEditingChange?.(next);
  };

  const clearClickTimer = () => {
    if (clickTimer.current == null) return;
    window.clearTimeout(clickTimer.current);
    clickTimer.current = null;
  };

  useEffect(() => clearClickTimer, []);

  useEffect(() => {
    return () => {
      if (blurSaveTimer.current != null) {
        window.clearTimeout(blurSaveTimer.current);
        blurSaveTimer.current = null;
      }
    };
  }, []);

  /** Unlinked: focus input when entering edit from rectangle click. */
  useEffect(() => {
    if (editing && !isLinked) {
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [editing, isLinked]);

  const openPerson = () => {
    const id = personIdRef.current;
    if (!id) return;
    clearClickTimer();
    setSelected(false);
    onSelectedChange?.(false);
    setEditingState(false);
    router.push(`/people?personId=${encodeURIComponent(id)}`);
  };

  const runUnlink = async () => {
    if (!personId) return;
    setUnlinking(true);
    try {
      const res = await fetch(`/api/immich/faces/${faceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Unlink failed");
      }
      clearClickTimer();
      setSelected(false);
      onSelectedChange?.(false);
      setEditingState(false);
      setUnlinkOpen(false);
      onUnlinked?.(faceId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlink failed");
    } finally {
      setUnlinking(false);
    }
  };

  const cancel = () => {
    setDraft(name);
    setError(null);
    setEditingState(false);
    if (isLinked) {
      setSelected(false);
      onSelectedChange?.(false);
    }
  };

  useEffect(() => {
    if (!editing || syncEditingFaceId === undefined) return;
    if (syncEditingFaceId !== faceId) {
      cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cancel is stable for this face session
  }, [syncEditingFaceId, faceId, editing]);

  const save = async () => {
    if (saving) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Enter a name");
      return;
    }
    if (personId && trimmed === name.trim()) {
      setEditingState(false);
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        personId
          ? `/api/immich/people/${personId}`
          : `/api/immich/faces/${faceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        },
      );
      const data = (await res.json()) as ImmichPerson & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Save failed");
      onSaved(faceId, data);
      setEditingState(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const chipClass = cn(
    placement,
    "max-w-56 rounded-sm bg-background/95 px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight text-foreground shadow-sm",
  );

  /** Selected or editing: keep chip visible even if parent `showLabel` went false on hover-out. */
  const rectangleEditing = Boolean(rectangleAdjust?.editing);
  const showLinkedChrome =
    isLinked &&
    (alwaysShowLabel ||
      selected ||
      editing ||
      rectangleEditing ||
      (showLabel && hoverInside));
  const showUnlink = showLinkedChrome;
  const showChipContents = isLinked
    ? showLinkedChrome
    : alwaysShowLabel || showLabel || editing;

  const rectanglePen =
    isLinked &&
    rectangleAdjust?.enabled &&
    !rectangleEditing &&
    !rectangleAdjust.blockedByOther ? (
      <Button
        type="button"
        size="icon-xs"
        variant="secondary"
        disabled={rectangleAdjust.disabled}
        className="pointer-events-auto absolute bottom-0 left-0 z-[70] size-7 -translate-x-1/4 translate-y-1/4 shadow-md"
        style={penZoomStyle}
        title={
          rectangleAdjust.disabled
            ? "Finish the current action before adjusting face boxes"
            : "Edit face rectangle"
        }
        aria-label="Edit face rectangle"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          rectangleAdjust.onStart();
        }}
      >
        <PencilIcon className="size-4" />
      </Button>
    ) : null;

  const unlinkButton = showUnlink ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="size-5 shrink-0 text-muted-foreground hover:text-destructive"
      title="Unlink face from person"
      aria-label="Unlink face from person"
      disabled={unlinking}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        clearClickTimer();
        setError(null);
        if (onRequestUnlink) {
          onRequestUnlink(faceId);
          return;
        }
        setUnlinkOpen(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Link2OffIcon className="size-3.5" />
    </Button>
  ) : null;

  const handleRootClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    clearClickTimer();

    if (isLinked) {
      if (!editing) {
        setSelected((s) => {
          const next = !s;
          onSelectedChange?.(next);
          return next;
        });
        setDraft(name);
        setError(null);
      }
      return;
    }

    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      setDraft(name);
      setError(null);
      setEditingState(true);
    }, CLICK_DELAY_MS);
  };

  const handleRootDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    clearClickTimer();
    if (isLinked) {
      openPerson();
    }
  };

  const outlineClass = cn(
    "box-border",
    suppressOutline
      ? "border-transparent"
      : className,
    isLinked &&
      selected &&
      !editing &&
      !suppressOutline &&
      "ring-2 ring-primary ring-offset-1 ring-offset-background/80",
  );

  return (
    <>
      <div
        data-face-name-root
        className={cn(
          "absolute",
          stackFront ? "z-[45]" : "z-[10]",
          accurateFaceOutline ? "" : hitSlop,
          !accurateFaceOutline && outlineClass,
        )}
        style={style}
      >
        {accurateFaceOutline ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 transition-colors duration-150"
            style={accurateOutlineStyle}
            aria-hidden
          />
        ) : null}
        {accurateFaceOutline ? (
          <div className="pointer-events-none absolute inset-0 z-[15]">
            {rectanglePen}
          </div>
        ) : null}
        <div
          className={cn(
            "absolute inset-0 z-10 cursor-pointer",
            accurateFaceOutline ? hitSlop : "inset-0",
            rectangleEditing ? "pointer-events-none" : "pointer-events-auto",
          )}
          title={
            isLinked
              ? "Hover or select to show name. Click name to edit. Double-click to open in People."
              : "Click to name this face."
          }
          aria-label={
            isLinked
              ? `${label}. Hover or click rectangle to select; click name to edit.`
              : `${label}. Click to name this face.`
          }
          aria-pressed={isLinked ? selected || editing : undefined}
          onMouseEnter={() => {
            setHoverInside(true);
            onMouseEnter?.();
          }}
          onMouseLeave={() => {
            setHoverInside(false);
            onMouseLeave?.();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleRootClick}
          onDoubleClick={handleRootDoubleClick}
        >
        {!accurateFaceOutline ? rectanglePen : null}
        {editing ? (
          <div
            className={cn(
              chipClass,
              "flex items-center gap-0.5 pointer-events-auto",
            )}
            style={chipZoomStyle}
          >
            {unlinkButton}
            {isLinked ? (
              <input
                ref={inputRef}
                autoFocus
                value={draft}
                disabled={saving}
                aria-label={`Edit name for ${label}`}
                title={error ?? "Enter to save, Esc to cancel"}
                style={{ width: fieldWidth(draft || label) }}
                className={cn(
                  "min-w-0 max-w-[min(14rem,56vw)] flex-1 rounded-sm border px-1 py-0 text-[10px] font-medium leading-tight outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  error ? "border-destructive" : "border-input bg-background",
                )}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                onFocus={(e) => {
                  if (blurSaveTimer.current != null) {
                    window.clearTimeout(blurSaveTimer.current);
                    blurSaveTimer.current = null;
                  }
                  e.currentTarget.select();
                }}
                onBlur={() => {
                  if (!editingRef.current) return;
                  if (blurSaveTimer.current != null) {
                    window.clearTimeout(blurSaveTimer.current);
                  }
                  blurSaveTimer.current = window.setTimeout(() => {
                    blurSaveTimer.current = null;
                    if (!editingRef.current) return;
                    void save();
                  }, 0);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void save();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancel();
                  }
                }}
              />
            ) : (
              <PersonNameAssignField
                faceId={faceId}
                assetId={assetId}
                cataloguePeople={cataloguePeople}
                compact
                inputRef={inputRef}
                disabled={saving}
                error={error}
                onError={setError}
                onCancel={cancel}
                inputStyle={{ width: fieldWidth(draft || label || "Name") }}
                className="max-w-[min(14rem,56vw)]"
                onAssigned={(person) => {
                  onSaved(faceId, person);
                  setEditingState(false);
                  setError(null);
                }}
              />
            )}
          </div>
        ) : showChipContents ? (
          <div
            className={cn(
              chipClass,
              "flex items-center gap-0.5 pointer-events-auto",
            )}
            style={chipZoomStyle}
          >
            {unlinkButton}
            <button
              type="button"
              className={cn(
                "min-w-0 max-w-[min(14rem,56vw)] flex-1 cursor-pointer truncate rounded-sm px-0.5 text-left hover:bg-muted/80",
                isLinked ? "pointer-events-auto" : "pointer-events-none",
              )}
              tabIndex={isLinked ? 0 : -1}
              title={isLinked ? "Edit name" : undefined}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearClickTimer();
                if (!isLinked) return;
                setDraft(name);
                setError(null);
                setEditingState(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {label}
            </button>
          </div>
        ) : null}
        </div>
      </div>

      {onRequestUnlink ? null : (
        <ConfirmDialog
          open={unlinkOpen}
          onOpenChange={setUnlinkOpen}
          title="Unlink this face?"
          description="This removes the face from the linked person in Immich. You can assign a name again afterward."
          confirmLabel="Unlink"
          confirmVariant="destructive"
          loading={unlinking}
          onConfirm={runUnlink}
        />
      )}
    </>
  );
}
