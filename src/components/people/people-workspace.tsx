"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { DetectionContextPanel } from "@/components/people/detection-context-panel";
import { FacesCatalog } from "@/components/people/faces-catalog";
import { PersonCatalogGrid } from "@/components/people/person-catalog-grid";
import { PersonContextPanel } from "@/components/people/person-context-panel";
import { DuplicatesNameCatalog } from "@/components/people/duplicates-name-catalog";
import { cn } from "@/lib/utils";
import type { ShellContext } from "@/lib/server/shell-context";
import type { ImmichAsset, ImmichPerson } from "@/lib/immich/types";
import {
  bucketPeople,
  peoplePageHref,
  personIsNamed,
  type PeopleTab,
} from "@/lib/people/bucket-people";
import type { UnassignedFace } from "@/lib/people/unassigned-face";
import type { PersonRhsPanelView } from "@/lib/people/person-rhs-panel";
import {
  readStoredPersonRhsPanelView,
  writeStoredPersonRhsPanelView,
} from "@/lib/people/person-rhs-panel";
import { groupPeopleBySimilarNames } from "@/lib/people/name-similarity-groups";

type Selection =
  | { kind: "person"; id: string }
  | { kind: "face"; faceId: string; assetId: string };

type PeopleWorkspaceProps = {
  shell: ShellContext;
  initialPeople: ImmichPerson[];
  initialSharedAlbumIds: string[];
  loadError: string | null;
  initialTab?: PeopleTab;
  initialSelectedPersonId?: string | null;
};

function sortPeople(people: ImmichPerson[]): ImmichPerson[] {
  return [...people].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", undefined, {
      sensitivity: "base",
    }),
  );
}

function upsertPerson(
  people: ImmichPerson[],
  person: ImmichPerson,
): ImmichPerson[] {
  return sortPeople([...people.filter((p) => p.id !== person.id), person]);
}

export function PeopleWorkspace({
  shell,
  initialPeople,
  initialSharedAlbumIds,
  loadError,
  initialTab = "people",
  initialSelectedPersonId = null,
}: PeopleWorkspaceProps) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [sharedAlbumIds, setSharedAlbumIds] = useState(initialSharedAlbumIds);
  const [tab, setTab] = useState<PeopleTab>(initialTab);
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectionRef = useRef<Selection | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [assets, setAssets] = useState<ImmichAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [detections, setDetections] = useState<UnassignedFace[]>([]);
  const [detectionsLoading, setDetectionsLoading] = useState(
    initialTab === "faces",
  );
  const [detectionsError, setDetectionsError] = useState<string | null>(null);
  const detectionsRequested = useRef(false);
  const mounted = useRef(true);
  const [personRhsPanelView, setPersonRhsPanelViewState] =
    useState<PersonRhsPanelView>("photos");

  const tabRef = useRef<PeopleTab>(initialTab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    const stored = readStoredPersonRhsPanelView();
    if (stored) {
      queueMicrotask(() => setPersonRhsPanelViewState(stored));
    }
  }, []);

  const setPersonRhsPanelView = useCallback((view: PersonRhsPanelView) => {
    setPersonRhsPanelViewState(view);
    writeStoredPersonRhsPanelView(view);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const { named, unnamed } = bucketPeople(people);
  const duplicateNameGroups = useMemo(
    () => groupPeopleBySimilarNames(people),
    [people],
  );
  const selectedPerson =
    selection?.kind === "person"
      ? (people.find((p) => p.id === selection.id) ?? null)
      : null;
  const selectedFace =
    selection?.kind === "face"
      ? (detections.find((face) => face.id === selection.faceId) ?? null)
      : null;

  const loadPersonAssets = useCallback((personId: string) => {
    setLoadingAssets(true);
    setAssets([]);
    fetch(`/api/immich/people/${personId}/assets`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            assets: ImmichAsset[];
            sharedAlbumIds: string[];
          } | null,
        ) => {
          if (data) {
            setAssets(data.assets);
            setSharedAlbumIds(data.sharedAlbumIds);
          }
          setLoadingAssets(false);
        },
      )
      .catch(() => {
        setAssets([]);
        setLoadingAssets(false);
      });
  }, []);

  const showPerson = useCallback(
    (personId: string, namedPerson: boolean) => {
      const stayOnDuplicates = tabRef.current === "duplicates";
      const nextTab: PeopleTab = stayOnDuplicates
        ? "duplicates"
        : namedPerson
          ? "people"
          : "faces";
      setTab(nextTab);
      setSelection({ kind: "person", id: personId });
      setPanelOpen(true);
      loadPersonAssets(personId);
      router.replace(peoplePageHref(nextTab, personId));
    },
    [loadPersonAssets, router],
  );

  const onSelectPerson = useCallback(
    (personId: string) => {
      const person = people.find((p) => p.id === personId);
      showPerson(personId, person ? personIsNamed(person) : true);
    },
    [people, showPerson],
  );

  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (!initialSelectedPersonId || deepLinkHandled.current || loadError) return;
    if (!people.some((p) => p.id === initialSelectedPersonId)) return;
    deepLinkHandled.current = true;
    startTransition(() => {
      onSelectPerson(initialSelectedPersonId);
    });
  }, [initialSelectedPersonId, loadError, onSelectPerson, people]);

  useEffect(() => {
    if (tab !== "faces" || detectionsRequested.current || loadError) return;
    detectionsRequested.current = true;
    setDetectionsLoading(true);
    fetch("/api/immich/faces/unassigned")
      .then(async (res) => {
        const data = (await res.json()) as {
          faces?: UnassignedFace[];
          message?: string;
        };
        if (!res.ok) throw new Error(data.message ?? "Failed to load faces");
        return data.faces ?? [];
      })
      .then((faces) => {
        if (mounted.current) setDetections(faces);
      })
      .catch((e: unknown) => {
        if (mounted.current) {
          setDetectionsError(
            e instanceof Error ? e.message : "Failed to load faces",
          );
        }
      })
      .finally(() => {
        if (mounted.current) setDetectionsLoading(false);
      });
  }, [tab, loadError]);

  const onPersonUpdated = useCallback(
    (updated: ImmichPerson) => {
      let moveToNamed: boolean | null = null;
      setPeople((prev) => {
        const previous = prev.find((p) => p.id === updated.id);
        if (previous && personIsNamed(previous) !== personIsNamed(updated)) {
          moveToNamed = personIsNamed(updated);
        }
        return upsertPerson(prev, updated);
      });
      if (moveToNamed !== null) showPerson(updated.id, moveToNamed);
    },
    [showPerson],
  );

  const onPersonMerged = useCallback(
    (removedPersonId: string, survivor: ImmichPerson) => {
      setPeople((prev) =>
        upsertPerson(
          prev.filter((p) => p.id !== removedPersonId),
          survivor,
        ),
      );
      showPerson(survivor.id, personIsNamed(survivor));
    },
    [showPerson],
  );

  const onPersonDeleted = useCallback(
    (personId: string) => {
      setPeople((prev) => prev.filter((p) => p.id !== personId));
      const sel = selectionRef.current;
      if (sel?.kind === "person" && sel.id === personId) {
        setSelection(null);
        setPanelOpen(false);
      }
      if (tabRef.current === "duplicates") {
        router.replace(peoplePageHref("duplicates", null));
      }
    },
    [router],
  );

  const onDetectionResolved = useCallback(
    (faceId: string, person: ImmichPerson) => {
      setDetections((prev) => prev.filter((face) => face.id !== faceId));
      setPeople((prev) => upsertPerson(prev, person));
      showPerson(person.id, personIsNamed(person));
    },
    [showPerson],
  );

  const onFaceUnlinkedFromPerson = useCallback((face: UnassignedFace) => {
    setDetections((prev) => {
      if (prev.some((f) => f.id === face.id)) return prev;
      return [face, ...prev];
    });
  }, []);

  const onFaceLinkedFromPerson = useCallback((face: UnassignedFace) => {
    setDetections((prev) => prev.filter((f) => f.id !== face.id));
  }, []);

  const onSelectFace = useCallback(
    (face: UnassignedFace) => {
      setSelection({ kind: "face", faceId: face.id, assetId: face.assetId });
      setPanelOpen(true);
      router.replace(peoplePageHref("faces", null));
    },
    [router],
  );

  const selectTab = useCallback(
    (next: PeopleTab) => {
      if (next === "faces" && !detectionsRequested.current) {
        setDetectionsLoading(true);
      }
      setTab(next);
      setSelection(null);
      setPanelOpen(false);
      router.replace(peoplePageHref(next, null));
    },
    [router],
  );

  const onOpenInExplore = useCallback(
    (assetId: string, albumId: string | null) => {
      const params = new URLSearchParams({ assetId });
      if (albumId) params.set("albumId", albumId);
      router.push(`/explore?${params.toString()}`);
    },
    [router],
  );

  const defaultAlbumId = sharedAlbumIds[0] ?? null;

  const panelContent =
    selection?.kind === "face" ? (
      <DetectionContextPanel
        face={selectedFace}
        cataloguePeople={people}
        onOpenInExplore={(assetId) => onOpenInExplore(assetId, defaultAlbumId)}
        onResolved={(person) => {
          if (selection.kind !== "face") return;
          onDetectionResolved(selection.faceId, person);
        }}
      />
    ) : (
      <PersonContextPanel
        person={selectedPerson}
        assets={assets}
        loadingAssets={loadingAssets}
        sharedAlbumIds={sharedAlbumIds}
        panelView={personRhsPanelView}
        onPanelViewChange={setPersonRhsPanelView}
        cataloguePeople={people}
        onOpenInExplore={onOpenInExplore}
        onPersonUpdated={onPersonUpdated}
        onPersonMerged={onPersonMerged}
        onSwitchContextPerson={onSelectPerson}
        onFaceUnlinkedFromPerson={onFaceUnlinkedFromPerson}
        onFaceLinkedFromPerson={onFaceLinkedFromPerson}
      />
    );

  const subtitle = loadError
    ? loadError
    : tab === "people"
      ? `${named.length} named`
      : tab === "duplicates"
        ? `${duplicateNameGroups.length} similar-name group${duplicateNameGroups.length === 1 ? "" : "s"}`
      : detectionsLoading
        ? "Loading faces…"
        : `${unnamed.length + detections.length} to name`;

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="People"
      headerSubtitle={subtitle}
      panelTitle="Person"
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      panelContent={panelContent}
    >
      {loadError ? (
        <p className="p-8 text-center text-sm text-destructive">{loadError}</p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="People catalogue"
            className="sticky top-0 z-10 flex gap-1.5 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm"
          >
            {(
              [
                ["people", "People"],
                ["faces", "Faces"],
                ["duplicates", "Duplicates"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => selectTab(id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                  tab === id
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "people" ? (
            <PersonCatalogGrid
              people={named}
              cataloguePeople={people}
              selectedId={selection?.kind === "person" ? selection.id : null}
              onSelect={onSelectPerson}
              onPersonUpdated={onPersonUpdated}
              onPersonMerged={onPersonMerged}
              emptyMessage="No named people yet. Name someone on the Faces tab."
            />
          ) : tab === "duplicates" ? (
            <DuplicatesNameCatalog
              groups={duplicateNameGroups}
              selectedId={
                selection?.kind === "person" ? selection.id : null
              }
              onSelectPerson={onSelectPerson}
              onPersonMerged={onPersonMerged}
              onPersonUpdated={onPersonUpdated}
              onPersonDeleted={onPersonDeleted}
              onFaceUnlinkedFromPerson={onFaceUnlinkedFromPerson}
            />
          ) : (
            <FacesCatalog
              clusters={unnamed}
              detections={detections}
              loadingDetections={detectionsLoading}
              detectionsError={detectionsError}
              cataloguePeople={people}
              selectedPersonId={
                selection?.kind === "person" ? selection.id : null
              }
              selectedFaceId={selection?.kind === "face" ? selection.faceId : null}
              onSelectPerson={onSelectPerson}
              onSelectFace={onSelectFace}
              onOpenFaceInExplore={(assetId) =>
                onOpenInExplore(assetId, defaultAlbumId)
              }
              onPersonUpdated={onPersonUpdated}
              onPersonMerged={onPersonMerged}
              onDetectionResolved={onDetectionResolved}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
