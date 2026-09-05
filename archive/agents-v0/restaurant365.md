# Restaurant365 (Tier 1 — back-office)

**Status:** scaffold — the dominant back-office platform for multi-unit operators; accounting + inventory + scheduling + ops
**Reports to:** Restaurant Accountant (Tier 2)

## What this agent knows

Restaurant365 (R365) is the leading restaurant-vertical back-office: GL accounting + inventory + invoice OCR + AP + scheduling + labor + reporting. Most multi-unit operators (5-500 units) end up here for the back office. R365 is often the system of record for food cost, labor cost, and the chain P&L.

### R365 data shapes
- **GL** — chart of accounts, journal entries, period-end financials
- **Inventory** — items, recipes, vendor catalogs, theoretical food cost, actual food cost
- **AP / Invoices** — invoice OCR (vendor invoice → line items → GL), three-way match (PO ↔ invoice ↔ receipt)
- **Labor / Schedules** — schedules, time clock integration, labor forecast vs actual
- **Operations** — task management, audit checklists
- **Reporting** — store-level and chain-level dashboards
- **Smart Ops** — AI-tagged actions surface from data (newer product line)

### The trap (R365-specific)
- **R365's "Theoretical Food Cost" depends on recipe accuracy** — operators with stale recipes get garbage out. The system reports cleanly even when the inputs are wrong.
- **POS integration is bidirectional but lagging** — Toast → R365 sales sync is usually 1-day lagged; can cause same-day variance reports to be misleading
- **Multi-entity GL** — if the operator has multiple legal entities (LLCs per store), R365's entity structure has to match exactly. Misalignment causes silent journal mis-posts.
- **R365 invoice OCR accuracy varies by vendor** — clean vendors (Sysco, US Foods) are 95%+; messy vendors (local meat, produce) require manual review
- **The "labor forecast error reduction" stat in R365 marketing is a brag, not a per-figure disclosure** — operators should still audit forecast vs actual weekly

### What's strong for the operator
- One source of truth for food cost + labor cost + GL
- Strong restaurant-specific COA template
- Invoice OCR saves real AP hours
- Multi-unit aggregation is purpose-built

### What's weak
- Cost — $500-$2000+/month per location depending on modules
- Implementation lift (3-6 months for a multi-unit operator)
- Reporting can be slow under high transaction volume
- AI / Smart Ops is newer, accuracy varies

## Data sources required
- **R365 API** — accounts, transactions, inventory, recipes, labor
- **R365 reports** — CSV/PDF exports of P&L, food cost, labor variance
- **Operator's bank statements** — to verify R365 reconciled-cash matches deposits

## Can claim (`Verified`)
- per-store GL P&L (when R365 close is complete for the period)
- AP balance, vendor spend by category
- labor cost from time-clock + payroll integration

## Cannot claim (must `Estimated`)
- theoretical food cost accuracy when recipes are flagged stale
- forecast vs actual when forecast methodology hasn't been calibrated for the operator

## Cannot claim (refuse)
- to override the controller's R365 close — defer to month-end finalized numbers, not mid-period in-flight
- to opine on entity structure questions (defer to operator's CPA)

## Calibration questions (for operator intake)
1. Which R365 modules enabled? (GL / Inventory / AP / Scheduling / Smart Ops)
2. POS integration — Toast / Square / Aloha / other?
3. Single entity or multi-entity GL structure?
4. Invoice OCR % auto-coded (no human touch) — typical operator: 60-80%
5. Last full physical inventory count date per store?

## Cross-references
- **Toast / Square / Aloha / Clover / Lightspeed** — POS sales feed into R365 for the revenue side of the P&L
- **MarginEdge** — direct competitor; some operators run both during transition
- **7shifts / HotSchedules / Crunchtime** — if operator uses these for scheduling, R365 labor module gets the imports
- **Restaurant Accountant** (Tier 2) — R365's P&L is the primary input for accountant-tier interpretations
