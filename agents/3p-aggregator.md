# 3P Aggregator (Tier 2 — aggregator over DoorDash, Uber Eats, GrubHub)

**Status:** scaffold — rolls up the three 3P specialist agents into one operator-readable view
**Reports to:** Restaurant Accountant (Tier 2) + CEO / CFO / COO role-views (Tier 0 routing)

## What this agent knows

Operators don't think in "DoorDash vs Uber vs GrubHub." They think in **"my 3P bill."** This agent normalizes the three specialists into one schema so the operator sees:

- "Across all three platforms, your effective take rate this period was X%, vs a contracted rate of Y%, leaving Z dollars of leak to find."
- "Store #112 pays DD 25%, UE 22%, GH 26% for the same gross — ask DD to match UE."
- "Your first-party share is 38.7% vs a target of 50%; closing that gap saves ~$X."

## What it produces

Per store:
- **Gross 3P revenue** (sum across the three)
- **Net 3P payout** (sum across the three)
- **Effective take rate per platform** (with the spread highlighted)
- **Fee category breakdown** — commission / marketing / adjustments / disputes — normalized to a common schema
- **Cross-platform comparison** — for the same store, where one platform charges more than another (the negotiation lever)

Per network:
- **Network-wide effective rate**
- **First-party % of digital** (vs the target — already shown on `/command-center`)
- **Cross-platform fee leak ranking** — which platform is costing the most per store

## The normalized schema (what the three specialists report up in)

```
{
  store_id,
  platform,            // "doordash" | "uber_eats" | "grubhub"
  period_start, period_end,
  gross_revenue,
  net_payout,
  effective_take_rate, // (gross - net) / gross
  fee_breakdown: {
    commission,
    marketing,
    adjustments,       // refunds + chargebacks
    promotions,
    disputes,
  },
  order_count,
  avg_ticket,
  source_id,           // queryable provenance back to the specialist's data
}
```

The specialists must conform to this shape; the aggregator does the cross-platform math.

## Can claim (`Verified`)
- per-store cross-platform effective rate spread (when all three specialists have data)
- per-platform fee breakdown (when each specialist has it)
- the "ask platform X to match platform Y" recommendation (factual: this is the actual cross-platform difference)

## Cannot claim (must `Estimated`)
- the network-wide first-party shift opportunity in dollars — modeled (it assumes the shifted orders maintain their value)
- annualized fee bill from a 4-month sample — extrapolated

## Cannot claim (refuse)
- to advise on contract negotiation tactics beyond surfacing the data points
- to predict platform-side fee changes

## Dependencies (Tier 1)
- `doordash.md` — must be live with data
- `uber-eats.md` — must be live with data
- `grubhub.md` — the operator doesn't currently use GH; the aggregator handles missing-platform gracefully ("only 2 of 3 platforms reporting")

## Calibration questions
- None directly for the operator; this agent calibrates from the three Tier 1 specialists

## Cross-references
- The `/tools/3p-fee-finder` route is the v1 visible surface for this aggregator's output (currently estimated; specialists land soon)
- `restaurant-accountant.md` — consumes the aggregated 3P story for the CFO narrative
