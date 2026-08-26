# Monday gate status — 2026-08-26

## Operating model (locked)
Grok (phone) → Cursor (agents/bots/code/PRs) → Codex (outside review).
One Cursor factory job at a time.

## Live deploy
Production SHA `84e543a` = `main`. This repo deploys www.never86.ai. This slice does **not** deploy.

## Live stack
| PR | Branch | Status |
| --- | --- | --- |
| **#131** | `cursor/never86-pr-130-merge-ready-0699` | Green Monday gate. Dirty **#130** superseded. |
| **#132** | `cursor/never86-vendor-drift-action-shift-6c5c` | Vendor drift green. |
| **#133** | `cursor/never86-po-receive-usage-gap-b6b2` @ `c8e1e4e` | PO / receive / usage gap **181/181 green**. |
| **#134** | `cursor/never86-vendor-silence-action-shift-69a5` | Vendor silence intake, stacked on #133. |

Allowlisted ancestor: `codex/action-shift-122-safe`. Do not merge. Do not replay #130.
Tests on this vendor-silence branch: `npx vitest run` — **197/197** (26 files).

## What landed (drafted + tested, not merged)
- Join → email activation token → one Neon free store + one login (#127, already on base / #131).
- Yesterday close via paste / file upload / forwarded email. PDQ native-text → desk numbers + ≤3 Action Shift moves.
- Vendor drift (#132): invoice CSV / native-text → SKU >5% up vs prior period. Missing prior = Missing Evidence, not $0.
- PO / receive / usage (#133): three qty legs compute a gap. Two legs = Partial. One leg = Missing Evidence, `dollarsObserved` null. Invoice ≠ COGS.
- **Vendor silence (#134):** typed last-seen + as-of + operator-approved cadence. First 14 calendar days advisory. Duplicate vendor+store+day does not open a second ticket. Closing requires proof that resets last-seen. Missing cadence or last-seen = Missing Evidence, not a ticket and not $0. Quiet is a follow-up signal, not a missed truck or short inventory. Typed inputs stay Unverified.
- Action Shift still ≤3 with owner, claim boundary, proof object. Verbal yes does not close.

## Apply Neon (ops, not this agent)
```bash
npm run db:apply-free-seat
# exits 2 if DATABASE_URL is missing (do not paste the URL in chat)
```
Equivalent:
```bash
psql "$DATABASE_URL" -f drizzle/0002_free_seat_neon.sql
psql "$DATABASE_URL" -f drizzle/0003_free_seat_intake.sql
```

Unattended morning/night routines stay **off** until Z, Hourly, and Void each parse successfully on two different business dates. Desk returns `unattendedRoutines.enabled: false` until then.

## Residuals
- Neon 0002+0003 apply is ops.
- Inbound DNS.
- Gmail poll later.
- OCR later.
- `docs/company/intake/CHATGPT_HANDOFF.md` and `INBOX.md` were not in this checkout.

## Do not
Merge #131/#132/#133/#134. Merge grok-sales-org (#121). Deploy production. Apply Neon from the factory. Auto-send. Invent dollars. Print private store totals in public comments.
