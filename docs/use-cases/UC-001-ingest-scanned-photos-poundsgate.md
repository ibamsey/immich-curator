# UC-001: Ingest scanned photos into Geoff’s Poundsgate corpus

**Primary actor:** Ian  
**Supporting actors:** Geoff (asset owner), Immich server (dartmoor)  
**Channel:** dartmoor ops (`../immich` — not immich-curator)  
**Preconditions:**

- Immich is running on dartmoor (`http://127.0.0.1:2283`).
- `IMMICH_API_KEY` in `/home/ian/immich/.env` belongs to `geoff.bamsey952@gmail.com` (matches `IMMICH_IMPORT_USER_EMAIL`).
- Scan batch folder exists (e.g. under `immich-import-staging/scanner/inbox/<batch>/`).
- Poundsgate album exists on Geoff’s account (default album name `Poundsgate`).

## Main flow

1. Ian scans prints and places image files in the staging inbox batch folder.
2. Ian runs [`import-scanned-photos.sh`](../../../immich/scripts/import-scanned-photos.sh) with `SCAN_SOURCE_DIR` set to the batch (or passes the path as an argument).
3. `immich-go upload from-folder` uploads as Geoff, tags under `import/scanner`, and adds assets to the **Poundsgate** album (`--into-album`).
4. Optional post-steps: metadata refresh script for JPEGs; batch moved to `processed` when `SCAN_MOVE_TO_PROCESSED=1`.
5. Geoff and Ian see new assets in Poundsgate (Geoff as owner; Ian via shared album).

## Alternate flows

- **Dry run:** `IMPORT_DRY_RUN=1` or `--dry-run` — validate counts and log without upload.
- **Different album name:** set `SCAN_ALBUM_NAME` (e.g. after US-002 split, target a sibling album if import policy changes).
- **Key mismatch:** script exits if API key user ≠ `IMMICH_IMPORT_USER_EMAIL`.

## Postconditions

- New assets are **owned by Geoff** and appear in the configured album.
- Import batch tags applied (`import/scanner`, batch tag, session tag).
- Log written under `immich/logs/scanner-import-*.log`.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 1)  
**Informs:** DES-* (album queue source), ops docs in `immich/`
