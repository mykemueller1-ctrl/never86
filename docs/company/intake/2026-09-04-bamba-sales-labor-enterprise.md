# Intake — bamba-sales-labor-enterprise-v1

**Status:** drafted · tested in-repo · not merged · not deployed · not live-verified  
**Task:** `bamba-sales-labor-enterprise-v1`  
**Surface:** `/command-center/sales-labor` (reports gate, noindex)

## Lane lock — do not mix

This is the **bigger** Taco Bamba Command Center desk. Other agents stay on their own branches.

| Lane | PR | Branch | What it is |
|---|---|---|---|
| **This desk (bigger)** | [#189](https://github.com/mykemueller1-ctrl/never86/pull/189) | `cursor/never86-bamba-sales-labor-enterprise-v1-44d9` | Gated enterprise Sales · Labor desk. Bamba tenant only. |
| Smaller map / public try-it | [#188](https://github.com/mykemueller1-ctrl/never86/pull/188) | `cursor/command-drilldown-brief-1509` | Docs + `/demo/command` fictional pizza sample. No live Bamba reconnect. |
| Overlay | [#190](https://github.com/mykemueller1-ctrl/never86/pull/190) | merged to `main` at `b31023b` | Polish / Graphiti / 12-job × 16-store swarm copied on top of #189. |

#189 does not own `/demo/command`, `docs/COMMAND_DRILLDOWN.md`, Graphiti, or a 12-job swarm.

## Merge vs `main` (fetched 2026-09-04)

`origin/main` moved `7cea0f2` → `b31023b` by merging #190. A merge into this branch is **add/add** on the same desk files. Merge was **not completed**.

**Simple (this note):** keep the lane lock and the shared desk description. That is the only unique #189 text.

**Complicated — not resolved. Human gate.** Taking ours would revert #190 from `main`. Taking theirs would absorb the overlay this lane was told not to mix. A hybrid would claim both “exactly two seats” and “12 jobs × 16 stores.”

Unresolved files if the merge is retried:
- `config/bamba-sales-labor-agents.json`
- `src/lib/bambaSalesLabor/agents.ts`
- `src/lib/bambaSalesLabor/types.ts`
- `src/lib/bambaSalesLabor/desk.ts`
- `src/lib/bambaSalesLabor/index.ts`
- `src/lib/bambaSalesLabor.test.ts`
- `src/components/SalesLaborDesk.tsx`

Would auto-merge from `main` (overlay wiring): `.cursor/mcp.json`, `.env.example`, Graphiti / agentmemory / swarm / roster / polish / replay files.

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
