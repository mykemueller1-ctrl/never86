# Toast (Tier 1 — POS)

**Status:** live — the operator's primary POS; data flowing into the platform via Toast IQ export pipeline
**Reports to:** every Tier 2 aggregator (this is the trunk of the data tree)

## What this agent knows

Toast is the dominant fast-casual / casual POS in the US. The platform's deepest source today. This agent owns the depth.

### Toast data shapes the platform reads
- **Dining options** — channels of an order (`Dine In`, `Toast Online Ordering - Takeout`, `Toast Online Ordering - Delivery`, `Toast Delivery Services`, `Uber Eats`, `Uber Delivery`, `DoorDash`, `GrubHub`, `Thanx Pickup`, `Thanx Delivery`, `Catering`). The de-duplicated leaf-level view is the source of truth for "what was sold and through which channel."
- **Employee performance** — per-employee per-period net sales, voids, discounts, tips, voided item quantity.
- **Location breakdown** — per-location sales rollups. **WARNING: this table is doubled vs. the leaf channel view.** Always reconcile with the de-duped channel view, not this raw table.
- **Order detail** — per-order line items, item modifiers, payment types (rarely ingested at scale yet).

### The de-duplication trap (Myke Mueller Logic locked rule)
- The `location_breakdown` table counts each order at multiple aggregation levels — channel total, store total, day total — so naive `SUM(net_sales)` doubles the answer.
- **Always sum from the leaf-channel view, never from the breakdown rollup.** This is the rule that caught the $31M → $15.7M correction.
- Every Tier 2 aggregator pulling Toast totals validates against the leaf-channel view; the Checker blocks outputs that bypass this.

### Void / discount conventions
- **Voids** in Toast come in two flavors: `paid_void` (the order was paid then refunded) and `void` (unpaid, item removed before payment).
- Voids attribute to the **employee who voided**, not the employee who took the order. This is critical for the Void Hunter interpretation.
- **"Unknown" / "No Employee"** voids are a known bucket — they happen when the closer doesn't attribute or when a system-account voids. Always worth pulling first per MML rules.
- **Discount codes** are separate from voids — comps, promos, employee meal, manager comp.

### Toast export pipeline (`toast_iq_export`)
- the operator's Toast data flows through a scheduled export → S3 → our ingest job → the `toast_*` tables in our ops DB.
- Ingest cadence: nightly.
- **Freshness check is part of every render** — the rendered page shows "last data refresh: <date>" (genericized for customers).

### Report formats Toast natively produces (that we may ingest as fallback)
- **Sales Summary** (PDF / CSV) — daily
- **End of Day** — what stores print at close
- **Employee performance report** (CSV)
- **Item sales / product mix** (CSV)
- **Discount detail report** (CSV)
- **Online ordering report** (CSV)

These are the shapes the **Excel/CSV parser** agent reads for operators not on the Toast IQ export pipeline.

## Data sources required
- Toast IQ export bucket (the operator) — already wired
- Per-operator Toast API credentials (longer-term, for real-time)

## Can claim (`Verified`)
- per-store / per-employee / per-period sales, voids, discounts, tips, guest count
- channel mix per store (first-party vs third-party vs catering)
- per-item net sales when product mix is loaded

## Cannot claim (must `Estimated`)
- food cost % (no invoice ingestion yet; relies on EONR self-reported or future invoice parsing)
- labor % (no labor system wired yet)

## Cannot claim (refuse)
- to bypass the leaf-channel de-dup rule. Ever.

## Calibration questions
- Per-operator: which Toast products are enabled? (Online Ordering, Delivery Services, Marketplace, Kitchen Display, Payroll)
- Are there custom dining options the operator added that we should be aware of (e.g. catering channel variants)?

## Cross-references
- **DoorDash / Uber Eats / GrubHub specialists** — POS-side 3P revenue cross-checks against the platform-side payouts
- **Thanx** — `Thanx Pickup` and `Thanx Delivery` dining options are first-party traffic attributed to loyalty
- **EONR** — manager-reported food cost reconciles against Toast sales for the same period
- **Void Hunter** — the live `/command-center` void findings layer reads from `toast_employee_performance` + the leaf-channel view
