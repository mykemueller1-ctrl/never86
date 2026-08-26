#!/usr/bin/env bash
# Apply Neon free-seat SQL for Monday gate (#118).
# Exit 2 if DATABASE_URL is missing. Never print the URL.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is missing. Set it in Vercel / Cursor secrets (not git)." >&2
  exit 2
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILES=(
  "$ROOT/drizzle/0002_free_seat_neon.sql"
  "$ROOT/drizzle/0003_free_seat_intake.sql"
)

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to apply free-seat tables." >&2
  exit 1
fi

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing migration: ${f#"$ROOT/"}" >&2
    exit 1
  fi
  echo "Applying ${f#"$ROOT/"}"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done

echo "Free-seat Neon tables applied."
