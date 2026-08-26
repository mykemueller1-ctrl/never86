# Monday gate status — 2026-08-26

## Operating model (locked)
Grok (phone) → Cursor (agents/bots/code/PRs) → Codex (outside review).
One Cursor factory job at a time.

## Live deploy
Production SHA `84e543a` = `main`. This repo deploys www.never86.ai.

## Branch
`cursor/monday-gate-onboard-6e56` from `codex/action-shift-122-safe` → PR #127.

## Free seat without Supabase (tonight)
Activation + login use **Neon** (`DATABASE_URL`):
- `seat_activation_tokens`, `seat_operators`, `seat_locations`, `seat_credentials`
- SQL: `drizzle/0002_free_seat_neon.sql`
- Free-seat operator ids ≥ `1_000_000` (no OPS id collision)
- Dashboard empty state asks for prior business-day close
- Password never emailed

## Supabase
**Deferred to tomorrow morning** per Myke. Project `never86` unpaid/INACTIVE.
Toast/CTAP OPS evidence waits. Do not block factory on it tonight.

## Apply Neon tables
On Neon console or CI with `DATABASE_URL`:
```bash
psql "$DATABASE_URL" -f drizzle/0002_free_seat_neon.sql
# or: npx drizzle-kit push
```

## Grok
See `docs/GROK-KEEP-BUILDING.md` — keep dispatching Cursor; Supabase is morning work.
