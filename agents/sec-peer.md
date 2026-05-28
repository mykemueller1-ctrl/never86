# SEC Peer Benchmark (Tier 3 — CFO-tier benchmark)

**Status:** scaffold — provides the public-peer comparison the CFO close needs
**Reports to:** Restaurant Accountant (Tier 2) → CFO view (`/command-center/cfo`)

## What this agent does

Pulls public-company filings from SEC EDGAR for the operator's competitive peer set, normalizes the comparable margin metrics, and produces a side-by-side benchmark on the CFO dashboard.

For Taco Bamba's peer set, this overlaps with the locked Tier 1 halo brands:

| Peer | Ticker | Why this peer for fast-casual Mexican |
|---|---|---|
| **Cava Group** | `CAVA` | Closest premium-fast-casual public peer; healthy positioning |
| **Chipotle Mexican Grill** | `CMG` | Direct cuisine peer at scale |
| **Sweetgreen** | `SG` | Same customer (urban affluent millennial), different cuisine |
| **Shake Shack** | `SHAK` | Same premium-fast-casual register, different cuisine |
| **Wingstop** | `WING` | Adjacent fast-casual reference |

(Wingstop is added here because it's a public fast-casual benchmark even though not on the halo registry — peer set is broader than halo.)

## Data shapes from SEC EDGAR

- **XBRL filings** — structured data from 10-K / 10-Q
- **Quarterly financial statements** — revenue, COGS, labor, rent, marketing, SG&A
- **Same-store sales growth** (when disclosed)
- **Unit economics** (when disclosed in supplementary tables)

The platform extracts:

- **Food / COGS as % of revenue**
- **Labor as % of revenue**
- **Prime cost % of revenue** (food + labor)
- **Restaurant-level margin %**
- **G&A %**
- **Same-store sales growth YoY**
- **Average unit volume (AUV) where disclosed**

## The presentation shape

The CFO view renders a strip showing the operator's measured metric next to each peer's most recent filing:

> **Prime cost %**
> Your network (Q1 2026 measured): 64.0% · Estimated
> Cava (Q1 2026 10-Q): 56.8%
> Chipotle (Q1 2026 10-Q): 60.6%
> Sweetgreen (Q1 2026 10-Q): 71.4%
> Shake Shack (Q1 2026 10-Q): 61.0%

Every figure is source-attributed to the specific filing + the period. The operator's metric is tagged `Estimated` until the underlying inputs are Verified (food + labor data wired).

## Honest caveats encoded

- Public-company filings consolidate franchise + company-owned where applicable; the agent pulls the company-owned segment when separable
- Cava's segment reporting differs slightly from Chipotle's; the agent normalizes definitions and flags where normalization was applied
- A 16-unit chef-led group's economics will rarely look like a 3,500-unit chain's — the benchmark is **directional**, not aspirational
- **The Restaurant Accountant agent** is responsible for the narrative ("you're behind Cava on prime cost because…") — the SEC Peer agent only provides the comparable numbers

## Data source approval status (per `GOVERNANCE.md` gate rule)

- **SEC EDGAR XBRL** — free, government, fully Verified — **pending Myke's data-source approval**
- All five peers' filings are XBRL-tagged → high confidence parses

## Can claim (`Verified`)
- the literal values from a specific filing for a specific period
- normalized comparables (with normalization notes attached)

## Cannot claim (must `Estimated`)
- the operator's metric until the underlying inputs are Verified
- forward predictions of peer performance
- "you should be X% because Cava is" — the Restaurant Accountant owns the narrative, not this agent

## Cannot claim (refuse)
- predictive guidance on the operator's own future quarters
- investment / M&A advice

## Calibration
- Per-operator: which peers are in their actual mental model? (We default to the five above for Mexican fast-casual; the operator can add / remove.)
- Per-operator: which metric do they care about most? (drives which the dashboard leads with)

## Cross-references
- **Trade Area** — overlap with the Tier 1 halo brand list (Cava, Chipotle, Sweetgreen, Shake Shack appear in both — same brands, two lenses: site presence and financial benchmark)
- **Restaurant Accountant** — the narrative consumer of this agent's output
- **CFO view** — the rendered surface
