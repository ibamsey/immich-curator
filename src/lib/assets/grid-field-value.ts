import {
  computeFieldValue,
  isComputedFieldId,
} from "@/lib/assets/computed-field-registry";
import {
  defaultComputeContext,
  type ComputeContext,
} from "@/lib/assets/compute-context";
import type { GridAsset } from "@/lib/assets/grid-asset";
import { tagPath } from "@/lib/immich/tag-policy";
import { immichCaptureDateKey } from "@/lib/immich/captured-datetime";

export function getGridFieldValue(
  asset: GridAsset,
  fieldId: string,
  ctx: ComputeContext = defaultComputeContext(),
): string | number | boolean | null {
  if (isComputedFieldId(fieldId)) {
    return computeFieldValue(asset, fieldId, ctx);
  }

  switch (fieldId) {
    case "hasDescription":
      return Boolean((asset.description ?? asset.exifInfo?.description ?? "").trim());
    case "hasLocation":
      return (
        asset.exifInfo?.latitude != null && asset.exifInfo?.longitude != null
      );
    case "hasTags":
      return (asset.tags?.length ?? 0) > 0;
    case "hasPeople":
      return (asset.people?.length ?? 0) > 0;
    case "tags":
      return asset.tags?.[0] ? tagPath(asset.tags[0]) : "";
    case "people":
      return asset.people?.[0]?.name ?? "Unnamed";
    case "month": {
      const d = asset.localDateTime || asset.fileCreatedAt;
      if (!d) return "";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "";
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    }
    case "captureDate":
      return immichCaptureDateKey(asset.localDateTime || asset.fileCreatedAt);
    case "description":
      return asset.description ?? asset.exifInfo?.description ?? "";
    case "exif.city":
      return asset.exifInfo?.city ?? "";
    case "exif.country":
      return asset.exifInfo?.country ?? "";
    case "originalFileName":
      return asset.originalFileName;
    case "type":
      return asset.type ?? "";
    case "isFavorite":
      return Boolean(asset.isFavorite);
    case "localDateTime":
    case "fileCreatedAt":
      return asset[fieldId] ?? "";
    default:
      return null;
  }
}
