# UC-005: Ian assign tags to an asset from Geoff’s description

**Primary actor:** Ian  
**Supporting actors:** Geoff (prior description), Immich API  
**Channel:** immich-curator (preferred) or Immich UI if invitee role allows  
**Preconditions:**

- Asset is Geoff-owned and in a Poundsgate-family album.
- Geoff has written a description identifying event/place/context ([UC-002](./UC-002-geoff-edit-description-and-name-faces.md)).
- Ian has opened the asset in curator ([UC-004](./UC-004-browse-album-assets-in-curator.md)) or Immich.

## Main flow

1. Ian reads the asset description (e.g. “Sally’s wedding at Leusdon”).
2. Ian derives tags (e.g. `Sally's Wedding`, `Leusdon`, `Poundsgate`).
3. Ian adds or updates tags on the asset via curator → server API as Geoff.
4. Ian confirms tags appear on the asset in Immich (Geoff or Ian view).

## Alternate flows

- **Immich UI:** Ian adds tags in shared album if permissions allow ([UC-003](./UC-003-ian-curate-in-shared-album-immich.md)).
- **Existing tags:** Ian merges with import tags (`import/scanner/...`) without removing provenance tags unless policy says otherwise.

## Postconditions

- Tag set on asset reflects Geoff’s identification and Ian’s catalog rules.
- Description unchanged unless Ian also runs [UC-007](./UC-007-ian-correct-asset-description.md).

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 3)  
**Informs:** DES-* (tag editor, tag suggestions)
