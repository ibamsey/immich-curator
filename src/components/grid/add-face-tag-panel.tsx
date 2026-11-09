"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ImmichPerson } from "@/lib/immich/types";
import { cn } from "@/lib/utils";

type AddFaceTagPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onBack?: () => void;
  onTagged: (person: ImmichPerson) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  error: string | null;
  setError: (msg: string | null) => void;
};

function parsePeople(data: unknown): ImmichPerson[] {
  if (Array.isArray(data)) return data as ImmichPerson[];
  if (data && typeof data === "object" && "people" in data) {
    const people = (data as { people?: unknown }).people;
    if (Array.isArray(people)) return people as ImmichPerson[];
  }
  return [];
}

export function AddFaceTagPanel({
  open,
  onOpenChange,
  onCancel,
  onBack,
  onTagged,
  saving,
  setSaving,
  error,
  setError,
}: AddFaceTagPanelProps) {
  const [name, setName] = useState("");
  const [candidates, setCandidates] = useState<ImmichPerson[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setCandidates([]);
      setSelectedId(null);
      setError(null);
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open, setError]);

  const searchPeople = useCallback((query: string) => {
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setCandidates([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      fetch(
        `/api/immich/people/search?name=${encodeURIComponent(query.trim())}&withHidden=true`,
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setCandidates(parsePeople(data)))
        .catch(() => setCandidates([]));
    }, 200);
  }, []);

  const trimmed = name.trim();
  const exactMatch = candidates.find(
    (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  const runAssignExisting = async (personId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/immich/people/${personId}`);
      const person = (await res.json()) as ImmichPerson & { message?: string };
      if (!res.ok) throw new Error(person.message ?? "Could not load person");
      onTagged(person);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const runCreateAndTag = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/immich/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const person = (await res.json()) as ImmichPerson & { message?: string };
      if (!res.ok) throw new Error(person.message ?? "Could not create person");
      onTagged(person);
      onOpenChange(false);
      setCreateOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const onSave = () => {
    if (!trimmed) {
      setError("Enter a name");
      return;
    }
    if (selectedId) {
      void runAssignExisting(selectedId);
      return;
    }
    if (exactMatch) {
      void runAssignExisting(exactMatch.id);
      return;
    }
    setCreateOpen(true);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="pointer-events-auto absolute inset-x-0 bottom-3 z-[70] mx-auto w-[min(22rem,calc(100%-1.5rem))] rounded-lg border border-border bg-popover p-3 shadow-lg"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-foreground">
          Link new face to person
        </p>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Search for someone or enter a new name to create a person.
        </p>
        <input
          ref={inputRef}
          value={name}
          disabled={saving}
          placeholder="Person name"
          className={cn(
            "mb-2 w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
            error ? "border-destructive" : "border-input",
          )}
          onChange={(e) => {
            setName(e.target.value);
            setSelectedId(null);
            setError(null);
            searchPeople(e.target.value);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              onSave();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
        {candidates.length > 0 ? (
          <ul className="mb-2 max-h-32 overflow-y-auto rounded-md border border-border/60 text-sm">
            {candidates.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-2 py-1 text-left hover:bg-muted",
                    selectedId === p.id && "bg-muted",
                  )}
                  onClick={() => {
                    setSelectedId(p.id);
                    setName(p.name);
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? (
          <p className="mb-2 text-xs text-destructive">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          {onBack ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={saving}
              className="mr-auto"
              onClick={onBack}
            >
              Back
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={saving || !trimmed} onClick={onSave}>
            Save face
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={createOpen}
        elevated
        onOpenChange={setCreateOpen}
        title="Create new person?"
        description={`No existing person matches "${trimmed}". Create a new person and tag this face?`}
        confirmLabel="Create"
        loading={saving}
        onConfirm={() => void runCreateAndTag()}
      />
    </>
  );
}
