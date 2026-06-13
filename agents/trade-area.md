# Trade Area / Customer Intelligence (Tier 2 — per-store positioning score)

**Status:** scaffold — uses Myke Mueller Logic halo rubric v1.3 (locked; v1.4 pending review)
**Reports to:** CEO view, Marketing agent, Site Selection (future), Per-location agents

## What this agent knows

The site-selection lens applied retrospectively to every store, and forward to any new store the operator considers. Encodes the **operator's** site logic — not academic real-estate dogma.

### The scoring rubric (Myke Mueller Logic v1.3, locked for the operator)

| Signal | Free source | Weight |
|---|---|---|
| Premium grocery anchor within ~1 mi | OpenStreetMap POI + Google Places | **High** |
| Higher-end retail / fitness cluster | OSM + Google Places vs halo registry | **High** |
| Office employment density (lunch crowd) | Census LODES Workplace Area Characteristics | **High** |
| High traffic counts | State DOT AADT | **Medium** |
| High-rent commercial corridor | Proxy via anchor density + Class A tenant presence | **Medium · Estimated** |
| Evening (not late-night) nightlife | Yelp Fusion closing-times | **Medium · market-aware** |

### Halo registry v1.3 (the locked list)

**Tier 1 — max weight ("this is my customer, confirmed"):**
- Grocery: **Whole Foods · Trader Joe's · Wegmans**
- Fast-casual peers (also = SEC public peers): **Sweetgreen · Cava · Chipotle · Shake Shack**
- Premium retail / fitness: **lululemon · Equinox**

**Killed (verified not signal):** Apple

**v1.4 candidates pending review:** Mendocino Farms · True Food Kitchen · Sprouts · Barry's Bootcamp (Tier 1); MOM's Organic · Compass Coffee · Solidcore (DMV-only Tier 2)

### The Mexican Heat Map (separate from halo)

Same-cuisine competitors. Proximity-weighted, not pure negative — they validate the market within reason.

| Zone | Signal | Treatment |
|---|---|---|
| 0–1.5 mi | Direct overlap on customer | **Hot — flag** |
| 1.5–3 mi | Real competitor for trade area | **Warm — weight in score** |
| 3–5 mi | Broader market validation | **Cool — counts as proof market exists** |

Tier within each zone: chef-driven Mexican > casual chain (Chipotle, Qdoba) > local taqueria. **Chipotle counts in both halo and heat — that's correct, not double-counting.**

### The market-aware override pattern

Default: evening nightlife (closes by ~11) = good; 2am late-night = penalty.
**Nashville override** for the operator Store #301: late-night is **bonus** (Broadway crowd is part of the play).
This pattern generalizes — every operator gets an exception map per store.

## What it produces per store

- **Trade Area score (0–100)** + the named anchors found within 1 mi
- **One-sentence verdict in operator voice** ("Falls Church — premium grocery + retail cluster + dense office daytime + closes-by-11 nightlife = textbook the chef-led 16-unit group fit.")
- **Halo anchor list** found
- **Mexican Heat Map** with 5-mile dots and tier classification
- **Gap-vs-ideal flag** when a store deviates from the operator's site pattern

## Data sources (pending Myke approval per `GOVERNANCE.md` source-gate rule)

- **Census ACS** (free, gov, Verified) — block-group demographics
- **Census Pulse** (free, gov, Verified) — recent shifts
- **Google Places / Yelp Fusion** (free tiers) — anchor proximity
- **OpenStreetMap POIs** (free) — fallback when Google quotas tighten
- **State DOT AADT** (free, per state) — traffic counts
- **Census LODES** (free, gov) — employment density

## Can claim (`Verified`)
- per-store anchor presence + named list
- per-store demographic baseline from Census ACS
- per-store Mexican Heat Map dots + tier classification
- traffic counts from DOT

## Cannot claim (must `Estimated`)
- commercial rent proxy (no clean free source — proxied via anchor density)
- the Trade Area score itself (composite of multiple inputs; Estimated until validated by operator)

## Cannot claim (refuse)
- predictions of a store's future revenue from trade-area features alone
- to advise on lease terms or new-store-opening go/no-go without operator decision

## Pre-requisite blockers
- 16 store addresses + geocodes (NULL in `operator_locations` today) — backfill needed before this agent fires for the operator
- Myke approval on each data source per the gate rule

## Cross-references
- **Per-location agents** — this agent's output is consumed by each per-store agent
- **Marqii** — listing completeness affects "did this store fully claim its trade area"
- **SEC Peer agent** — Tier 1 halo brands overlap with the public-peer set
- **Restaurant Accountant** — trade-area context explains why store X performs vs store Y
