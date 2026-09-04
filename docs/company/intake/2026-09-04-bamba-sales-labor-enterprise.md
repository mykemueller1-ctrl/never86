# Intake — bamba-sales-labor-enterprise-v1

**Status:** drafted · tested in-repo · merge-ready onto `main` that already has #190 · not deployed · not live-verified  
**Task:** `bamba-sales-labor-enterprise-v1`  
**Surfaces:** `/command-center/sales-labor` · `/command-center/prime-cost` (reports gate, noindex)

## Lane lock

This is the bigger Taco Bamba Command Center lane. #190 polish is now on `main` and was merged into this branch with `-X theirs` so this PR does not revert it.

## Prime-cost terminals

Each roll is its own MVP, skill, and 2–3 sector seats. They read each other. They are not one swarm and not a thousand agents. Router: `prime-cost-router-1`.

| Terminal | Status | Feeds |
|---|---|---|
| Sales | Done — Aug 12 canary 125273.41 | labor, food, menu, liquor, beer |
| Labor | Open — no labor dollars | food (prime cost) |
| Food | Open — no count → no food cost | — |
| Menu | Open — category p-mix only | food, liquor, beer |
| Liquor | Open — no pour / depletion | — |
| Beer | Open — no pour / depletion | — |
| Inventory | Open — no count | food, liquor, beer |

Skills: `skills/prime-cost/*.md`. Contract: `src/lib/primeCostDesks/terminals.ts`.
Prime cost % stays Open until food and labor are both verified.

## Hard gates

- No CTap or New American Grill numbers
- No invented food, liquor, beer, labor, or inventory dollars
- No merge click from this factory slot (GitHub human gate)
- No live migration, CRM write, or send
