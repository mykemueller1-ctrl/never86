# Build Spec — Product 1: The Operator Coach (working name TBD; "Pulse" retired)

**Status:** approved scope · **Owner:** Myke Mueller · **Builder:** Claude (in-repo sessions)
**Standard:** every phase ends in a demo-able acceptance check against real paper.
No phase is "done" until its checks pass on real CTAP documents. Every number the
product shows carries Verified / Estimated / Unverified and a coach card
(owner + one action + $) — per the north star in CLAUDE.md.

## One-line promise
Send in what you already have — invoices, receipts, Z-outs — and get back your
**daily** prime cost, with one next move. For the 1–2 unit independent.

## Ground truth
- Proof install: Community Tap & Pizza (Myke's own store). POS = **PDQ**.
- Acceptance fixture: the Drive folder **"Ctap July 5th thru 11th invoices an
  Pdq sales reports"** (~50 photos: vendor invoices + PDQ sales reports).
- Category buckets (from the CTAP prototype workbook): Food · Liquor · Beer ·
  Pop/NA Beverage · Chemicals/Paper/Supplies · Labor · Other/uncategorized.
  Prime cost = sum of all six cost buckets.
- Targets are per-store settings (e.g., Food 30%, Labor 28%); every over-target
  category gets a coach card.
- **Daily, not weekly.** The daily read comes from the day's PDQ sales report +
  invoices as they arrive; the week closes into a weekly roll-up.

## Architecture (use what exists — don't re-buy the stack)
- App: this Next.js repo (Vercel). Auth: the existing per-operator login
  (signed session, operator_id isolation).
- DB/storage: Supabase `never86` project (`zjtbhsouhwyyfwoyjgow`) — new tables
  under RLS, private storage bucket for document images.
- Parsing: Claude vision API reads invoice/receipt/Z-out images → structured
  line items with per-field confidence.
- Email out: Resend (already in repo). Email-in: **phase 4**, not MVP-blocking
  (photo/upload first — that's how the operator actually works).

## Phases + acceptance criteria

### Phase 1 — Read the paper (the engine)
Ingest a photographed invoice or PDQ sales report; extract vendor, date,
line items (name/qty/unit price/total), sales totals; classify document type.
**Accept when:** ≥ 90% of the July 5–11 folder parses without manual fixing;
every extracted total reconciles to the document image; failures land in a
review queue (never silently dropped).

### Phase 2 — Categorize + learn
Line items map to the six buckets; low-confidence items go to a review queue;
a human correction is remembered (vendor+item → category) and applied to
future documents.
**Accept when:** the July 5–11 items are categorized, corrections stick, and a
re-run of the same folder applies the learned categories automatically.

### Phase 3 — The number + the coaching (the product)
Daily prime-cost view + weekly roll-up: $ and % per bucket vs target vs prior
period, each figure labeled Verified/Estimated, one coach card per over-target
bucket (owner + action + $). Daily email of the same.
**Accept when:** the July 5–11 week produces a prime-cost report Myke signs off
as matching reality, and the email renders on a phone.

### Phase 4 — Doors open
Per-store intake email address, Stripe subscription ($199/mo), self-signup,
operator-facing onboarding. **Accept when:** a stranger can sign up, pay,
forward paper, and get their number without us touching anything.

## Explicitly out of scope (MVP)
Accounting/bookkeeping, inventory counts, recipe costing, POS API integrations,
multi-store benchmarking. These are later tiers, not the MVP.

## Responsibilities
- **Myke:** PDQ export/photo cadence (daily), category targets, sign-off on the
  Phase 3 numbers, Stripe account, DNS for intake email (Phase 4 only).
- **Claude:** everything else — build, tests, migrations (shown before run),
  parse-failure alerting to Myke's email so nothing fails silently.

## Operating rules (how this stays enterprise)
1. Every phase merges through a PR with tests; CI green before merge.
2. Real client names never appear in this public repo (CTAP = Myke's own store,
   allowed; design partners stay anonymized).
3. Any $ figure the product displays must be traceable to a stored document.
4. If a number is modeled, it says so on the screen — no silent estimates.
5. Schema changes ship as `sql/` migrations, applied with explicit go-ahead.
