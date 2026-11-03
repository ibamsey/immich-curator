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

type CacheEntry = { value: ImageResolution | null; expires: number };

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

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
  const cached = cache.get(assetId);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const env = tryGetCuratorEnv();
  const libraryRoot = env?.immichLibraryRoot;
  if (!libraryRoot || !originalPath) {
    cache.set(assetId, { value: null, expires: Date.now() + CACHE_TTL_MS });
    return null;
  }

  const filePath = libraryPathFromImmichOriginal(originalPath, libraryRoot);
  if (!filePath) {
    cache.set(assetId, { value: null, expires: Date.now() + CACHE_TTL_MS });
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
    cache.set(assetId, {
      value: resolution,
      expires: Date.now() + CACHE_TTL_MS,
    });
    return resolution;
  } catch {
    cache.set(assetId, { value: null, expires: Date.now() + CACHE_TTL_MS });
    return null;
  }
}
