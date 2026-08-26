# Monday gate status — 2026-08-26

## Operating model (locked)
Grok (phone) → Cursor (agents/bots/code/PRs) → Codex (outside review).
One Cursor factory job at a time.

## Live deploy
Production SHA `84e543a` = `main`. This repo deploys www.never86.ai.

## Branch
`cursor/never86-pr-130-merge-ready-0699` from `codex/action-shift-122-safe` @ `9258b86` → follow-on PR #131.
Clean rebase of PR #130 PDQ + yesterday-close intake (dropped overlapping #127 activation commits already on base). Dirty #130 head `cursor/never86-monday-gate-118-a951` @ `b075114` is superseded by this branch.
Tests: `npx vitest run` — 157/157.

## What landed (drafted + tested in this slice)
- Join → email activation token → one Neon free store + one login (PR #127, already on base).
- Yesterday close via **paste / file upload / forwarded email** (`close+{operatorId}@inbound.never86.ai`). No POS password.
- PDQ native-text contract: ZReport_Summary + Hourly_Sales + Void_Promo. Filename `M-D-YYYY` is the business date.
- Desk shows sales, mix (food/beer/liquor/pop), labor, cash. Missing category = Missing Evidence, not $0.
- Unentered / $0 cash field is **not** a shortage.
- Action Shift ≤3 moves with owner, dollars, claim boundary, proof object. Verbal yes does not close.
- Second store / second seat blocked on the free plan.

## Apply Neon (not applied by this agent)
```bash
psql "$DATABASE_URL" -f drizzle/0002_free_seat_neon.sql
psql "$DATABASE_URL" -f drizzle/0003_free_seat_intake.sql
```

## Next slice (this factory job)
Vendor Drift intake on `cursor/never86-vendor-drift-action-shift-6c5c`, stacked on #131 @ `c206ecc`.
Invoice CSV / native-text PDF → SKU + vendor + unit price + period → >5% up vs prior period → Action Shift ≤3. Missing prior = Missing Evidence, not $0. Synthetic fixtures only.

## Residual gaps
- Live Gmail polling of pdqreports@ is not wired (connector auth is outside this repo). Forward/paste/upload is the launch path.
- Native-text PDF extraction is best-effort; scanned/image PDFs still need OCR later.
- Two-real-input unattended-routine gate still requires a human review on two different dates.
- Neon tables must be applied once; this agent does not run live migrations.
- `docs/company/intake/CHATGPT_HANDOFF.md` and `INBOX.md` were not in this checkout.

## Do not
Merge grok-sales-org (#121). Auto-send. Invent dollars. Print private store totals in public comments.
