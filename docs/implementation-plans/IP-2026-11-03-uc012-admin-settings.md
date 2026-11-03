# IP-2026-11-03: UC-012 Admin settings UI

**Traces to:** UC-012, DES-002, ADR-0002, UC-003 (operator key)  
**Status:** Done

## Goal

Admin UI to set operator API key (and other identity fields) in server-side `.curator/config.local.json`; env vars override file.

## Verification

- [x] GET /api/admin/settings returns no raw keys
- [x] PUT saves operator key to file; loadCuratorConfig picks up without restart
- [x] Env override disables fields in UI
- [x] Test connection target/operator
- [x] lint + build

## Sign-off

Operator sign-off **2026-11-03** — [STATUS.md](../use-cases/STATUS.md) UC-012 ✓ (Admin UI; operator key configured for UC-003).
