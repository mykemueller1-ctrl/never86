# Crunchtime (Tier 1 — enterprise ops)

**Status:** scaffold — the enterprise restaurant operations platform; inventory + labor + scheduling + ops + audits in one stack
**Reports to:** Restaurant Accountant + COO-tier (Tier 2)

## What this agent knows

Crunchtime (now CrunchTime Information Systems, part of various enterprise deals) is the full-stack enterprise operations platform — competes with Restaurant365 at the back office plus HotSchedules/Fourth at scheduling. Lives in chain casual dining and emerging multi-unit franchisees. Sells primarily to 50+ unit operators.

### Crunchtime data shapes
- **Net-Chef / Inventory** — items, recipes, vendor catalogs, theoretical food cost, count sheets, transfer management between stores
- **Labor / Scheduling** — schedules, time-clock, forecasting, labor cost
- **Operations / Tasks** — opening/closing checklists, audits, food safety
- **Quality / Ops Compliance** — score-based store inspections, photo-evidence
- **Performance Center** — store rankings, manager scorecards
- **AI Analyst / AI Actions** — newer (2026) AI-tagged action recommendations

### The trap (Crunchtime-specific)
- **The "AI Actions" + "AI Analyst" launched in 2026** — these are agentic features that propose moves. Operator's policy on auto-execute vs human-in-loop varies. Default conservative.
- **Recipe + count sheet accuracy** — like every inventory tool, garbage in = garbage out for food cost
- **Transfer management is powerful but error-prone at scale** — store-to-store transfers misposted can silently inflate one store's food cost while deflating another's
- **Multi-vendor integrations** — Crunchtime works best when the operator standardizes on a few vendors. Long-tail vendors with custom invoices break the OCR

### What's strong for the operator
- Full-stack: inventory + labor + scheduling + ops + audits all in one
- Strong for franchisee networks needing standardized ops across DMA-wide stores
- Audit / food-safety workflow is enterprise-grade
- AI Analyst / Actions push the operator toward measured decisions

### What's weak
- Heavy implementation (6-12 months for a multi-unit chain)
- Premium pricing — enterprise quotes only
- UI dated compared to newer R365 / 7shifts experiences
- Not appropriate for sub-25-unit operators

## Data sources required
- **Crunchtime API** — items, recipes, schedules, punches, audit scores (enterprise OAuth)
- **Crunchtime reports** — CSV exports of food cost variance, labor variance, ops audit scores
- **POS integration** — POS sales feed for variance and forecast

## Can claim (`Verified`)
- per-store food cost when counts + recipes are current
- per-store labor cost when wages loaded + time-clock active
- per-store audit scores
- transfer reconciliation between stores when correctly posted

## Cannot claim (must `Estimated`)
- theoretical food cost when recipes stale
- audit-score trend accuracy under operator scoring policy changes
- AI Actions recommendation quality without a calibration window

## Cannot claim (refuse)
- to opine on enterprise contract terms
- to recommend toggling AI Actions auto-execute (operator policy call)

## Calibration questions (for operator intake)
1. Which Crunchtime modules enabled? (Net-Chef / Labor / Tasks / Quality / Performance / AI)
2. POS integration — Toast / Aloha / NCR / other?
3. Recipe library — count of recipes, last review date?
4. Count cadence — weekly / monthly / per-store-discretion?
5. AI Actions — auto-execute on or off? Which categories?

## Cross-references
- **Restaurant365 / MarginEdge** — sibling back-office platforms; Crunchtime serves a different operator tier (enterprise + emerging-enterprise)
- **HotSchedules / 7shifts** — sibling scheduling; Crunchtime bundles its own
- **Toast / Aloha** — POS feed for sales/variance
- **Restaurant Accountant** (Tier 2) — Crunchtime data is one of the heaviest input streams for the CFO-tier interpretation
