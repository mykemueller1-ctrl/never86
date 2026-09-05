# GrubHub (Tier 1 — 3P delivery)

**Status:** scaffold — confirmed in the operator's stack (referenced in operator-side reconciliations; ~$11.4K / 4 weeks at 18% per Myke's May 8 math)
**Reports to:** 3P Aggregator (Tier 2)

## What this agent knows

GrubHub is the smallest of the three 3P legs by chain volume for the chef-led 16-unit group (about 1/8 of Uber Eats volume by ticket share) but still meaningful at scale. Different platform mechanics, distinct leak surfaces.

### Settlement / payout mechanics
- **GrubHub for Restaurants portal** — payouts, performance, marketing, menu management
- **Daily payout statements per store** — exportable as CSV
- **Settlement timing** — weekly cycle, similar to Uber Eats. Reconciliation against Toast lags ~7 days.
- **Marketplace vs Direct** — GH offers a "Direct" white-label product (operator's branded site running on GH backend) alongside the marketplace. Different fee structure.

### Fee structure (the leak surface)
- **The chef-led 16-unit group rate card (confirmed by Rik, May 8 2026 email)**:
  - **Commission: 18%** — matches Uber Eats delivery rate
- **Generic GH rate context** — most operators sit at 20-30% on standard marketplace plans. The chef-led group's 18% reflects chain-level negotiation.
- **The lever (operator's May 8 math)** — GH volume at 18% costs ~$11.4K / 4 weeks on chain volume. If landed at DD's 10% precedent, GH alone saves ~$5.1K / 4 weeks ≈ $66K / year. Combined with UE, the UE+GH consolidation to 10% saves ~$585K / year total.
- **Marketing fees** — Sponsored Listings (CPC auction), Loyalty Adder, Plus-membership ad credits
- **Customer-side fees** — delivery fee, small-order fee, service fee — these don't hit the operator's payout but inflate "headline" take rate the operator sees
- **GrubHub+** — subscription program; member orders have different effective rates

### Dispute / chargeback mechanics
- **Order accuracy disputes** — GH charges back the operator for missing-item / wrong-item complaints with a 14-day window
- **Cancellation reasons** — coded similar to UE (customer-cancel vs driver-cancel vs operator-cancel)
- **Refund posting** — GH refunds can post days after the order, breaking same-day reconciliation if not bucketed correctly

### Negotiation levers
- **Marketplace ↔ Direct mix** — operator can shift volume to Direct to optimize effective rate
- **Promotion budget caps** — GH allows monthly caps; many operators don't set them
- **CPC bid floors** — Sponsored Listings auction can be optimized; the dashboard nudges higher than necessary

## Data sources required
- **GrubHub for Restaurants** account access (read-only suffices)
- Per-store payout statement CSVs
- **Toast POS** for the same-period reconciliation cross-check (dining-options view captures `GrubHub` channel)

## Can claim (`Verified`)
- per-store GrubHub gross revenue per period
- per-store effective commission rate (computed: net payout ÷ gross revenue)
- Marketplace vs Direct mix per store (when both products are enabled)
- per-store dispute / cancellation rate

## Cannot claim (must `Estimated`)
- ~~"contracted commission" until we've seen the rate card~~ **Verified May 8: 18% commission.**
- promotion incrementality (which orders were incremental vs cannibalized) — modeled
- GrubHub+ share of volume — must be pulled from the GH merchant portal

## Cannot claim (refuse)
- predictions of platform-side fee changes (GH changes their rate card opaquely; we surface, we don't forecast)
- the assumption that GH and UE volumes are interchangeable for renegotiation — they aren't; different customer bases, different geographic strengths

## Calibration questions (for Rik intake)
1. ~~Contracted commission per store?~~ **Confirmed May 8: 18%.**
2. Does the operator run Marketplace only, or both Marketplace and Direct?
3. Monthly promo budget cap set per store?
4. Who has GrubHub for Restaurants portal access?

## Cross-references
- **DoorDash** — sibling specialist; the 3P Aggregator compares effective rates between them for the same store; the 10% DD contract is the precedent operators can take into UE+GH renegotiation
- **Uber Eats** — sibling specialist; matches GH at 18% for the operator today; the "$585K/year" lever combines UE and GH renegotiation into a single move
- **Toast** — POS-side gross 3P revenue per store (Toast dining-option label: `GrubHub`)
- **3P Aggregator** — rolls Uber + DD + GH into one operator view
