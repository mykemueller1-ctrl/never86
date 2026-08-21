# Lightspeed Restaurant (Tier 1 — POS)

**Status:** scaffold — strong in coffee shops, bakeries, smaller full-service; the K-Series (formerly Kounta) is the restaurant-focused variant
**Reports to:** every Tier 2 aggregator

## What this agent knows

Lightspeed Restaurant (formerly Upserve + Kounta + iKentoo before the rebrand) covers a smaller niche than Toast / Square / Clover but is common in chef-driven independents, coffee shops, bakeries, and Australia/Europe operators expanding into the US.

### Lightspeed data shapes
- **Items** + categories + variations + modifiers
- **Orders** — line items, payment, server, table
- **Payments** — Lightspeed Payments processor or third-party (Worldpay, etc.)
- **Inventory** — built-in inventory + recipe-cost capability (stronger native than Square/Clover)
- **Staff** — clock-in/out, role, hourly rate
- **Customers** — built-in CRM
- **Floor plan** — table state and order

### The trap (Lightspeed-specific)
- **Pre-rebrand reporting tools still exist for legacy customers** — operators on the old Upserve UI vs new Lightspeed Restaurant UI see different reports. Naming and definitions are NOT consistent across the two.
- **Lightspeed Payments take-rate is real** — processing through Lightspeed itself is convenient but typically 2.6%+ effective; some operators pay 2.0-2.3% through external processors with worse integration
- **Multi-location aggregation is in active development** — chain-level dashboards still feel single-store-stitched-together for some operators

### Lightspeed Restaurant plans
- **Essentials** — basic POS
- **Plus** — adds inventory + analytics
- **Pro** — adds Loyalty + Lightspeed Capital eligibility
- **Enterprise** — multi-unit aggregation, custom pricing

### What's strong for the operator
- Native inventory + recipe costing (rare among POS at this tier)
- Floor plan + table management for full-service
- Strong international presence — operators with US + global units get one stack
- Lightspeed Loyalty bundled at the Pro tier

### What's weak
- Multi-unit corporate reporting (improving but trails Toast IQ)
- 3P delivery integrations (typically routed via Otter / Deliverect, not native)
- Smaller US partner ecosystem than Toast

## Data sources required
- **Lightspeed Restaurant API** — Orders, Items, Payments, Staff (OAuth, account-manager-approved for chains)
- **Lightspeed Insights / Reports** — UI exports as CSV fallback
- **Upserve legacy reports** — for operators not yet migrated

## Can claim (`Verified`)
- per-location sales, item mix, modifier breakdown
- inventory-derived food cost (when operator runs counts diligently)
- labor cost from Lightspeed Schedule + Time when both are enabled

## Cannot claim (must `Estimated`)
- chain-wide aggregate across legacy and new-UI stores until they unify
- 3P channel mix without the Otter/Deliverect side reconciled

## Cannot claim (refuse)
- to opine on Lightspeed Capital / financing offers
- to bypass operator-set inventory definitions (FIFO / WAC / Standard)

## Calibration questions (for operator intake)
1. Lightspeed Restaurant (new UI) or Upserve (legacy)?
2. Which plan tier? (Essentials / Plus / Pro / Enterprise)
3. Lightspeed Payments or third-party processor?
4. Inventory tracking on with daily counts, or estimate-only?
5. 3P delivery routing — Otter / Deliverect / native / not used?

## Cross-references
- **Toast / Square / Clover / Aloha** — sibling POS specialists; Lightspeed serves the chef-driven independent + international segment
- **3P Aggregator** — Lightspeed 3P reconciliation routes through Otter/Deliverect for most operators
- **Excel / CSV parser** — Lightspeed Insights CSV is the fallback
