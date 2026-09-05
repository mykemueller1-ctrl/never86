# Aloha (Tier 1 — POS)

**Status:** scaffold — the legacy enterprise POS for full-service and casual-dining brands; NCR Voyix-owned
**Reports to:** every Tier 2 aggregator

## What this agent knows

Aloha (also marketed as NCR Aloha) is the legacy enterprise POS that dominated full-service casual dining for two decades. Still entrenched in regional and national casual-dining chains (Outback, Texas Roadhouse, Brinker brands historically used it). The data is rich but the access layer is the friction.

### Aloha data shapes
- **DBF / GND files** — Aloha's native file format; per-store, per-day, written to local file shares
- **EDC (Electronic Draft Capture)** — payment authorization logs
- **Aloha Insight** / **NCR Reporting** — the corporate roll-up product
- **Connect / Configuration Center** — multi-unit menu and pricing management
- **Aloha Online Ordering** — separate add-on, separate data store

### The trap (Aloha-specific)
- **The "Net Sales" definition varies by report** — Aloha has Gross Sales, Net Sales, Reportable Sales, Taxable Sales, and they're all different. Most reports default to "Net Sales" = gross minus comps and discounts but BEFORE refunds. Reconciliation requires matching to the operator's GL definition.
- **Per-store data lives in flat files written by the local POS server** — pulling chain-wide requires either NCR Insight (paid) or per-store SFTP credentials
- **API access is enterprise-gated** — Aloha Cloud / API access typically requires NCR account-manager approval and an enterprise agreement

### Aloha modules commonly seen
- **Aloha Quick Service** — counter-service variant
- **Aloha Table Service** — sit-down restaurants
- **Aloha Kitchen** — KDS / kitchen video
- **NCR Pulse Real-Time** — manager mobile dashboard
- **Aloha Loyalty** — operator loyalty program
- **Aloha Online Ordering** — branded ordering, mid-2020s product

### What's strong for the operator
- Battle-tested for high-volume table service (handles 10,000+ orders/day per store reliably)
- Deep modifier and check-management capabilities
- Strong server / table management workflows

### What's weak
- The data access layer
- Cloud-native reporting is a paid add-on; without it, every store is its own island
- Loyalty + online ordering trail Toast/Thanx natively

## Data sources required
- **NCR Insight / Pulse** — corporate roll-up (paid; check what tier operator has)
- **Per-store SFTP** to the Aloha server — if Insight isn't licensed
- **Aloha Configuration Center** — for menu and pricing audit
- **Operator's GL** — to reconcile which "Net Sales" definition is authoritative

## Can claim (`Verified`)
- per-store sales, comps, discounts, voids by employee
- check counts, average check, daypart breakdown
- modifier-level item sales when the operator runs PMix daily

## Cannot claim (must `Estimated`)
- chain-wide rollups when only some stores' files are accessible
- food cost % until invoice + recipe ingestion (Aloha doesn't natively own food-cost)

## Cannot claim (refuse)
- to bypass the operator's GL definition of Net Sales — defer to whatever the controller stands behind
- to opine on enterprise contract terms with NCR

## Calibration questions (for operator intake)
1. Aloha Quick Service or Table Service?
2. Is NCR Insight / Pulse licensed? Which tier?
3. Aloha Online Ordering enabled, or 3P-only for digital?
4. Aloha Loyalty enabled, or Thanx/Punchh sitting on top?
5. Which "Net Sales" report definition does the controller use for the GL?

## Cross-references
- **Toast / Square / Clover** — sibling POS specialists; Aloha lives in a different operator profile (chain casual dining, often legacy 1995-2015 deployments)
- **Excel / CSV parser** — Aloha Insight CSV exports are the universal fallback when API is gated
- **Restaurant Accountant** — for GL definition reconciliation
