# Grok — keep building (2026-08-26)

Myke: keep going. Supabase is **tomorrow morning**. Do not block the factory on it.

## Factory order (locked)
**Grok** (Myke’s phone hub) → **Cursor** (agents, bots, code, tests, PRs) → **Codex** (watchtower / review outside the factory).

One active Cursor job at a time. Stop stuck sales-org dumps. Do not merge `cursor/grok-sales-org`.

## Live stack (landed — do not rebuild)
1. **#131** Monday gate — on `codex/action-shift-122-safe`. Dirty **#130** closed.
2. **#132** vendor drift — landed on the same tip.
3. **#133** PO / receive / usage gap — landed.
4. **#134** vendor silence — landed @ `f92f89d`.

Allowlisted tip: `codex/action-shift-122-safe`. Do **not** replay dirty #130.

## Right now
1. **Apply Neon free-seat SQL** (live blocker — www returns 503 until this lands):
   - `DATABASE_URL=... ./scripts/apply-free-seat-neon.sh`
   - or paste `drizzle/0002_free_seat_neon.sql` + `drizzle/0003_free_seat_intake.sql` in Neon SQL Editor
2. Probe: `node scripts/probe-free-seat-door.mjs https://www.never86.ai`
3. Walk stranger door once: `/onboard` → activate → desk → PDQ close → ≤3 Action Shift → night proof.
4. Free seat stays on **Neon**. Supabase OPS is morning work.
5. Public MCP: `https://www.never86.ai/api/mcp`.
6. Code stack #131–#134 is on `codex/action-shift-122-safe`; do not rebuild it.

## Do not
- Wait on Supabase tonight
- Invent OPS columns
- Auto-send mail/social
- Put CTap private numbers in public Git
- Start a fourth Never86 repo
- Merge grok-sales-org (#121)
- Re-open dirty #130
- Deploy production from a dirty head

## When Myke returns to Supabase (morning)
Pay invoices → restore project `never86` → paste `OPS_DATABASE_URL` → wire Toast/CTAP evidence onto the free seat. Neon free seats stay; OPS is the evidence plane.

## Residuals (ops / later)
- Neon 0002+0003 apply (tonight’s blocker)
- Inbound DNS
- Gmail poll later
- OCR later

## Cursor status packet
- Branch: `cursor/neon-free-seat-apply-9d74`
- Tip ancestor: `codex/action-shift-122-safe` @ `f92f89d` (#131–#134 landed)
- Dirty predecessor: PR #130 closed
- Live probe: `POST /api/onboard/request` → **503** free-seat tables missing on Neon
- Tests: `npx vitest run` — **204/204 passed** (27 files)
- Next: paste `DATABASE_URL` → apply script → door probe → stranger walk.
