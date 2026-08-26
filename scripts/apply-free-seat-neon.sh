#!/usr/bin/env bash
# Apply Monday-gate free-seat tables to Neon (ops).
# Usage: DATABASE_URL='postgresql://...' ./scripts/apply-free-seat-neon.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (Neon connection string)." >&2
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client, or paste SQL in Neon SQL Editor:" >&2
  echo "  $ROOT/drizzle/0002_free_seat_neon.sql" >&2
  echo "  $ROOT/drizzle/0003_free_seat_intake.sql" >&2
  exit 2
fi
echo "Applying drizzle/0002_free_seat_neon.sql ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/drizzle/0002_free_seat_neon.sql"
echo "Applying drizzle/0003_free_seat_intake.sql ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/drizzle/0003_free_seat_intake.sql"
echo "Verifying free-seat tables ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "\dt seat_*"
echo "Done. Stranger door: /onboard → activate email → /dashboard desk → PDQ close → ≤3 Action Shift → night proof."
