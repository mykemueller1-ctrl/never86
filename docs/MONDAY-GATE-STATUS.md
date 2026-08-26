# Monday gate status — 2026-08-26

## Operating model (locked)
Grok (phone) → Cursor (agents/bots/code/PRs) → Codex (outside review).
One Cursor factory job at a time.

## Live deploy
Production SHA on `main` still serves www.never86.ai. Free-seat onboard code is live enough to return **503** until Neon 0002+0003 are applied.

## Live stack (landed on allowlist)
| PR | Branch | Status |
| --- | --- | --- |
| **#131** | `cursor/never86-pr-130-merge-ready-0699` | Merged into `codex/action-shift-122-safe`. Dirty **#130** closed. |
| **#132** | `cursor/never86-vendor-drift-action-shift-6c5c` | Landed. |
| **#133** | `cursor/never86-po-receive-usage-gap-b6b2` | Landed. |
| **#134** | `cursor/never86-vendor-silence-action-shift-69a5` | Landed @ `f92f89d`. |

Allowlisted tip: `codex/action-shift-122-safe`. Vitest on tip: **204/204** (27 files).

## What landed
- Join → email activation token → one Neon free store + one login.
- Yesterday close via paste / file upload / forwarded email. PDQ native-text → desk numbers + ≤3 Action Shift moves.
- Vendor drift: invoice CSV / native-text → SKU >5% up vs prior period. Missing prior = Missing Evidence, not $0.
- PO / receive / usage: three qty legs compute a gap. Two legs = Partial. One leg = Missing Evidence, `dollarsObserved` null. Invoice ≠ COGS.
- Vendor silence: typed last-seen + as-of + operator-approved cadence. First 14 calendar days advisory. Duplicate vendor+store+day does not open a second ticket. Closing requires proof that resets last-seen. Missing cadence or last-seen = Missing Evidence. Quiet is a follow-up signal, not a missed truck. Typed inputs stay Unverified.
- Action Shift still ≤3 with owner, claim boundary, proof object. Verbal yes does not close.

## Apply Neon (tonight’s blocker)
```bash
DATABASE_URL='postgresql://...' ./scripts/apply-free-seat-neon.sh
node scripts/probe-free-seat-door.mjs https://www.never86.ai
```

Or paste in Neon SQL Editor:
- `drizzle/0002_free_seat_neon.sql`
- `drizzle/0003_free_seat_intake.sql`

## Ops progress (2026-08-26 evening)
- Stack **#131–#134** landed on `codex/action-shift-122-safe` @ `f92f89d`.
- Dirty **#130** closed (superseded).
- Live `POST /api/onboard/request` on www.never86.ai returns **503**: free-seat tables not on Neon yet.
- Agent VM has no `DATABASE_URL`; Neon/Render MCP unauthorized; Vercel preview SSO-gated.
- Cloud Agent secret request filed for `DATABASE_URL`. Re-run apply + stranger walk once it lands.

## Residuals
- Neon 0002+0003 apply (blocking stranger door).
- Inbound DNS.
- Gmail poll later.
- OCR later.

## Do not
Merge grok-sales-org (#121). Re-open dirty #130. Auto-send. Invent dollars. Print private store totals in public comments.
