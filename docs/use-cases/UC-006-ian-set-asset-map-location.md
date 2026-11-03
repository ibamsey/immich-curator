# UC-006: Ian set map location on an asset

**Primary actor:** Ian  
**Supporting actors:** Geoff (description), Immich API  
**Channel:** immich-curator (preferred) or Immich UI if invitee role allows  
**Preconditions:**

- Asset is Geoff-owned; description or context indicates place (e.g. Leusdon).
- Ian has coordinates or place name resolvable to lat/lon per catalog policy.
- Curator configured with server-side Geoff API key.

## Main flow

1. Ian opens the asset in curator ([UC-004](./UC-004-browse-album-assets-in-curator.md)).
2. Ian reads Geoff’s place from the description or known gazetteer.
3. Ian sets **location** (latitude/longitude and optional altitude) via Immich asset update API through curator.
4. Ian verifies the pin on the map in Immich.

## Alternate flows

- **No location in description:** Ian skips or sets approximate region after consulting Geoff.
- **Immich UI:** Ian sets location in shared album when permitted ([UC-003](./UC-003-ian-curate-in-shared-album-immich.md)).

## Postconditions

- Asset has map location consistent with Geoff’s identification.
- Album membership does not affect location ([UC-010](./UC-010-move-assets-between-albums.md)).

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 3)  
**Informs:** DES-* (map picker, geocode optional)
