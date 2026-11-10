import { assetOriginalPath } from "@/lib/immich/asset-original-path";
import { loadAssetFaces } from "@/lib/people/load-asset-faces";

const loaded = new Set<string>();
const queued = new Set<string>();
const queue: string[] = [];
const CONCURRENCY = 3;
let active = 0;

function pump() {
  while (active < CONCURRENCY && queue.length > 0) {
    const id = queue.shift()!;
    active += 1;
    const src = assetOriginalPath(id);
    const img = new Image();
    const done = () => {
      active -= 1;
      pump();
    };
    img.onload = done;
    img.onerror = done;
    img.src = src;
  }
}

/**
 * Queue browser fetches for original images (HTTP cache warms the modal).
 * Face metadata is warmed via the batched `loadAssetFaces` cache.
 */
export function preloadAssetOriginals(assetIds: string[]) {
  for (const id of assetIds) {
    if (!id || loaded.has(id) || queued.has(id)) continue;
    queued.add(id);
    loaded.add(id);
    queue.push(id);
    void loadAssetFaces(id).catch(() => {});
  }
  pump();
}
