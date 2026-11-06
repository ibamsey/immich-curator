/** Full path when Immich sent `value`; otherwise the leaf name. */
export function tagPath(tag: { value?: string; name: string }): string {
  const value = tag.value?.trim();
  return value || tag.name;
}

/** Import and immich-go session tags stay on the asset. */
export function isProvenanceTag(value: string): boolean {
  return value.startsWith("import/") || value.startsWith("{immich-go}/");
}
