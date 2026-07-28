# Square (Tier 1 — POS)

**Status:** scaffold — covers the small-operator and single-store segment; appears in operator's stack mainly via Square for Restaurants / Square Online Ordering
**Reports to:** every Tier 2 aggregator (POS = trunk of the data tree for operators on Square)

## What this agent knows

Square dominates the sub-5-unit operator segment. Different data shape than Toast — friendlier API, narrower depth, no "dining options" concept in the Toast sense. For Square-only operators the platform routes most reads through the Square API.

### Square data shapes
- **Catalog** — items + variations + categories + modifiers (clean hierarchy; no Toast's de-dup trap)
- **Orders** — per-order line items, fulfillment type (PICKUP / DELIVERY / DINE_IN), source (POS / Online / Cash App)
- **Payments** — clean per-payment view with fees broken out
- **Tenders** — Cash / Card / Square Gift / 3P attribution
- **Inventory counts** — only if operator enabled inventory tracking (rare for FC operators)
- **Team Member shifts** (via Square Shifts / Payroll) — clock-in/out, breaks, role
- **Customers** — built-in CRM with profile + visit history

### The trap (Square-specific)
- **Square's "Source" field is unreliable for 3P attribution** — most operators leave DoorDash / UE orders coming in as "POS" because they're rung manually. Reconciliation requires matching settlement dates from the 3P platform side.
- **Square's Gross vs Net** — Square reports Gross including processing fees; the Net you actually settle is Gross − processing − refunds − chargebacks. Easy to overstate net by 2.6-3.1%.
- **Inventory accuracy is operator-dependent** — Square inventory only works if the operator decrements on sale and adjusts on receive. Most don't.

### Square fee structure
- **Processing**: 2.6% + $0.10 in-person · 3.5% + $0.15 keyed/online (standard plans)
- **Subscription tiers**: Free / Plus ($60/mo per location) / Premium (custom)
- **No annual contract on Free tier** — operator can leave anytime
- **Square Loyalty** — separate $45-105/mo per location depending on customer count

### What's strong for the operator
- API access is free, well-documented, no enterprise gate
- Online Ordering bundled
- Payroll add-on integrates clean
- Cash App Pay = lower processing fee on those tenders

### What's weak
- Catering operations beyond simple invoice → POS handoff
- Complex modifier rules (Toast wins here)
- True kitchen display chain (Square KDS is basic)

## Data sources required
- **Square API** (free, OAuth) — Catalog, Orders, Payments, Tenders, Shifts
- **Square Dashboard CSV exports** as fallback
- For 3P reconciliation: still need each 3P partner's settlement statements

## Can claim (`Verified`)
- per-location net sales (net of processing + refunds), tender mix, hourly labor cost
- per-employee net sales (when employee linked at order time)
- inventory count when tracking is enabled

## Cannot claim (must `Estimated`)
- 3P channel mix unless reconciled against partner statements
- food cost % when inventory tracking is not enabled
- labor % when Shifts is not enabled

## Cannot claim (refuse)
- prime cost without invoice ingestion
- to override Square's own reconciliation when the API and operator's bank deposits diverge

## Calibration questions (for operator intake)
1. Which Square products enabled? (POS / Online / Loyalty / Marketing / Shifts / Payroll / Banking)
2. Are 3P platforms rung manually or via direct integration (Otter / Deliverect)?
3. Is inventory tracking on?
4. Tipping policy — pooled / individual / off?

## Cross-references
- **Toast** — sibling POS; sub-5-unit operators on Square; multi-unit operators on Toast
- **3P Aggregator** — Square 3P attribution requires Tier 2 reconciliation
- **DoorDash / Uber Eats / GrubHub** — settlement statements cross-checked against Square deposits
- **Excel / CSV parser** — Square dashboard exports are a clean fallback
