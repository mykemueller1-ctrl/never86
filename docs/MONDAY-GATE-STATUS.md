# Monday gate status — 2026-08-26

## Operating model (locked)
Grok (phone) → Cursor (agents/bots/code/PRs) → Codex (outside review).
One Cursor factory job at a time.

## Live deploy
Production SHA `84e543a` = `main`. This repo deploys www.never86.ai.

## Branch
`cursor/never86-monday-gate-118-a951` from `codex/action-shift-122-safe`, extending PR #127.

## What landed (drafted + tested in this slice)
- Join → email activation token → one Neon free store + one login (PR #127).
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

## Residual gaps
- Live Gmail polling of pdqreports@ is not wired (connector auth is outside this repo). Forward/paste/upload is the launch path.
- Native-text PDF extraction is best-effort; scanned/image PDFs still need OCR later.
- Two-real-input unattended-routine gate still requires a human review on two different dates.
- Neon tables must be applied once; this agent does not run live migrations.

## Do not
Merge grok-sales-org (#121). Auto-send. Invent dollars. Print private store totals in public comments.
