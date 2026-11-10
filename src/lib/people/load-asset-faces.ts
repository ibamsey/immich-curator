import type { ImmichAssetFace, ImmichPerson } from "@/lib/immich/types";

type Waiter = {
  resolve: (faces: ImmichAssetFace[]) => void;
  reject: (error: Error) => void;
};

const cache = new Map<string, ImmichAssetFace[]>();
const inflight = new Map<string, Waiter[]>();
const renameListeners = new Set<(personId: string, name: string) => void>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function withPersonName(
  faces: ImmichAssetFace[],
  personId: string,
  name: string,
): ImmichAssetFace[] {
  return faces.map((face) =>
    face.person?.id === personId
      ? { ...face, person: { ...face.person, name } }
      : face,
  );
}

export function patchCachedPersonName(personId: string, name: string) {
  for (const [assetId, faces] of cache) {
    const next = withPersonName(faces, personId, name);
    if (next !== faces && next.some((face, i) => face !== faces[i])) {
      cache.set(assetId, next);
    }
  }
  for (const listener of renameListeners) listener(personId, name);
}

export function withFacePerson(
  faces: ImmichAssetFace[],
  faceId: string,
  person: ImmichPerson,
): ImmichAssetFace[] {
  const named = faces.map((face) =>
    face.id === faceId ? { ...face, person } : face,
  );
  return withPersonName(named, person.id, person.name);
}

export function patchCachedFacePerson(
  assetId: string,
  faceId: string,
  person: ImmichPerson,
) {
  const faces = cache.get(assetId);
  if (!faces) return;
  cache.set(assetId, withFacePerson(faces, faceId, person));
  for (const listener of renameListeners) listener(person.id, person.name);
}

/** After `DELETE /api/immich/faces/:id` unlinks the face from its person. */
export function patchCachedFaceUnlinked(assetId: string, faceId: string) {
  const faces = cache.get(assetId);
  if (!faces) return;
  const next = faces.map((face) =>
    face.id === faceId ? { ...face, person: null } : face,
  );
  cache.set(assetId, next);
}

export function subscribePersonRenames(
  listener: (personId: string, name: string) => void,
): () => void {
  renameListeners.add(listener);
  return () => renameListeners.delete(listener);
}

const BATCH_SIZE = 48;

/** Drop cached faces for an asset (e.g. after geometry edit). */
export function invalidateAssetFaces(assetId: string) {
  cache.delete(assetId);
}

export function loadAssetFaces(assetId: string): Promise<ImmichAssetFace[]> {
  const cached = cache.get(assetId);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const waiters = inflight.get(assetId) ?? [];
    waiters.push({ resolve, reject });
    inflight.set(assetId, waiters);
    if (flushTimer == null) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        void flush();
      }, 40);
    }
  });
}

async function flush() {
  const ids = [...inflight.keys()].slice(0, BATCH_SIZE);
  const batch = new Map<string, Waiter[]>();
  for (const id of ids) {
    const waiters = inflight.get(id);
    if (!waiters) continue;
    batch.set(id, waiters);
    inflight.delete(id);
  }

  if (inflight.size > 0 && flushTimer == null) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flush();
    }, 0);
  }

  if (batch.size === 0) return;

  try {
    const res = await fetch("/api/immich/assets/faces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...batch.keys()] }),
    });
    if (!res.ok) throw new Error("Failed to load faces");
    const data = (await res.json()) as {
      facesByAssetId?: Record<string, ImmichAssetFace[]>;
    };
    const map = data.facesByAssetId ?? {};
    for (const [id, waiters] of batch) {
      const faces = map[id] ?? [];
      cache.set(id, faces);
      for (const waiter of waiters) waiter.resolve(faces);
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error("Failed to load faces");
    for (const waiters of batch.values()) {
      for (const waiter of waiters) waiter.reject(error);
    }
  }
}
