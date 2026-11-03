import { getField } from "@/lib/assets/asset-field-registry";
import type {
  GridFilterRule,
  GridQuery,
  GridQueryScope,
} from "@/lib/assets/grid-query-types";

export type ImmichMetadataSearchBody = Record<string, unknown>;

const DEFAULT_SIZE = 500;

export function splitFilters(rules: GridFilterRule[]): {
  server: GridFilterRule[];
  client: GridFilterRule[];
} {
  const server: GridFilterRule[] = [];
  const client: GridFilterRule[] = [];
  for (const rule of rules) {
    const field = getField(rule.fieldId);
    if (!field || field.clientOnly || rule.fieldId.startsWith("has")) {
      client.push(rule);
      continue;
    }
    if (field.immich?.searchKey && (rule.op === "eq" || rule.op === "contains")) {
      server.push(rule);
    } else {
      client.push(rule);
    }
  }
  return { server, client };
}

export function buildMetadataSearchBody(
  scope: GridQueryScope,
  query: GridQuery,
  sharedAlbumIds: string[],
  page = 1,
  size = DEFAULT_SIZE,
): { body: ImmichMetadataSearchBody; clientFilters: GridFilterRule[] } {
  const { server, client } = splitFilters(query.filters);
  const body: ImmichMetadataSearchBody = {
    page,
    size,
    withExif: true,
    order: query.sort.direction,
  };

  const sortField = getField(query.sort.fieldId);
  if (sortField?.immich?.sortBy) {
    body.sortBy = sortField.immich.sortBy;
  }

  if (scope.mode === "album") {
    body.albumIds = [scope.albumId];
  } else if (scope.mode === "personShared") {
    body.personIds = [scope.personId];
    if (sharedAlbumIds.length > 0) {
      body.albumIds = sharedAlbumIds;
    }
  }

  for (const rule of server) {
    const field = getField(rule.fieldId);
    const key = field?.immich?.searchKey;
    if (!key) continue;
    if (rule.op === "eq") {
      body[key] = rule.value;
    }
    if (rule.op === "contains" && typeof rule.value === "string") {
      body[key] = rule.value;
    }
  }

  return { body, clientFilters: client };
}
