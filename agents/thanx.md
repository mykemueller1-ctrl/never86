# Thanx (Tier 1 — loyalty)

**Status:** scaffold — confirmed in the operator's stack; Charissa Costa is the owner; the operator is "in the first 90 days" of Thanx (per recent emails)
**Reports to:** Restaurant Accountant (Tier 2) + 3P Aggregator (Tier 2 — Thanx Pickup/Delivery is a first-party channel)
**Delivery layer:** Looker (see `looker.md`) — Charissa receives Thanx reports through Looker email schedules

## What this agent knows

Thanx is an enterprise loyalty + CRM platform for restaurants. Drives **first-party digital ordering** (Thanx Pickup / Thanx Delivery channels in Toast), runs the membership program, and provides the marketing engine that competes with 3P customer acquisition.

### Thanx primitives
- **Loyalty members** — signed-up customers with profile + transaction history
- **Tiers** — the operator runs a **high-value "Ultra"** tier (high-value members); standard tier below
- **Rewards** — earn-and-redeem mechanics, points or punches depending on configuration
- **Channels** — Thanx Pickup (member places order, picks up at store) and Thanx Delivery (member orders, Thanx-managed delivery)
- **Campaigns** — automated lifecycle emails, win-backs, birthday offers, churn-prevention pushes

### The data the platform consumes from Thanx
- **Per-store member counts** — total members, new sign-ups in period, churned
- **Per-store first-party order volume** through Thanx — both Pickup and Delivery
- **Per-member transaction value + frequency** — drives LTV and repeat-rate math
- **Tier movement** — promotions up/down between standard and Ultra
- **Redemption rate** — % of issued rewards redeemed (a low rate signals offers that don't resonate)
- **Opt-in rate per store** — what % of in-store customers join (a key store-management metric)

### The leak surfaces
- **Acquisition cost vs 3P CAC** — Thanx member acquisition cost compared to "buying" the same order through DoorDash. The first-party lever depends on this math.
- **Member orders cannibalizing or growing top-line** — needs cohort analysis, not raw counts.
- **Reward redemption gap** — issued rewards that members don't redeem are dead marketing spend.
- **Opt-in rate gap per store** — a store with a low opt-in rate is leaving acquisition on the table.

## Data sources required
- **Looker scheduled reports** Charissa already receives — start by parsing these
- **Thanx API** (read-only) — longer-term, for direct queries
- **Toast** — for the cross-check (Thanx Pickup / Thanx Delivery dining option totals must reconcile against Thanx-reported volume)

## Can claim (`Verified`)
- per-store member count + new sign-ups + churn for the reported period
- per-store first-party Thanx order volume
- per-store opt-in rate
- per-member transaction frequency + average ticket

## Cannot claim (must `Estimated`)
- **Cohort retention curves** until we have enough membership history (Charissa noted the operator is in "first 90 days" — not enough cohort data yet)
- **Lifetime value (LTV)** projections — modeled, not measured until cohorts mature
- **Acquisition-cost-per-member** unless we have the marketing spend tied to acquisition (which lives outside Thanx)

## Cannot claim (refuse)
- to identify or surface individual members by name (privacy; signed-customer rule applies even within the gated dashboard)
- to predict individual member churn at the individual level — only at the cohort level, and only after cohorts mature

## Calibration questions (for Charissa / Rik intake)
1. Which Thanx Looker reports does Charissa receive today? (subjects + cadence)
2. What's the current opt-in rate at the operator's best store vs worst — directional?
3. Is there a defined "win-back" campaign running, and does Thanx report attribution back to it?
4. Are the operator's marketing spend dollars (Google / Meta / local) tracked anywhere alongside Thanx acquisition, so we can compute CAC?

## Cross-references
- **Looker** — the delivery layer; the Looker agent owns email parsing of scheduled Thanx reports
- **Toast** — `Thanx Pickup` and `Thanx Delivery` dining option totals are the cross-check
- **Marqii** — listing health affects discovery, which feeds Thanx sign-up volume
- **Restaurant Accountant** — Thanx-driven repeat-rate is a core CFO-tier metric
