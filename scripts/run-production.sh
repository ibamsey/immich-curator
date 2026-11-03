#!/usr/bin/env bash
# Production Next.js server for immich-curator (used by systemd).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .next ]]; then
  echo "Missing .next — run: npm run build" >&2
  exit 1
fi

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — copy from .env.example" >&2
  exit 1
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
exec npm run start -- -H "$HOST" -p "$PORT"
