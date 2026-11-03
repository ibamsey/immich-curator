import type {
  CuratorAssetEnrichment,
  ImmichAsset,
  ImmichAssetWithEnrichment,
  ImmichExif,
  ImmichTag,
} from "@/lib/immich/types";

/** Normalized asset for grid query (search + detail fields). */
export type GridAsset = ImmichAsset & {
  width?: number;
  height?: number;
  description?: string;
  exifInfo?: ImmichExif | null;
  tags?: ImmichTag[];
};

type RawSearchAsset = Record<string, unknown>;

export function normalizeGridAsset(raw: RawSearchAsset): GridAsset {
  const exif = (raw.exifInfo as ImmichExif | null | undefined) ?? null;
  const tags = (raw.tags as ImmichTag[] | undefined) ?? [];
  const people = (raw.people as GridAsset["people"]) ?? [];
  const description =
    (raw.description as string | undefined) ??
    exif?.description ??
    undefined;

  return {
    id: String(raw.id),
    originalFileName: String(raw.originalFileName ?? ""),
    fileCreatedAt: String(raw.fileCreatedAt ?? ""),
    localDateTime: String(raw.localDateTime ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    description,
    tags,
    people,
    exifInfo: exif,
    isArchived: Boolean(raw.isArchived),
    isFavorite: Boolean(raw.isFavorite),
    type: raw.type as string | undefined,
    width:
      (raw.width as number | undefined) ??
      exif?.exifImageWidth ??
      exif?.imageWidth,
    height:
      (raw.height as number | undefined) ??
      exif?.exifImageHeight ??
      exif?.imageHeight,
  };
}

/** Merge Immich detail/search JSON into a consistent shape for metadata + compute. */
export function normalizeAssetDetail(
  raw: Record<string, unknown>,
): ImmichAssetWithEnrichment {
  const base = normalizeGridAsset(raw);
  const enrichment = raw.curatorEnrichment as
    | CuratorAssetEnrichment
    | undefined;
  return {
    ...(raw as unknown as ImmichAssetWithEnrichment),
    ...base,
    width: base.width,
    height: base.height,
    curatorEnrichment: enrichment,
  };
}
