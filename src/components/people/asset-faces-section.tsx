"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { assetPeopleForWheel } from "@/lib/people/asset-faces";
import { FaceWheelSvg } from "@/components/people/face-wheel-svg";
import { PersonIdentityEditor } from "@/components/people/person-identity-editor";
import type { ImmichAsset, ImmichPerson } from "@/lib/immich/types";

type AssetFacesSectionProps = {
  assetId: string | null;
  contextPerson: ImmichPerson | null;
  cataloguePeople?: ImmichPerson[];
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonMerged?: (removedPersonId: string, survivor: ImmichPerson) => void;
  onSwitchContextPerson: (personId: string) => void;
};

type LoadedProps = {
  assetId: string;
  contextPerson: ImmichPerson;
  cataloguePeople: ImmichPerson[];
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonMerged?: (removedPersonId: string, survivor: ImmichPerson) => void;
  onSwitchContextPerson: (personId: string) => void;
};

function AssetFacesLoaded({
  assetId,
  contextPerson,
  cataloguePeople,
  onPersonUpdated,
  onPersonMerged,
  onSwitchContextPerson,
}: LoadedProps) {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<ImmichPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wheelEngaged, setWheelEngaged] = useState(false);
  const [wheelFocusPerson, setWheelFocusPerson] = useState<ImmichPerson | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/immich/assets/${assetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ImmichAsset | null) => {
        if (cancelled) return;
        setPeople(data?.people ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPeople([]);
        setError("Could not load faces for this photo.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const layout = useMemo(
    () => assetPeopleForWheel(contextPerson.id, people, contextPerson),
    [contextPerson, people],
  );

  const editorPerson = useMemo(() => {
    if (layout.mode === "wheel" && wheelEngaged && wheelFocusPerson) {
      return wheelFocusPerson;
    }
    if (layout.mode === "sole") return layout.person;
    if (layout.mode === "wheel") return layout.context;
    return contextPerson;
  }, [layout, wheelEngaged, wheelFocusPerson, contextPerson]);

  const onFocusPerson = useCallback((person: ImmichPerson) => {
    setWheelFocusPerson(person);
  }, []);

  const onWheelEngage = useCallback(() => {
    setWheelEngaged(true);
  }, []);

  const spokeIds = layout.mode === "wheel"
    ? layout.spokes.map((s) => s.id).join(",")
    : "";

  if (loading) {
    return (
      <p className="border-t border-border pt-3 text-sm text-muted-foreground">
        Loading faces…
      </p>
    );
  }

  if (error) {
    return (
      <p className="border-t border-border pt-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (layout.mode === "none") {
    return (
      <p className="border-t border-border pt-3 text-sm text-muted-foreground">
        No faces detected on this photo. Name people in Immich if needed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      {layout.mode === "wheel" ? (
        <FaceWheelSvg
          key={`${layout.context.id}-${spokeIds}`}
          context={layout.context}
          spokes={layout.spokes}
          onFocusPerson={onFocusPerson}
          onWheelEngage={onWheelEngage}
          onSwitchContextPerson={onSwitchContextPerson}
        />
      ) : null}
      {editorPerson ? (
        <PersonIdentityEditor
          key={editorPerson.id}
          person={editorPerson}
          variant="panel"
          cataloguePeople={cataloguePeople}
          onPersonUpdated={onPersonUpdated}
          onPersonMerged={onPersonMerged}
        />
      ) : null}
    </div>
  );
}

export function AssetFacesSection({
  assetId,
  contextPerson,
  cataloguePeople = [],
  onPersonUpdated,
  onPersonMerged,
  onSwitchContextPerson,
}: AssetFacesSectionProps) {
  if (!assetId || !contextPerson) return null;

  return (
    <AssetFacesLoaded
      key={assetId}
      assetId={assetId}
      contextPerson={contextPerson}
      cataloguePeople={cataloguePeople}
      onPersonUpdated={onPersonUpdated}
      onPersonMerged={onPersonMerged}
      onSwitchContextPerson={onSwitchContextPerson}
    />
  );
}
