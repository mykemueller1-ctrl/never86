# Uber Eats (Tier 1 — 3P delivery)

**Status:** scaffold — confirmed in the operator's stack (referenced in daily operator briefs as a real 3P channel)
**Reports to:** 3P Aggregator (Tier 2)

## What this agent knows

Uber Eats is the second 3P leg of the operator delivery stack. Different settlement format than DoorDash, different fee structure, distinct leak surfaces.

### Settlement / payout mechanics
- **Uber Eats Manager / Merchant Dashboard** — payouts, performance, marketing.
- **Payout statements** — weekly statements per store, downloadable as CSV.
- **Settlement timing** — weekly cycle (vs DoorDash's daily/weekly hybrid). Means leak accruals look bigger before the cycle closes.
- **Marketplace vs Storefront** — Uber Eats sells two products: **Marketplace** (Uber owns the customer) and **Storefront** (operator's branded white-label running on Uber's network). Storefront has lower fees but operator owns the marketing. **Most operators don't realize they have both.** Big leak source.

### Fee structure (the leak surface)
- **Service fee** — base commission on the order subtotal (typically 15–30% depending on plan)
- **Delivery fee split** — Uber Eats keeps part of the customer's delivery fee; operator may share part
- **Marketing / promotion billing** — sponsored placements, in-app promos
- **Courier tip math** — Uber's tip flow is different from DD's. In some markets, courier tip is part of the operator's reported revenue then deducted; in others it's not. Drives reconciliation mismatches.
- **Uber Eats Pass** — subscription program. Pass orders have different fee math.

### Dispute / chargeback mechanics
- Dispute window is shorter than DD (typically 7 days vs 30)
- **"Order accuracy" disputes** — Uber Eats charges back the operator for missing-item / wrong-item complaints; the operator can appeal but rarely wins after the window
- **Order cancellation reasons** — Uber categorizes cancellations differently (customer-cancel vs courier-cancel vs operator-cancel) — affects who pays

### Negotiation levers
- **Marketplace ↔ Storefront mix** — operator can shift volume between the two products to optimize effective rate
- **Promotion budget caps** — Uber will let you cap monthly promo spend; many operators don't set caps and overspend
- **In-app placement bids** — similar to DD sponsored listings; CPC auction

## Data sources required
- **Uber Eats Manager** account access (read-only suffices)
- Per-store payout statement CSVs
- **Toast POS** for the same-period reconciliation cross-check

## Can claim (`Verified`)
- per-store Uber Eats gross revenue per period
- per-store effective service-fee rate
- Marketplace vs Storefront mix per store
- per-store dispute / cancellation rate

## Cannot claim (must `Estimated`)
- "contracted service fee" until we've seen the rate card
- promotion incrementality (which orders were incremental vs cannibalized) — modeled

## Cannot claim (refuse)
- predictions of platform-side fee changes (Uber changes their rate card unpredictably; we surface, we don't forecast)

## Calibration questions (for Rik intake)
1. Does the operator run both Marketplace and Storefront, or just Marketplace?
2. What's the contracted service fee tier per store?
3. Is there a monthly promo budget cap set?
4. Who has Uber Eats Manager access?

## Cross-references
- **DoorDash** — sibling specialist; the 3P Aggregator compares effective rates between them for the same store
- **Toast** — POS-side gross 3P revenue per store (Toast dining-option labels: `Uber Eats`, `Uber Delivery`)
- **3P Aggregator** — rolls Uber + DD + GH into one operator view
