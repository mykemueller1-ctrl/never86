# Grok — keep building (2026-08-26)

Myke: keep going. Supabase is **tomorrow morning**. Do not block the factory on it.

## Factory order (locked)
**Grok** (Myke’s phone hub) → **Cursor** (agents, bots, code, tests, PRs) → **Codex** (watchtower / review outside the factory).

One active Cursor job at a time. Stop stuck sales-org dumps. Do not merge `cursor/grok-sales-org`.

## Live stack (do not rebuild)
1. **#131** green Monday gate — `cursor/never86-pr-130-merge-ready-0699`. Dirty **#130** is superseded. Leave it.
2. **#132** vendor drift green — `cursor/never86-vendor-drift-action-shift-6c5c` stacked on #131.
3. **#133** PO / receive / usage gap **181/181 green** — `cursor/never86-po-receive-usage-gap-b6b2` @ `c8e1e4e` stacked on #132.
4. **This slice = vendor-silence #134** stacked on the #133 head. Do not merge any of these PRs.

Allowlisted ancestor: `codex/action-shift-122-safe`. Do **not** replay dirty #130.

## Right now
1. Vendor Silence intake on the free-seat Action Shift desk: typed `last_seen_date`, `as_of_date`, `expected_cadence_days`, optional `grace_days` / `paused_dates` / `pause_weekends` / `program_started_date`.
2. First 14 calendar days after program start stay **advisory**. Duplicate vendor+store+day keeps the existing ticket. Closing requires proof that resets last-seen.
3. Missing cadence or last-seen = **Missing Evidence**, not a ticket and not $0. Quiet vendor is a follow-up signal, not a missed truck or short inventory. Typed inputs stay Unverified.
4. Free seat still runs on **Neon** (`DATABASE_URL`), not Supabase.
5. Apply on Neon when ready (**ops, not this agent**):
   - `drizzle/0002_free_seat_neon.sql`
   - `drizzle/0003_free_seat_intake.sql`
6. Use public MCP `https://www.never86.ai/api/mcp` for operator logic.

## Do not
- Wait on Supabase tonight
- Invent OPS columns
- Auto-send mail/social
- Put CTap private numbers in public Git
- Start a fourth Never86 repo
- Merge grok-sales-org (#121)
- Merge #131 / #132 / #133 / #134
- Deploy production or apply Neon from the factory

## When Myke returns to Supabase (morning)
Pay invoices → restore project `never86` → paste `OPS_DATABASE_URL` → wire Toast/CTAP evidence onto the free seat. Neon free seats stay; OPS is the evidence plane.

## Residuals (ops / later)
- Neon 0002+0003 apply is ops
- Inbound DNS
- Gmail poll later
- OCR later

## Cursor status packet
- Branch: `cursor/never86-vendor-silence-action-shift-69a5`
- Stacked on: #133 @ `c8e1e4e` (`cursor/never86-po-receive-usage-gap-b6b2`)
- Prior green: #131 Monday gate, #132 vendor drift, #133 PO gap 181/181
- Dirty predecessor: PR #130 superseded
- Follow-on PR: https://github.com/mykemueller1-ctrl/never86/pull/134
- Tests: `npx vitest run` — **197/197 passed** (26 files) on this branch after stacking on #133's 181/181
- Next: Codex reviews; no merge from desk.
