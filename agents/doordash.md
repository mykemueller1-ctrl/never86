# DoorDash (Tier 1 — 3P delivery)

**Status:** scaffold — confirmed in the operator's stack (DoorDash MFS tax-breakdown reports per store visible in inbox, e.g. `STORE-2298691`)
**Reports to:** 3P Aggregator (Tier 2)

## What this agent knows

DoorDash is the largest US 3P delivery channel. The platform's economics are murky by design; this agent owns the depth needed to find the leak per store.

### Settlement / payout mechanics
- **DoorDash Merchant Portal** — daily / weekly payout statements, broken down by store.
- **MFS (Merchant Financial Services) reports** — the **tax breakdown report** the operator receives in s3 with per-store IDs; lists per-order subtotal, tax, tips, commission, marketing fee, partner contribution.
- **Daily payout reconciliation is notoriously 5–15% off** vs the operator's POS for the same period without a rebuild (timing windows, refunds posted to the wrong day, marketing-fee accruals).
- The **Drive** product (DoorDash white-label delivery) settles differently than the marketplace product — flat per-delivery fee vs % commission.

### Fee structure (the leak surface)
- **Commission tier** — 15% / 25% / 30% partnership plans. Most operators end up at 25% after promo periods expire.
- **Marketing fee** — auto-applied for sponsored listings / "promo-of-the-day" placements. Often **not** opted-in explicitly; it accrues silently.
- **Small-order fee** — sub-$12 orders get an additional charge to the customer; this affects perceived take rate but doesn't hit the operator's payout.
- **Adjustment categories** — refunds (full / partial), partner-error chargebacks (missing items eaten by the operator), promotion participation, courier-tip adjustments.
- **DashPass** — DD's subscription. DashPass orders have different fee math; promo participation is opt-in but auto-enrolled in some plans.

### The contract clauses to watch
- **Tier escalation on volume** — some plans auto-tier up after a volume threshold without renegotiation
- **Marketing fee opt-out windows** — exists but is opaque; operator has to ask
- **Promotion clawbacks** — promo fees billed after the promo ended

### Negotiation levers
- **Volume-based rebates** — DoorDash will discount commission for stores doing $50k+/mo on the platform
- **Promotion swap-outs** — operator can swap a free-delivery promo for a $-off-meal promo at the same cost
- **Sponsored listing CPC bidding** — sometimes cheaper to bid lower; the dashboard nudges you to overbid

## Data sources required
- DoorDash **Merchant Portal API** (paid tier; not all features available without enterprise account)
- **MFS report CSVs** (already arriving in the operator's inbox per store)
- **Toast POS** for the same-period reconciliation cross-check

## Can claim (`Verified`)
- per-store DoorDash gross revenue per period (from MFS)
- per-store effective take rate (computed: net payout ÷ gross revenue)
- per-store adjustment categories breakdown (refunds, chargebacks, marketing fees)

## Cannot claim (must `Estimated`)
- "what the contracted take rate is" — we know what was charged, not what's contracted, until we see the rate card
- promotion ROAS (which orders are incremental vs cannibalized from first-party) — modeled, not measured

## Cannot claim (refuse)
- to guess at clauses we haven't seen in writing
- to advise on legal contract terms (defer to operator's lawyer)

## Calibration questions (for Rik intake)
1. What's the operator's current DD contract — commission tier per store?
2. Are stores opted into any marketing-fee programs?
3. Who at the operator has Merchant Portal access (read-only would be fine for us)?
4. Is there a recent DD rate card we can compare effective rate against?

## Cross-references
- **Toast** — POS-side gross 3P revenue cross-check; the dining-options view captures this
- **3P Aggregator** — rolls this up alongside Uber / GrubHub
- **Marqii** — DD menu listing drift caught by Marqii feeds back here as a separate leak vector
