# Grok — keep building (2026-08-26 night)

Myke: keep going. Supabase is **tomorrow morning**. Do not block the factory on it.

## Factory order (locked)
**Grok** (Myke’s phone hub) → **Cursor** (agents, bots, code, tests, PRs) → **Codex** (watchtower / review outside the factory).

One active Cursor job at a time. Stop stuck sales-org dumps. Do not merge `cursor/grok-sales-org`.

## Right now
1. Read PR **#127** (`cursor/monday-gate-onboard-6e56`) — Monday gate free seat.
2. Free seat runs on **Neon** (`DATABASE_URL`), not Supabase.
3. Apply on Neon when ready: `drizzle/0002_free_seat_neon.sql` (or `drizzle-kit push`).
4. Keep building without OPS/Toast until Myke restores Supabase tomorrow:
   - stranger door: onboard → activate → empty desk → prior-day close
   - Action Shift desk (typed Unverified numbers)
   - SEO/GTM #122 only after stranger door works
5. Use public MCP `https://www.never86.ai/api/mcp` for operator logic.
6. Private Grok→Cursor bridge (when enabled): `https://www.never86.ai/api/orchestrator/mcp` — see `docs/company/GROK_CURSOR_DISPATCH.md` on `main`.

## Do not
- Wait on Supabase tonight
- Invent OPS columns
- Auto-send mail/social
- Put CTap private numbers in public Git
- Start a fourth Never86 repo

## When Myke returns to Supabase (morning)
Pay invoices → restore project `never86` → paste `OPS_DATABASE_URL` → wire Toast/CTAP evidence onto the free seat. Neon free seats stay; OPS is the evidence plane.

## Cursor status packet
- Branch: `cursor/monday-gate-onboard-6e56`
- PR: https://github.com/mykemueller1-ctrl/never86/pull/127
- Tests: `npx vitest run src/lib/operatorActivation.test.ts` (4/4)
- Blocker cleared for tonight: Supabase deferred; Neon path is the free seat.
