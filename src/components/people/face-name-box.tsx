"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onEditingChange?: (editing: boolean) => void;
  onSaved: (faceId: string, person: ImmichPerson) => void;
};

function fieldWidth(text: string): string {
  const ch = Math.min(28, Math.max(text.length + 1, 8));
  return `max(${MIN_FIELD}, ${ch}ch)`;
}

function chipPlacement(style?: CSSProperties): string {
  const top = typeof style?.top === "string" ? parseFloat(style.top) : 0;
  const left = typeof style?.left === "string" ? parseFloat(style.left) : 0;
  return cn(
    "absolute z-10",
    top >= 20 ? "bottom-full mb-0.5" : "top-0",
    left > 50 ? "right-0" : "left-0",
  );
}

export function FaceNameBox({
  faceId,
  personId,
  name,
  className,
  style,
  showLabel = true,
  onMouseEnter,
  onMouseLeave,
  onEditingChange,
  onSaved,
}: FaceNameBoxProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clickTimer = useRef<number | null>(null);
  const editingRef = useRef(false);
  const personIdRef = useRef(personId);
  personIdRef.current = personId;

  const label = name.trim() || "Unnamed";
  const placement = chipPlacement(style);

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

  const openPerson = () => {
    const id = personIdRef.current;
    if (!id) return;
    clearClickTimer();
    setEditingState(false);
    router.push(`/people?personId=${encodeURIComponent(id)}`);
  };

  const cancel = () => {
    setDraft(name);
    setError(null);
    setEditingState(false);
  };

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

  return (
    <div
      className={cn("pointer-events-auto absolute cursor-pointer", className)}
      style={style}
      title={
        personId
          ? "Click to edit name. Double-click to open in People."
          : "Click to name this face."
      }
      aria-label={
        personId
          ? `${label}. Click to edit, double-click to open in People.`
          : `${label}. Click to name this face.`
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        clearClickTimer();
        clickTimer.current = window.setTimeout(() => {
          clickTimer.current = null;
          setDraft(name);
          setError(null);
          setEditingState(true);
        }, CLICK_DELAY_MS);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openPerson();
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          disabled={saving}
          aria-label={`Edit name for ${label}`}
          title={error ?? "Enter to save, Esc to cancel"}
          style={{ width: fieldWidth(draft || label) }}
          className={cn(
            chipClass,
            "pointer-events-auto border outline-none focus-visible:ring-1 focus-visible:ring-ring",
            error ? "border-destructive" : "border-input",
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => {
            if (!editingRef.current) return;
            void save();
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
      ) : showLabel ? (
        <span
          className={cn(chipClass, "pointer-events-none truncate")}
          style={{ width: fieldWidth(label) }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
