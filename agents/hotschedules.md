# HotSchedules (Tier 1 — labor + scheduling)

**Status:** scaffold — enterprise scheduling platform; common in casual-dining chains 50+ units; now part of Fourth
**Reports to:** Restaurant Accountant + COO-tier (Tier 2)

## What this agent knows

HotSchedules (Fourth Enterprise) is the legacy enterprise scheduling platform. Lives in mid-to-large casual dining (Applebee's franchisees, Buffalo Wild Wings, Dine Brands, etc.). More configurable than 7shifts, more complex to operate, stronger at multi-unit at scale.

### HotSchedules data shapes
- **Schedules** — built per-week from forecast → template → published
- **Time clock** — punches via web, mobile, or store-level terminal
- **Forecasting** — sales forecast → labor target → schedule (the loop)
- **Labor budget** — defined per role, per daypart, per store
- **Employee profiles** — wage, role, availability, training, certifications
- **Tasks** — manager checklists, opening/closing duties
- **Inventory** — Fourth's inventory module integrates if licensed

### The trap (HotSchedules-specific)
- **Forecast model is "black-boxy"** — operators don't always see how the forecast was generated; if it's wrong, the only signal is variance
- **Multi-entity setup** — franchisees with multiple legal entities need careful HotSchedules setup or labor data ends up cross-attributed
- **The merger with Fourth means two product UIs** — operators on legacy HotSchedules vs Fourth-unified see different things; data export shapes differ
- **API access is enterprise-tier-gated** — requires Fourth account-manager approval and often a separate API agreement

### What's strong for the operator
- Battle-tested at the 50-500 unit franchisee scale
- Strong forecasting engine when calibrated
- Compliance breadth (handles weird state labor laws, union rules)
- Manager log + task workflow

### What's weak
- UX is dated compared to 7shifts (staff complain)
- Implementation is heavy
- Pricing is enterprise — typically $80-$200/mo per location
- Reports are powerful but slow

## Data sources required
- **HotSchedules / Fourth API** — schedules, punches, forecast, labor (requires enterprise OAuth)
- **HotSchedules reports** — CSV exports of labor variance, forecast accuracy, hours by employee
- **POS integration** — POS sales feed for forecast vs actual

## Can claim (`Verified`)
- per-shift, per-employee actual hours from time-clock
- per-store labor cost (when wages loaded)
- forecast vs actual variance per shift

## Cannot claim (must `Estimated`)
- forecast accuracy expectation — operator-by-operator; calibration history matters
- multi-entity rollup if entities aren't unified in HotSchedules setup

## Cannot claim (refuse)
- to bypass operator's collective bargaining / union rule configuration (defer to operator's HR / labor counsel)
- to interpret Fourth contract terms

## Calibration questions (for operator intake)
1. Legacy HotSchedules UI or unified Fourth UI?
2. Which Fourth modules enabled? (Scheduling / Time / Tasks / Inventory / Manager Log / Engagement)
3. POS integration — POS sales feeding forecast?
4. Multi-entity setup — single Fourth tenant or per-entity?
5. Forecast accuracy band the operator targets? (typical: ±5% on labor cost)

## Cross-references
- **7shifts** — sibling scheduling platform; HotSchedules at enterprise / franchisee scale, 7shifts at independent / emerging
- **Homebase / Toast Scheduling** — sibling at the small-operator tier
- **Crunchtime** — sibling enterprise ops platform; some operators run both
- **Restaurant365** — back-office system; consumes HotSchedules labor for P&L
