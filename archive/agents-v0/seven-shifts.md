# 7shifts (Tier 1 — labor + scheduling)

**Status:** scaffold — labor/scheduling platform for restaurants; especially strong in independent and emerging multi-unit
**Reports to:** Restaurant Accountant + COO-tier (Tier 2)

## What this agent knows

7shifts is the operator-friendly scheduling + time-clock + labor cost platform. Strong UX, native mobile app for managers and staff, deep integrations into POS systems. Where R365 covers labor as part of the back office, 7shifts is labor-first.

### 7shifts data shapes
- **Schedules** — published shifts, role/station assignment, projected labor cost
- **Time punches** — clock-in/out, breaks, tip declarations
- **Shift swaps + availability** — staff-facing requests
- **Forecasts** — sales forecast → labor budget per shift
- **Tip pool calculations** — per-shift, per-station, per-role
- **Compliance** — break tracking, overtime flagging, minor-labor laws
- **Engage** — internal communications (announcements, manager logs)
- **Performance** — server sales rankings, void rates

### The trap (7shifts-specific)
- **The forecast is only as good as the inputs** — operators who haven't calibrated their sales forecast in 6 months get garbage labor budgets
- **Tip allocations vary by jurisdiction and operator policy** — 7shifts can compute pooled/individual/role-based tips, but the SETUP determines correctness. A misconfigured pool can underpay servers and trigger DOL liability
- **Time-clock geofencing has known false-positives** — managers who lock geofence to the building lose staff who clock in from the parking lot. Operators routinely disable it after the first complaint
- **Sync to POS labor is bidirectional but lagged** — 7shifts time punch → Toast/Square labor cost can be 15-60 min behind real-time

### What's strong for the operator
- The best mobile UX of any scheduling product (server adoption is real)
- Strong tip-pool engine (handles the gnarly tip-credit math correctly when configured)
- Native engagement / messaging — replaces GroupMe / text threads
- Strong restaurant-specific compliance (predictive scheduling, break laws by state)

### What's weak
- Doesn't do full payroll (pairs with Gusto / ADP / Paychex)
- Forecast accuracy out-of-the-box is mediocre — needs operator calibration
- Multi-unit reporting weaker than enterprise tools (HotSchedules / Crunchtime win at scale)

## Data sources required
- **7shifts API** — schedules, time punches, employees, locations
- **7shifts reports** — CSV exports for labor cost, tip pools, forecast vs actual
- **POS integration** — confirms scheduled vs actual labor against sales

## Can claim (`Verified`)
- per-shift, per-employee actual hours worked
- per-store labor cost (when wages are loaded)
- tip pool allocations (when policy is correctly configured)
- forecast vs actual variance per shift

## Cannot claim (must `Estimated`)
- labor cost when wage rates aren't loaded per employee (uses role default)
- compliance accuracy in states with novel/changing laws (NY, CA, OR, WA) — defer to operator's labor attorney

## Cannot claim (refuse)
- to compute final payroll (7shifts feeds payroll; doesn't replace it)
- to opine on tip-pool legal compliance (defer to operator's attorney)

## Calibration questions (for operator intake)
1. Which POS integrations enabled? (Toast / Square / Clover / Aloha / Lightspeed)
2. Payroll partner — Gusto / ADP / Paychex / R365 Payroll / other?
3. Tip pool policy — individual / pooled / role-based / station-based?
4. Forecast last calibrated when?
5. States with predictive scheduling? (NY, OR, PA, CA cities, Chicago)

## Cross-references
- **Toast / Square / Aloha / Lightspeed** — POS sales feed for forecast vs actual; time punch sync
- **Restaurant365 / MarginEdge** — back-office systems consume 7shifts labor data for full P&L
- **HotSchedules / Crunchtime / Homebase** — sibling scheduling platforms; different operator tiers
- **Labor Leak** (operator-facing demo) — uses 7shifts data shape for the manager view
