import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { tryGetCuratorEnv } from "@/lib/config/curator-config.server";
import {
  parseExifResolution,
  type ImageResolution,
} from "@/lib/assets/physical-size";

const execFileAsync = promisify(execFile);

/** Bounded in-memory cache (no `Date.now()` — avoids Next.js prerender / use cache instability). */
const MAX_CACHE_ENTRIES = 500;
const cache = new Map<string, ImageResolution | null>();
const cacheOrder: string[] = [];

function cacheSet(assetId: string, value: ImageResolution | null) {
  if (cache.has(assetId)) {
    cache.set(assetId, value);
    return;
  }
  cache.set(assetId, value);
  cacheOrder.push(assetId);
  while (cacheOrder.length > MAX_CACHE_ENTRIES) {
    const oldest = cacheOrder.shift();
    if (oldest) cache.delete(oldest);
  }
}

function libraryPathFromImmichOriginal(
  originalPath: string,
  libraryRoot: string,
): string | null {
  const prefix = "/data/library/";
  if (!originalPath.startsWith(prefix)) return null;
  const relative = originalPath.slice(prefix.length);
  return path.join(libraryRoot, relative);
}

function parseExiftoolJson(stdout: string): ImageResolution | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return null;
  }
  const row = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const xRaw = r.XResolution ?? r.xResolution;
  const yRaw = r.YResolution ?? r.yResolution;
  const unitRaw = r.ResolutionUnit ?? r.resolutionUnit;

  const parseRational = (v: unknown): number | undefined => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const [num, den] = v.split("/").map(Number);
      if (num && den) return num / den;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const unit =
    typeof unitRaw === "number"
      ? unitRaw
      : typeof unitRaw === "string"
        ? Number(unitRaw)
        : undefined;

  const dpi = parseExifResolution(
    parseRational(xRaw),
    parseRational(yRaw),
    unit,
  );
  if (!dpi) return null;
  return { ...dpi, source: "exif" };
}

export async function readImageResolutionFromFile(
  assetId: string,
  originalPath: string | undefined,
): Promise<ImageResolution | null> {
  if (cache.has(assetId)) {
    return cache.get(assetId) ?? null;
  }

  const env = tryGetCuratorEnv();
  const libraryRoot = env?.immichLibraryRoot;
  if (!libraryRoot || !originalPath) {
    cacheSet(assetId, null);
    return null;
  }

  const filePath = libraryPathFromImmichOriginal(originalPath, libraryRoot);
  if (!filePath) {
    cacheSet(assetId, null);
    return null;
  }

  try {
    const { stdout } = await execFileAsync(
      "exiftool",
      [
        "-json",
        "-n",
        "-XResolution",
        "-YResolution",
        "-ResolutionUnit",
        filePath,
      ],
      { timeout: 15_000, maxBuffer: 256 * 1024 },
    );
    const resolution = parseExiftoolJson(stdout);
    cacheSet(assetId, resolution);
    return resolution;
  } catch {
    cacheSet(assetId, null);
    return null;
  }
}
