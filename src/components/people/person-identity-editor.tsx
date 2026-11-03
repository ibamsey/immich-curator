"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { personThumbnailPath } from "@/lib/immich/person-thumbnail-path";
import { normalizePersonName } from "@/lib/people/person-name-format";
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
  onPersonUpdated: (person: ImmichPerson) => void;
};

type RowState = {
  name: string;
  birthDateDisplay: string;
  birthDateIso: string | null;
  saving: boolean;
  error: string | null;
};

const AUTOSAVE_MS = 700;

export function PersonIdentityEditor({
  person,
  variant = "panel",
  showFaceThumb = variant === "panel",
  onPersonUpdated,
}: PersonIdentityEditorProps) {
  const [state, setState] = useState<RowState>(() => ({
    name: person.name ?? "",
    birthDateDisplay: isoDateToDisplay(person.birthDate),
    birthDateIso: person.birthDate ?? null,
    saving: false,
    error: null,
  }));

  const saveGen = useRef(0);

  useEffect(() => {
    setState((s) => ({
      ...s,
      name: person.name ?? "",
      birthDateDisplay: isoDateToDisplay(person.birthDate),
      birthDateIso: person.birthDate ?? null,
      error: null,
    }));
  }, [person.id, person.name, person.birthDate]);

  const persist = useCallback(
    async (name: string, birthDateDisplay: string) => {
      const parsed = displayDateToIso(birthDateDisplay);
      if (parsed === "invalid") {
        setState((s) => ({
          ...s,
          error: "Use dd/mm/yyyy for date of birth",
        }));
        return false;
      }
      const birthDate = parsed;
      const serverName = person.name ?? "";
      const serverDob = person.birthDate ?? null;
      if (name === serverName && birthDate === serverDob) {
        return true;
      }

      const gen = ++saveGen.current;
      setState((s) => ({ ...s, saving: true, error: null }));
      try {
        const res = await fetch(`/api/immich/people/${person.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, birthDate }),
        });
        const data = (await res.json()) as ImmichPerson & { message?: string };
        if (!res.ok) {
          throw new Error(data.message ?? "Save failed");
        }
        if (gen !== saveGen.current) return true;
        onPersonUpdated(data);
        setState((s) => ({
          ...s,
          saving: false,
          name: data.name ?? "",
          birthDateDisplay: isoDateToDisplay(data.birthDate),
          birthDateIso: data.birthDate ?? null,
        }));
        return true;
      } catch (e) {
        if (gen !== saveGen.current) return false;
        setState((s) => ({
          ...s,
          saving: false,
          error: e instanceof Error ? e.message : "Save failed",
        }));
        return false;
      }
    },
    [onPersonUpdated, person.birthDate, person.id, person.name],
  );

  useEffect(() => {
    const parsed = displayDateToIso(state.birthDateDisplay);
    if (parsed === "invalid") return;

    const serverName = person.name ?? "";
    const serverDob = person.birthDate ?? null;
    if (state.name === serverName && parsed === serverDob) return;

    const timer = window.setTimeout(() => {
      void persist(state.name, state.birthDateDisplay);
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [
    state.name,
    state.birthDateDisplay,
    person.name,
    person.birthDate,
    persist,
  ]);

  const onNormalizeName = () => {
    const normalized = normalizePersonName(state.name);
    setState((s) => ({ ...s, name: normalized, error: null }));
    void persist(normalized, state.birthDateDisplay);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        variant === "panel" && "rounded-md border border-border bg-muted/30 p-3",
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
        <div className="relative mt-1">
          <input
            className={nameFieldClassName}
            value={state.name}
            onChange={(e) =>
              setState((s) => ({ ...s, name: e.target.value, error: null }))
            }
          />
          <button
            type="button"
            onClick={onNormalizeName}
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
      {state.saving ? (
        <p className="text-xs text-muted-foreground">Saving…</p>
      ) : null}
    </div>
  );
}
