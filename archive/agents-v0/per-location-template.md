# Per-Location Agent Template (Tier 2 — one instance per store)

**Status:** template — instantiates 16 times for the chef-led 16-unit group; pattern is reusable for any operator
**Reports to:** the Network Aggregator (cross-store comparison) + the operator's role-views

## What this agent is

A digital twin of a store GM. Each location gets one instance, calibrated to that store's specific trade area, jurisdiction, anchor presence, and historical performance pattern. The 16 instances for the chef-led 16-unit group:

| Store | Jurisdiction | Notes |
|---|---|---|
| #101 Falls Church | VA — Fairfax Co | Origin store |
| #102 Vienna | VA — Fairfax Co | Highest first-party % (58.9%) |
| #103 Springfield | VA — Fairfax Co | |
| #105 Fairfax | VA — Fairfax Co | |
| #106 Arlington | VA — Arlington Co | |
| #107 Rockville | MD — Montgomery Co | Network top offender (Luis Hernandez) |
| #108 Alexandria | VA — Alexandria City | |
| #109 Gaithersburg | MD — Montgomery Co | |
| #110 Herndon | VA — Fairfax Co | Highest net sales ($1.32M) |
| #111 Washington | DC | Lowest first-party % (22.4%) — major lever |
| #112 Arlington | VA — Arlington Co | Low first-party (28%) |
| #113 Fairfax | VA — Fairfax Co | Lowest void rate (0.19%) |
| #114 Richmond | VA — Henrico Co | |
| #115 Sterling | VA — Loudoun Co | |
| #201 Raleigh | NC — Wake Co | |
| #301 Nashville | TN — Davidson Co | Late-night override active; Jose Medrano flag |

## What each instance owns

For its specific store:

- **Own performance** — the POS / 3P / loyalty / void / discount data scoped to that location
- **Competitive ring** — Mexican Heat Map (1.5–3–5 mile zones), halo anchors within 1 mi
- **Permits** — new restaurants / construction / road closures in the radius (via Socrata / per-county portal)
- **Health inspections** — own + competitors' scores
- **Alcohol licenses** — renewals, new entrants in the ring (state ABC)
- **Demographics** — Census ACS block group around the address
- **Traffic** — DOT AADT for adjacent corridors
- **Events** — filtered from the global event feed by geo (sports / venues)
- **Weather** — NOAA station nearest the store
- **Reviews voice** — Google / Yelp / Thanx feedback for *that store only*

## The "Tale of two stores" output

Each instance produces a story:

> "Falls Church (#101): your home market. Premium grocery (Whole Foods 0.4 mi), Sweetgreen + Cava both within walking distance, office density high through 5pm. Heat map: 2 chef-driven Mexican in the 1.5–3 mile ring; no direct overlap inside 1.5. This is the textbook trade area; your 40.2% first-party is right at network median."

> "Washington (#111): your hardest store. Low halo (just one Whole Foods, no premium fitness in 1 mi), low first-party at 22%, top offender 'Guillermo Ulloa' at 2.15% void rate. This is a 3P-acquisition problem, not an ops problem. The lever is moving spend off DD/UE onto Thanx."

> "Nashville (#301): the override store. Late-night (2am) bonus active; not the wrong customer, the right customer at the wrong daypart. Top employee flag: Jose Medrano at 54.5% on $2,782 net — pull the void reasons before the next shift."

## The Network Aggregator (one instance, sits above the 16)

Cross-store comparison: "Falls Church and Vienna have the same competitive density — why is Vienna 23% higher on first-party?" This is the meta-instance that compares the per-location agents' outputs.

## Data dependencies (Tier 1)

All Tier 1 source specialists feed each instance for its location_id:
- Toast (per-store sales, voids, discounts, channel mix)
- DoorDash / Uber Eats (per-store 3P)
- Thanx (per-store loyalty)
- Marqii (per-store listing health)
- EONR (per-store closing reports)
- Trade Area agent (per-store anchor + heat map)

## Can claim (`Verified`)
- own-store metrics scoped to location_id
- own-store anchor presence
- own-store demographics + jurisdiction data

## Cannot claim (must `Estimated`)
- comparative claims across stores until the operator confirms the comparison is fair (different market dynamics)
- forward predictions of store performance

## Cannot claim (refuse)
- to recommend closing a store
- to recommend a manager change based on data alone — surfaces, doesn't decide

## Pre-requisite blockers (operator-specific)
- **16 store addresses + geocodes** (NULL in `operator_locations` today) — backfill needed before any per-location agent fires
- **Jurisdiction registry** built (DC + 6 counties for VA + Montgomery MD + Wake NC + Davidson TN) — Socrata-based for 4 of these, custom for VA counties

## Calibration questions
- Per store: which **market dynamics** does the operator know about that the data wouldn't surface (a corporate office that closed; a new highway interchange; gentrification)?
- Per store: who is the **store-level operator** the GM reports to (area director) — drives where alerts route

## Cross-references
- **Trade Area** — the scoring rubric this agent uses per location
- **Myke Mueller Logic** — Nashville-style overrides are MML-defined
- **Marqii** — per-store listing completeness
- **Network Aggregator** — cross-store comparison (separate meta-instance)
