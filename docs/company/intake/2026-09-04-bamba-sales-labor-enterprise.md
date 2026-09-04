# Intake — bamba-sales-labor-enterprise-v1

**Status:** drafted · tested in-repo · not merged · not deployed · not live-verified  
**Task:** `bamba-sales-labor-enterprise-v1`  
**Surface:** `/command-center/sales-labor` (reports gate, noindex)

## Lane lock — do not mix

This is the **bigger** Taco Bamba Command Center desk. Other agents stay on their own branches. Do not cherry-pick, rebase onto, or merge them into this PR.

| Lane | PR | Branch | What it is |
|---|---|---|---|
| **This desk (bigger)** | [#189](https://github.com/mykemueller1-ctrl/never86/pull/189) | `cursor/never86-bamba-sales-labor-enterprise-v1-44d9` | Gated enterprise Sales · Labor desk. Bamba tenant only. |
| Smaller map / public try-it | [#188](https://github.com/mykemueller1-ctrl/never86/pull/188) | `cursor/command-drilldown-brief-1509` | Docs + `/demo/command` fictional pizza sample. No live Bamba reconnect. |
| Overlay on this desk | [#190](https://github.com/mykemueller1-ctrl/never86/pull/190) | `cursor/never86-bamba-ui-polish-swarm-v1-ffe8` | Polish / Graphiti / 12-job swarm copied on top of #189. Not this PR. |

#189 does not own `/demo/command`, `docs/COMMAND_DRILLDOWN.md`, Graphiti, or a 12-job swarm.

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
