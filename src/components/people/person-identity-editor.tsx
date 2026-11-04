"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { personThumbnailPath } from "@/lib/immich/person-thumbnail-path";
import { normalizePersonName } from "@/lib/people/person-name-format";
import { fetchMergeSuggestionIfNeeded } from "@/lib/people/person-name-merge-check";
import { PersonMergeSuggestionPanel } from "@/components/people/person-merge-suggestion";
import type { PersonMergeSuggestionRequest } from "@/lib/people/person-name-merge-check";
import {
  DobInput,
  displayDateToIso,
  isoDateToDisplay,
} from "@/components/people/dob-input";
import type { ImmichPerson } from "@/lib/immich/types";

const nameFieldClassName =
  "w-full rounded-md border border-input bg-background py-1.5 pl-2 pr-9 text-sm disabled:opacity-60";

type PersonIdentityEditorProps = {
  person: ImmichPerson;
  variant?: "catalog" | "panel";
  showFaceThumb?: boolean;
  cataloguePeople?: ImmichPerson[];
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonMerged?: (removedPersonId: string, survivor: ImmichPerson) => void;
};

type RowState = {
  name: string;
  birthDateDisplay: string;
  birthDateIso: string | null;
  saving: boolean;
  error: string | null;
};

const NAME_COMMIT_MS = 700;
const DOB_AUTOSAVE_MS = 700;

export function PersonIdentityEditor({
  person,
  variant = "panel",
  showFaceThumb = variant === "panel",
  cataloguePeople = [],
  onPersonUpdated,
  onPersonMerged,
}: PersonIdentityEditorProps) {
  const [state, setState] = useState<RowState>(() => ({
    name: person.name ?? "",
    birthDateDisplay: isoDateToDisplay(person.birthDate),
    birthDateIso: person.birthDate ?? null,
    saving: false,
    error: null,
  }));
  const [mergePrompt, setMergePrompt] =
    useState<PersonMergeSuggestionRequest | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [nameCommitting, setNameCommitting] = useState(false);

  const saveGen = useRef(0);
  const pendingBirthRef = useRef(state.birthDateDisplay);
  const personRef = useRef(person);
  const nameRef = useRef(state.name);
  const dobDisplayRef = useRef(state.birthDateDisplay);
  personRef.current = person;
  nameRef.current = state.name;
  dobDisplayRef.current = state.birthDateDisplay;

  useEffect(() => {
    setState((s) => ({
      ...s,
      name: person.name ?? "",
      birthDateDisplay: isoDateToDisplay(person.birthDate),
      birthDateIso: person.birthDate ?? null,
      error: null,
    }));
    setMergePrompt(null);
    setNameCommitting(false);
  }, [person.id]);

  useEffect(() => {
    if (mergePrompt) return;
    setState((s) => ({
      ...s,
      name: person.name ?? "",
      birthDateDisplay: isoDateToDisplay(person.birthDate),
      birthDateIso: person.birthDate ?? null,
    }));
  }, [person.name, person.birthDate, mergePrompt]);

  const putPerson = useCallback(
    async (personId: string, name: string, birthDate: string | null) => {
      const gen = ++saveGen.current;
      setState((s) => ({ ...s, saving: true, error: null }));
      try {
        const res = await fetch(`/api/immich/people/${personId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, birthDate }),
        });
        const data = (await res.json()) as ImmichPerson & { message?: string };
        if (!res.ok) {
          throw new Error(data.message ?? "Save failed");
        }
        if (gen !== saveGen.current) return data;
        onPersonUpdated(data);
        setState((s) => ({
          ...s,
          saving: false,
          name: data.name ?? "",
          birthDateDisplay: isoDateToDisplay(data.birthDate),
          birthDateIso: data.birthDate ?? null,
        }));
        return data;
      } catch (e) {
        if (gen !== saveGen.current) return null;
        setState((s) => ({
          ...s,
          saving: false,
          error: e instanceof Error ? e.message : "Save failed",
        }));
        return null;
      }
    },
    [onPersonUpdated],
  );

  const resolveBirthDate = useCallback(
    (birthDateDisplay: string): string | null | undefined => {
      const parsed = displayDateToIso(birthDateDisplay);
      if (parsed === "invalid") {
        setState((s) => ({
          ...s,
          error: "Use dd/mm/yyyy for date of birth",
        }));
        return undefined;
      }
      return parsed;
    },
    [],
  );

  const commitNameChange = useCallback(async (nameOverride?: string) => {
    if (mergePrompt || mergeLoading || nameCommitting) return;

    const p = personRef.current;
    const birthDateDisplay = dobDisplayRef.current;
    const birthDate = resolveBirthDate(birthDateDisplay);
    if (birthDate === undefined) return;

    const trimmed = (nameOverride ?? nameRef.current).trim();
    const serverName = (p.name ?? "").trim();
    if (trimmed === serverName) return;

    setNameCommitting(true);
    setState((s) => ({ ...s, error: null }));
    pendingBirthRef.current = birthDateDisplay;

    try {
      if (trimmed) {
        const suggestion = await fetchMergeSuggestionIfNeeded(
          p,
          trimmed,
          cataloguePeople,
        );
        if (suggestion) {
          setMergePrompt(suggestion);
          return;
        }
      }
      await putPerson(p.id, trimmed, birthDate);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : "Name check failed",
      }));
    } finally {
      setNameCommitting(false);
    }
  }, [
    cataloguePeople,
    mergeLoading,
    mergePrompt,
    nameCommitting,
    putPerson,
    resolveBirthDate,
  ]);

  useEffect(() => {
    if (mergePrompt) return;

    const parsed = displayDateToIso(state.birthDateDisplay);
    if (parsed === "invalid") return;

    const serverName = (person.name ?? "").trim();
    const serverDob = person.birthDate ?? null;
    const nameChanged = state.name.trim() !== serverName;
    const dobChanged = parsed !== serverDob;
    if (!nameChanged && !dobChanged) return;

    const timer = window.setTimeout(() => {
      if (nameChanged) {
        void commitNameChange();
      } else if (dobChanged) {
        void putPerson(person.id, person.name ?? "", parsed);
      }
    }, nameChanged ? NAME_COMMIT_MS : DOB_AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [
    state.birthDateDisplay,
    state.name,
    person.id,
    person.name,
    person.birthDate,
    putPerson,
    mergePrompt,
    commitNameChange,
  ]);

  const onNormalizeName = () => {
    const normalized = normalizePersonName(state.name);
    setState((s) => ({ ...s, name: normalized, error: null }));
    void commitNameChange(normalized);
  };

  const dismissMergePrompt = () => {
    setMergePrompt(null);
    setState((s) => ({
      ...s,
      name: person.name ?? "",
      error: null,
    }));
  };

  const onKeepSeparate = async () => {
    if (!mergePrompt) return;
    const birthDate = resolveBirthDate(pendingBirthRef.current);
    if (birthDate === undefined) return;
    setMergeLoading(true);
    const ok = await putPerson(
      person.id,
      mergePrompt.newName,
      birthDate,
    );
    setMergeLoading(false);
    if (ok) setMergePrompt(null);
  };

  const onMergeSamePerson = async (targetPersonId: string) => {
    if (!mergePrompt) return;
    const birthDate = resolveBirthDate(pendingBirthRef.current);
    if (birthDate === undefined) return;

    setMergeLoading(true);
    setState((s) => ({ ...s, error: null }));
    try {
      const res = await fetch(
        `/api/immich/people/${targetPersonId}/merge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourcePersonIds: [person.id],
            name: mergePrompt.newName,
            birthDate,
          }),
        },
      );
      const data = (await res.json()) as {
        person?: ImmichPerson;
        message?: string;
      };
      if (!res.ok || !data.person) {
        throw new Error(data.message ?? "Merge failed");
      }
      onPersonMerged?.(person.id, data.person);
      onPersonUpdated(data.person);
      setMergePrompt(null);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : "Merge failed",
      }));
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        variant === "panel" &&
          "rounded-md border border-border bg-muted/30 p-3",
      )}
    >
      {showFaceThumb ? (
        <div className="flex items-center gap-2">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personThumbnailPath(person.id)}
              alt=""
              className="size-full object-cover"
            />
          </div>
          <p className="text-sm font-medium">{person.name || "Unnamed"}</p>
        </div>
      ) : null}
        <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Name
          <span className="ml-1 font-normal normal-case text-muted-foreground">
            (Tab or Enter to save)
          </span>
          <div className="relative mt-1">
          <input
            className={nameFieldClassName}
            value={state.name}
            disabled={mergeLoading}
            onChange={(e) =>
              setState((s) => ({ ...s, name: e.target.value, error: null }))
            }
            onBlur={() => void commitNameChange()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commitNameChange();
              }
            }}
          />
          <button
            type="button"
            onClick={onNormalizeName}
            disabled={mergeLoading}
            className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            title="Trim and capitalize name"
            aria-label="Normalize name formatting"
          >
            <Wrench className="size-4" />
          </button>
        </div>
      </label>
      <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Date of birth
        <DobInput
          valueIso={state.birthDateIso}
          displayValue={state.birthDateDisplay}
          onDisplayChange={(birthDateDisplay) =>
            setState((s) => ({
              ...s,
              birthDateDisplay,
              birthDateIso:
                birthDateDisplay.trim() === "" ? null : s.birthDateIso,
              error: null,
            }))
          }
          onIsoFromPicker={(iso) =>
            setState((s) => ({
              ...s,
              birthDateIso: iso,
              birthDateDisplay: isoDateToDisplay(iso),
              error: null,
            }))
          }
        />
      </label>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
      {state.saving || nameCommitting ? (
        <p className="text-xs text-muted-foreground">Saving…</p>
      ) : null}

      {mergePrompt ? (
        <PersonMergeSuggestionPanel
          key={`${mergePrompt.editingPerson.id}:${mergePrompt.newName}:${mergePrompt.primaryMatch.id}`}
          request={mergePrompt}
          loading={mergeLoading}
          onDismiss={dismissMergePrompt}
          onKeepSeparate={() => void onKeepSeparate()}
          onMergeSamePerson={(id) => void onMergeSamePerson(id)}
        />
      ) : null}
    </div>
  );
}
