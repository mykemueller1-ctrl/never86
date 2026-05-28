# STATE — what's live, what's pending, what's known

Updated: 2026-05-28 (end of session)

The single canonical "what's deployed and what isn't" file. Replaces having to re-trace conversation history.

---

## Live on production (`www.never86.ai`)

| Surface | Status |
|---|---|
| Homepage | Live — dark tactical · three receipts + Stack + trust move + waitlist form |
| `/reports/login` | Live — password-gated entry |
| `/reports/taco-bamba` | Live — $15,706,190 reconciled from de-duped POS view, no methodology shown |
| `/reports/o/[operatorId]` | Live — generic multi-operator report |
| `/command-center` (CEO) | Live — KPIs, exceptions, void findings, store table with bars + "low 1P" chips |
| `/command-center/cfo` | Live — 3P fees + first-party % |
| `/command-center/coo` | Live — exceptions + void findings + (wage benchmark stub) |
| `/command-center/cto` | Live — integration health + source-tag breakdown |
| `/command-center/data` | Live — metric registry + tag counts |
| `/tools/void-hunter` | Live · real data · gated |
| `/tools/3p-fee-finder` | Live · real data · gated |
| `/demo/void-hunter` | Live · public · sample data only |
| `/demo/3p-fee-finder` | Live · public · sample data only |
| `/api/ops-health` | Live · returns `{ok:true, locations:16}` |
| Daily operator brief edge function | Live · sends via Resend (founder@never86.ai) |

## Infrastructure

| | |
|---|---|
| Production deploy | Vercel (project `never86`) — auto-deploys on `main` push |
| Ops DB | Supabase project `zjtbhsouhwyyfwoyjgow` (us-east-1) — pinned to aws-1 Supavisor transaction pooler in code |
| App DB | Neon (separate from ops) |
| Email send | Resend (founder@never86.ai) |
| Methodology leakage in customer surfaces | Stripped (PR #10) — all source lines genericized |
| Source-tag system | Live · Verified / Estimated / Unverified pills on every figure |
| Repo | `mykemueller1-ctrl/never86` · default working branch `claude/never86-website-review-gFMgK` |

## Confirmed in Taco Bamba's actual stack (per emails)

| System | Owner at TB | Agent status |
|---|---|---|
| Toast (POS) | Rik | `toast.md` scaffold + live pipeline |
| Thanx (loyalty) | Charissa | `thanx.md` scaffold |
| Marqii (listings) | Charissa | `marqii.md` scaffold — reports start 6/1 |
| Looker (BI middleware) | Charissa | `looker.md` scaffold — delivery layer for Thanx |
| End of Night Reports | Rik | `end-of-night-reports.md` scaffold — needs Rik on what it's built on |
| DoorDash (3P) | — | `doordash.md` scaffold |
| Uber Eats (3P) | — | `uber-eats.md` scaffold |

## NOT confirmed in TB's stack (yet)

- GrubHub — no evidence in emails; don't assume
- 7shifts / HotSchedules — appear only in Myke's F5Bot Reddit watch feed, not TB usage
- Restaurant365 / MarketMan — same — F5Bot competitive watch, not TB stack
- Payroll system — not yet identified

## Taco Bamba leadership (verified)

| Name | Title (verified from signature) | Lane |
|---|---|---|
| Victor Albisu | Founder / Chef | Brand / culinary |
| Michael Pereira | CEO (since 2024–25 IMC partnership) | Scale / ops |
| Rik Reinhardt | Executive Director of Technology | Tech / inside champion |
| Charissa Costa | Director of Digital Sales | Digital / loyalty / 3P |
| Peter Guidry | VP Operations | Field ops |
| Travis Timberlake | Director, Ops Services | Field ops |
| Tom Hall | Director, F&B | Culinary / training |
| Amin Seddiq | Beverage Director | Bar program |
| Justin Rude | Director, Marketing Comms | PR |

**IMC partnership context:** Taco Bamba is majority-owned by **Investors Management Corporation** (parent of Golden Corral) as of 2024–25. Pereira was brought in specifically to scale nationally.

**Roles missing in public record (Rik intake sheet items):** CFO, CMO, Head of HR, Head of Supply Chain, Head of Catering (exec-level), NC/TN area directors.

## Decisions locked (this session)

- Governance is internal only — never on a customer surface (`GOVERNANCE.md`)
- Source-tag every figure · 2-of-3 corroboration for external data · cannot-answer is a first-class return shape
- Operator-turned-founder native AI — depth shown only to signed customers
- Halo registry v1.3 → v1.4 partial · Tier 1: Whole Foods · Trader Joe's · Wegmans · Sweetgreen · Cava · Chipotle · Shake Shack · lululemon · Equinox (Apple killed)
- Mexican Heat Map layer separate from halo (5-mile scan; 1.5–3 mile heat zone)
- Rik = Executive Director of Technology (public title) + functionally Myke's ops champion
- Charissa = Director of Digital Sales (verified from her own signature; Rik's "Director of Digital Marketing" reference was loose)

## Pending decisions (waiting on operator)

- Halo registry v1.4 lock (Mendocino Farms, True Food Kitchen, Sprouts, Barry's, MOM's Organic, Compass Coffee, Solidcore, chef-driven Mexican peers)
- Data source approval gate — first batch (NOAA · Census ACS · SEC EDGAR · Census Pulse · Google Places · OSM POIs · DOT)
- What is the End of Night Reports system built on? (Rik question)
- Rotate the `REPORTS_PASSWORD` and Supabase DB password (both ended up in chat)

## Pending build (queued)

- 🔍 Logic toggle on `/command-center` — operator-only provenance overlay
- Rik intake sheet (markdown — fills the leadership / system gaps)
- Charissa intake sheet (her lane: digital, loyalty, catering pipeline)
- Per-location agent stubs — 16 manifests, one per TB store; blocked on address backfill + geocode
- Trade Area / Customer Intelligence agent UI stub
- Excel / CSV parser agent — universal fallback ingest

## Known gaps / honest "don't know yet"

- No invoice ingestion → no real food cost % (EONR is the bridge)
- No labor / scheduling system identified for TB → no real labor %
- No 3P rate cards seen → 3P fees marked Estimated, not Verified
- 16 store addresses are NULL in `operator_locations` → per-location agents blocked until backfilled
- Thanx cohort retention not measurable yet — TB is in first 90 days of loyalty

---

*Update this file at end of every session. If it's wrong here, it's wrong everywhere.*
