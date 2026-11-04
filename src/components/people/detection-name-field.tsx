"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { PersonMergeSuggestionPanel } from "@/components/people/person-merge-suggestion";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import type { ImmichPerson } from "@/lib/immich/types";
import {
  fetchMergeSuggestionIfNeeded,
  type PersonMergeSuggestionRequest,
} from "@/lib/people/person-name-merge-check";
import { normalizePersonName } from "@/lib/people/person-name-format";

const NAME_COMMIT_MS = 700;

const nameFieldClassName =
  "w-full rounded-md border border-input bg-background py-1.5 pl-2 pr-9 text-sm disabled:opacity-60";

type DetectionNameFieldProps = {
  faceId: string;
  assetId: string;
  cataloguePeople: ImmichPerson[];
  onResolved: (person: ImmichPerson) => void;
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

export function DetectionNameField({
  faceId,
  assetId,
  cataloguePeople,
  onResolved,
}: DetectionNameFieldProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergePrompt, setMergePrompt] =
    useState<PersonMergeSuggestionRequest | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const commitLock = useRef(false);

  const putFace = useCallback(async (
    body: { name: string } | { personId: string },
  ): Promise<ImmichPerson> => {
    const res = await fetch(`/api/immich/faces/${faceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as ImmichPerson & { message?: string };
    if (!res.ok) throw new Error(data.message ?? "Save failed");
    return data;
  }, [faceId]);

  const commit = useCallback(async (raw: string) => {
    if (commitLock.current || mergePrompt) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    commitLock.current = true;
    setSaving(true);
    setError(null);
    try {
      const suggestion = await fetchMergeSuggestionIfNeeded(
        stubPerson(faceId),
        trimmed,
        cataloguePeople,
      );
      if (suggestion) {
        setMergePrompt({
          ...suggestion,
          editingImageUrl: assetThumbnailPath(assetId),
        });
        return;
      }
      onResolved(await putFace({ name: trimmed }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      commitLock.current = false;
      setSaving(false);
    }
  }, [assetId, cataloguePeople, faceId, mergePrompt, onResolved, putFace]);

  useEffect(() => {
    if (mergePrompt || !name.trim()) return;
    const timer = window.setTimeout(() => {
      void commit(name);
    }, NAME_COMMIT_MS);
    return () => window.clearTimeout(timer);
  }, [commit, mergePrompt, name]);

  const onKeepSeparate = async () => {
    if (!mergePrompt) return;
    setMergeLoading(true);
    setError(null);
    try {
      onResolved(await putFace({ name: mergePrompt.newName }));
      setMergePrompt(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setMergeLoading(false);
    }
  };

  const onMerge = async (personId: string) => {
    if (!mergePrompt) return;
    setMergeLoading(true);
    setError(null);
    try {
      onResolved(await putFace({ personId }));
      setMergePrompt(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col gap-2"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Name
        <span className="ml-1 font-normal normal-case text-muted-foreground">
          (Tab or Enter to save)
        </span>
        <div className="relative mt-1">
          <input
            className={nameFieldClassName}
            value={name}
            disabled={mergeLoading}
            aria-label="Name this face"
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onBlur={() => void commit(name)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commit(name);
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const normalized = normalizePersonName(name);
              setName(normalized);
              void commit(normalized);
            }}
            disabled={mergeLoading}
            className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            title="Trim and capitalize name"
            aria-label="Normalize name formatting"
          >
            <Wrench className="size-4" />
          </button>
        </div>
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {saving || mergeLoading ? (
        <p className="text-xs text-muted-foreground">Saving…</p>
      ) : null}
      {mergePrompt ? (
        <PersonMergeSuggestionPanel
          request={mergePrompt}
          loading={mergeLoading}
          onDismiss={() => {
            setMergePrompt(null);
            setName("");
          }}
          onKeepSeparate={() => void onKeepSeparate()}
          onMergeSamePerson={(id) => void onMerge(id)}
        />
      ) : null}
    </div>
  );
}
