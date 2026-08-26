# Grok — keep building (2026-08-26 night)

Myke: keep going. Supabase is **tomorrow morning**. Do not block the factory on it.

## Factory order (locked)
**Grok** (Myke’s phone hub) → **Cursor** (agents, bots, code, tests, PRs) → **Codex** (watchtower / review outside the factory).

One active Cursor job at a time. Stop stuck sales-org dumps. Do not merge `cursor/grok-sales-org`.

## Right now
1. PR **#130** was dirty vs `codex/action-shift-122-safe`. Factory job `pr-130-merge-ready` rebased the PDQ + yesterday-close path onto `9258b86`.
2. Clean branch: `cursor/never86-pr-130-merge-ready-0699`. Follow-on PR from this branch; do not merge the dirty `cursor/never86-monday-gate-118-a951` head.
3. Free seat runs on **Neon** (`DATABASE_URL`), not Supabase.
4. Apply on Neon when ready (ops, not this agent):
   - `drizzle/0002_free_seat_neon.sql`
   - `drizzle/0003_free_seat_intake.sql`
5. Keep building without OPS/Toast until Myke restores Supabase tomorrow:
   - stranger door: onboard → activate → empty desk → prior-day close
   - PDQ Z / Hourly / Void native-text → desk numbers + ≤3 Action Shift moves
   - SEO/GTM #122 only after stranger door works
6. Use public MCP `https://www.never86.ai/api/mcp` for operator logic.
7. Private Grok→Cursor bridge (when enabled): `https://www.never86.ai/api/orchestrator/mcp` — see `docs/company/GROK_CURSOR_DISPATCH.md` on `main`.

## Do not
- Wait on Supabase tonight
- Invent OPS columns
- Auto-send mail/social
- Put CTap private numbers in public Git
- Start a fourth Never86 repo
- Merge grok-sales-org (#121)

## When Myke returns to Supabase (morning)
Pay invoices → restore project `never86` → paste `OPS_DATABASE_URL` → wire Toast/CTAP evidence onto the free seat. Neon free seats stay; OPS is the evidence plane.

## Cursor status packet
- Branch: `cursor/never86-pr-130-merge-ready-0699`
- Base: `codex/action-shift-122-safe` @ `9258b86`
- Dirty predecessor: PR #130 @ `b075114` (DIRTY; superseded)
- Next after this PR is green: vendor-drift intake (SKU >5%) as a separate slice
- Blocker cleared for code review: rebase is clean vs allowlisted base
