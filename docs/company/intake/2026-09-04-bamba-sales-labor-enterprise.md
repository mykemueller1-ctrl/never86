# Intake — bamba-sales-labor-enterprise-v1

**Status:** drafted · tested in-repo · not merged · not deployed · not live-verified  
**Task:** `bamba-sales-labor-enterprise-v1`  
**Surface:** `/command-center/sales-labor` (reports gate, noindex)

## What this is

One Never86 Command Center sales-labor desk for the Taco Bamba Sales Labor Report (MP) v5 Daily parse. Not a new product. Lane C isolation: Bamba tenant memory only.

- Daily / WTD / PTD in that order
- Store and region rollup
- CY / PY / FCST, checks, catering, avg check, comps, staff meals, voids + evidence
- Peer-median 1.5× void/comp flags
- Sheet1 drill-downs: comps servers, staff meals, training meals, void ranking, daypart, ticket times, p-mix
- Color flags for school / holiday / concert this year, not last

## Agents

Exactly two seats in `config/bamba-sales-labor-agents.json`: `builder-1` and `qa-1`. No 1,000-agent swarm.

## Hard gates

- No CTap or New American Grill numbers
- No staff names
- No merge, deploy, live migration, CRM write, or send
- Incomplete WTD/PTD stay Open
