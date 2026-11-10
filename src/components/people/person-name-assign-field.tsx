"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonMergeSuggestionPanel } from "@/components/people/person-merge-suggestion";
import type { ImmichPerson } from "@/lib/immich/types";
import {
  fetchMergeSuggestionIfNeeded,
  type PersonMergeSuggestionRequest,
} from "@/lib/people/person-name-merge-check";
import { parsePeopleSearchResponse } from "@/lib/people/parse-people-search";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { cn } from "@/lib/utils";

type PersonNameAssignFieldProps = {
  faceId: string;
  assetId?: string;
  cataloguePeople?: ImmichPerson[];
  compact?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  error?: string | null;
  onError?: (message: string | null) => void;
  onCancel: () => void;
  onAssigned: (person: ImmichPerson) => void;
  inputStyle?: CSSProperties;
  className?: string;
};

function stubPerson(faceId: string): ImmichPerson {
  return {
    id: faceId,
    name: "",
    birthDate: null,
    thumbnailPath: "",
    isHidden: false,
  };
}

export function PersonNameAssignField({
  faceId,
  assetId,
  cataloguePeople = [],
  compact = false,
  inputRef: inputRefProp,
  disabled = false,
  error = null,
  onError,
  onCancel,
  onAssigned,
  inputStyle,
  className,
}: PersonNameAssignFieldProps) {
  const [name, setName] = useState("");
  const [candidates, setCandidates] = useState<ImmichPerson[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [mergePrompt, setMergePrompt] =
    useState<PersonMergeSuggestionRequest | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = inputRefProp ?? localInputRef;

  useEffect(() => {
    queueMicrotask(() => inputRef.current?.focus());
  }, [inputRef]);

  useEffect(
    () => () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
      }
    },
    [],
  );

  const searchPeople = useCallback((query: string) => {
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setCandidates([]);
      setListOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      fetch(
        `/api/immich/people/search?name=${encodeURIComponent(trimmed)}&withHidden=true`,
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const next = parsePeopleSearchResponse(data);
          setCandidates(next);
          setListOpen(next.length > 0);
        })
        .catch(() => {
          setCandidates([]);
          setListOpen(false);
        });
    }, 200);
  }, []);

  const putFace = useCallback(
    async (body: { name: string } | { personId: string }) => {
      const res = await fetch(`/api/immich/faces/${faceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ImmichPerson & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Save failed");
      return data;
    },
    [faceId],
  );

  const assignExisting = useCallback(
    async (personId: string) => {
      setSaving(true);
      onError?.(null);
      try {
        onAssigned(await putFace({ personId }));
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [onAssigned, onError, putFace],
  );

  const createNew = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    onError?.(null);
    try {
      onAssigned(await putFace({ name: trimmed }));
      setCreateOpen(false);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [name, onAssigned, onError, putFace]);

  const trimmed = name.trim();
  const exactMatch = candidates.find(
    (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  const submit = useCallback(async () => {
    if (saving || mergeLoading || mergePrompt) return;
    if (!trimmed) {
      onError?.("Enter a name");
      return;
    }
    if (selectedId) {
      await assignExisting(selectedId);
      return;
    }
    if (exactMatch) {
      await assignExisting(exactMatch.id);
      return;
    }
    setSaving(true);
    onError?.(null);
    try {
      const suggestion = await fetchMergeSuggestionIfNeeded(
        stubPerson(faceId),
        trimmed,
        cataloguePeople,
      );
      if (suggestion) {
        setMergePrompt({
          ...suggestion,
          editingImageUrl: assetId ? assetThumbnailPath(assetId) : undefined,
        });
        return;
      }
      setCreateOpen(true);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Name check failed");
    } finally {
      setSaving(false);
    }
  }, [
    assignExisting,
    assetId,
    cataloguePeople,
    exactMatch,
    faceId,
    mergeLoading,
    mergePrompt,
    onError,
    saving,
    selectedId,
    trimmed,
  ]);

  const onKeepSeparate = async () => {
    if (!mergePrompt) return;
    setMergeLoading(true);
    onError?.(null);
    try {
      onAssigned(await putFace({ name: mergePrompt.newName }));
      setMergePrompt(null);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Save failed");
    } finally {
      setMergeLoading(false);
    }
  };

  const onMergeSamePerson = async (targetPersonId: string) => {
    if (!mergePrompt) return;
    setMergeLoading(true);
    onError?.(null);
    try {
      onAssigned(await putFace({ personId: targetPersonId }));
      setMergePrompt(null);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Save failed");
    } finally {
      setMergeLoading(false);
    }
  };

  const inputClass = cn(
    "min-w-0 flex-1 rounded-sm border outline-none focus-visible:ring-1 focus-visible:ring-ring",
    compact
      ? "px-1 py-0 text-[10px] font-medium leading-tight"
      : "px-2 py-1.5 text-sm",
    error ? "border-destructive" : "border-input bg-background",
    className,
  );

  return (
    <>
      <div
        className="relative min-w-0 flex-1"
        data-person-name-assign-root
      >
        <input
          ref={inputRef}
          value={name}
          disabled={disabled || saving || mergeLoading}
          aria-label="Assign person to face"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          placeholder={compact ? "Name…" : "Search or new name"}
          style={inputStyle}
          className={inputClass}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setName(e.target.value);
            setSelectedId(null);
            onError?.(null);
            searchPeople(e.target.value);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setListOpen(false);
              setCreateOpen(false);
              setMergePrompt(null);
              onCancel();
            } else if (e.key === "ArrowDown" && candidates.length > 0) {
              e.preventDefault();
              setListOpen(true);
            }
          }}
          onBlur={() => {
            if (createOpen || mergePrompt) return;
            window.setTimeout(() => {
              const active = document.activeElement;
              if (active === inputRef.current) return;
              if (
                active instanceof HTMLElement &&
                active.closest("[data-person-name-assign-root]")
              ) {
                return;
              }
              setListOpen(false);
              onCancel();
            }, 0);
          }}
        />
        {listOpen && candidates.length > 0 ? (
          <ul
            className={cn(
              "absolute left-0 z-[90] max-h-28 overflow-y-auto rounded-md border border-border bg-popover text-foreground shadow-md",
              compact ? "top-full mt-0.5 min-w-[10rem] text-[10px]" : "top-full mt-1 w-full text-sm",
            )}
            role="listbox"
          >
            {candidates.map((p) => (
              <li key={p.id} role="option" aria-selected={selectedId === p.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-2 py-1 text-left hover:bg-muted",
                    selectedId === p.id && "bg-muted",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(p.id);
                    setName(p.name);
                    setListOpen(false);
                    void assignExisting(p.id);
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ConfirmDialog
        open={createOpen}
        elevated
        onOpenChange={setCreateOpen}
        title="Create new person?"
        description={`No existing person matches "${trimmed}". Create a new person and assign this face?`}
        confirmLabel="Create"
        loading={saving}
        onConfirm={() => void createNew()}
      />

      <Dialog
        open={mergePrompt != null}
        onOpenChange={(open) => {
          if (!open) setMergePrompt(null);
        }}
      >
        <DialogContent
          className="z-[100] max-w-md"
          overlayClassName="z-[100]"
        >
          <DialogTitle className="sr-only">Similar name found</DialogTitle>
          {mergePrompt ? (
            <PersonMergeSuggestionPanel
              request={mergePrompt}
              loading={mergeLoading}
              onDismiss={() => setMergePrompt(null)}
              onKeepSeparate={() => void onKeepSeparate()}
              onMergeSamePerson={(id) => void onMergeSamePerson(id)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
