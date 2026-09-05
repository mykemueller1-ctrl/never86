# Clover (Tier 1 — POS)

**Status:** scaffold — common in independent restaurants and bars; Fiserv-owned, sold through merchant-services resellers
**Reports to:** every Tier 2 aggregator

## What this agent knows

Clover is sold primarily through merchant-services partners (Bank of America, Wells Fargo, smaller ISOs). The hardware-as-distribution model means most operators got Clover bundled into a payment processing deal, not selected on merit.

### Clover data shapes
- **Items** — name, price, category, modifier groups
- **Orders** — line items, payment, employee, table/order type
- **Payments** — clean per-payment with processor fees broken out
- **Tip allocations** — per employee, per shift
- **Employees** — clock-in/out via Clover hardware
- **Tax rates** — per-location

### The trap (Clover-specific)
- **Processing fees are NOT standardized** — Clover hardware sits on top of whatever rate the ISO negotiated. Effective rate can be anywhere from 2.3% to 3.5%+ depending on who sold it. Operators often don't know their own rate.
- **Reporting is split across Clover Dashboard + the ISO's portal** — the operator's own ISO controls deposit timing, fee disclosure, and chargeback display. Reconciliation requires both.
- **API access requires Clover Developer credentials + the merchant's MID approval** — can be friction-heavy to enable for a third party

### Clover plans (as of mid-2026)
- **Register Lite** — basic POS, ~$60/mo
- **Register** — full features, ~$90/mo
- **Plus** — restaurant-tuned, ~$125-200/mo
- **Hardware**: Mini, Station, Flex, Solo — purchased or financed through ISO
- **Processing** — separate, set by ISO, often the largest cost

### What's strong for the operator
- Hardware is solid and operator-friendly (touchscreens, kitchen tickets, customer-facing display)
- Apps marketplace (sub-$10/mo add-ons for inventory, scheduling, loyalty)
- Bundled processing means one bill, one vendor

### What's weak
- Multi-location aggregation across Clover devices is clunky — each device often acts independently
- Deep reporting requires exports and external joins
- Processing-fee opacity is the #1 leak surface

## Data sources required
- **Clover REST API v3** — Orders, Payments, Employees (requires merchant OAuth)
- **Clover Dashboard CSV exports** as fallback
- **ISO statement** for true processing rate
- **Operator's bank deposit history** for settlement reconciliation

## Can claim (`Verified`)
- per-device net sales, items, modifiers
- employee labor hours when Clover Shifts is the system of record
- tax breakdown per period

## Cannot claim (must `Estimated`)
- effective processing rate until ISO statement is in hand
- 3P channel mix unless rung through Clover or reconciled against 3P statements
- multi-location aggregate without explicit roll-up scripting

## Cannot claim (refuse)
- to opine on ISO contract terms (operator's lawyer / sales rep)
- to verify processing rates from anything other than the ISO statement itself

## Calibration questions (for operator intake)
1. Who is your processor / ISO? (Bank of America, Wells, FIS, Heartland, local?)
2. What's your contracted card-present processing rate?
3. Multi-location: aggregated in Clover Inc, or separate merchant accounts per store?
4. Which apps are enabled? (Tip Pooling, Inventory, Scheduling, Customer Engagement)

## Cross-references
- **Toast / Square** — sibling POS specialists; Clover targets a different operator profile (often bar-forward, lower ticket counts, ISO-led sales)
- **3P Aggregator** — Clover 3P reconciliation, like Square, depends on partner statements
- **Excel / CSV parser** — Clover Dashboard CSVs are the universal fallback
