#!/usr/bin/env bash
# Apply Neon free-seat SQL for Monday gate (#118).
# Exit 2 if DATABASE_URL is missing. Never print the URL.
# Canonical path — do not add a second apply-free-seat-neon.sh.
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
  echo "psql is required to apply free-seat tables. Or paste drizzle/0002 + 0003 in Neon SQL Editor." >&2
  exit 1
fi

redact() {
  # Drop connection strings if the client echoes them on failure.
  sed -E 's#postgres(ql)?://[^[:space:]]+#[DATABASE_URL redacted]#g'
}

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing migration: ${f#"$ROOT/"}" >&2
    exit 1
  fi
  echo "Applying ${f#"$ROOT/"}"
  if ! out="$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" 2>&1 >/dev/null)"; then
    echo "Failed applying ${f#"$ROOT/"}. DATABASE_URL not printed." >&2
    printf '%s\n' "$out" | redact >&2
    exit 1
  fi
done

echo "Verifying free-seat tables ..."
if ! verify="$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'seat_%';" 2>&1)"; then
  echo "Failed verifying seat_* tables. DATABASE_URL not printed." >&2
  printf '%s\n' "$verify" | redact >&2
  exit 1
fi
echo "seat_* table count: $(printf '%s' "$verify" | redact | tr -d '[:space:]')"
echo "Free-seat Neon tables applied."
echo "Next (ops): node scripts/probe-free-seat-door.mjs https://www.never86.ai"
