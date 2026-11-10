# UC-005: Operator assign tags to a target asset

**Primary actor:** Operator (at the curator UI)  
**Acting as:** Target. Tag list, create, attach, and detach use the target API key (`IMMICH_API_KEY` via `immichJson` / `immichFetchTarget`). The operator key is not used.  
**Supporting actors:** Target (prior description in Immich), Immich API  
**Channel:** immich-curator (preferred) or Immich UI as the target  
**Preconditions:**

- Asset is owned by the target and in scope for the curator ([UC-004](./UC-004-browse-album-assets-in-curator.md)).
- The target has written a description identifying event, place, or context ([UC-002](./UC-002-geoff-edit-description-and-name-faces.md)).
- The operator has opened the asset in the curator.

Installation rules: [`/home/ian/immich/docs/tags.md`](/home/ian/immich/docs/tags.md).

## Main flow

1. The operator reads the asset description (for example “Sally’s wedding at Leusdon”).
2. The operator chooses catalog tags (for example `Sally's Wedding`, `Leusdon`, `Poundsgate`). The panel shows each tag’s full `value`, not only the leaf name.
3. The curator server upserts any missing path on the **target’s** tag tree (`PUT /api/tags` with the target key; `/` creates parents), then attaches the leaf to the target’s asset (`PUT /api/tags/:id/assets`).
4. The operator confirms the tag on the target’s asset and in the target’s Tags view in Immich (logged in as the target, or via a share that can see the target’s tags).

## Alternate flows

- **Immich UI:** The target (or an invitee whose role allows it) adds tags in Immich ([UC-003](./UC-003-ian-curate-in-shared-album-immich.md)). Tags created in the curator still belong to the target.
- **Provenance:** Values under `import/` or `{immich-go}/` stay on the asset. The curator does not offer removal for those prefixes.
- **Already present:** Choosing a `value` the target already has attaches the existing id. It does not create a second tag.
- **Multi-select (Explore):** The operator ticks two or more assets on the Explore grid ([DES-008](../designs/DES-008-explore-multi-select-actions.md)). The bulk tag action adds one catalog path to all ticked assets via `PUT /api/immich/tags/assets` (target key). Removing a tag in common detaches from all ticked assets; provenance tags are not bulk-detached.
- **Find by tag:** In Immich, filter by a tag id. A parent matches assets tagged only on a descendant. Curator server-side `filter.tagIds` is out of scope here.

## Postconditions

- The target’s asset tag set includes the catalog tags and the existing provenance tags.
- New tags exist on the target’s user, not the operator’s.
- Description unchanged unless the operator also runs [UC-007](./UC-007-ian-correct-asset-description.md).

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 3)  
**Informs:** [DES-007](../designs/DES-007-tag-editor.md), [`/home/ian/immich/docs/tags.md`](/home/ian/immich/docs/tags.md)
