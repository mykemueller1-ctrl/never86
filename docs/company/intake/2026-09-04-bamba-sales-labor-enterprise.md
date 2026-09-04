# Intake — bamba-sales-labor-enterprise-v1

**Status:** drafted · tested in-repo · merge-ready onto `main` that already has #190 · not deployed · not live-verified  
**Task:** `bamba-sales-labor-enterprise-v1`  
**Surfaces:** `/command-center/sales-labor` · `/command-center/prime-cost` (reports gate, noindex)

## Lane lock

This is the bigger Taco Bamba Command Center lane. #190 polish is now on `main` and was merged into this branch with `-X theirs` so this PR does not revert it.

## Prime-cost desks

Not a new product. Same Lane C Bamba tenant. Still two seats (`builder-1`, `qa-1`). No 1,000-agent swarm.

| Desk | Status |
|---|---|
| Sales | Done — Aug 12 Daily canary 125273.41 |
| Labor | Open — no Bamba labor dollars |
| Food | Open — no count → no food cost. Invoice ≠ COGS |
| Liquor | Open — no pour log / depletion |
| Beer | Open — no pour log / depletion |
| Inventory | Open — no count |

Prime cost % stays Open until food and labor are both verified.

## Hard gates

- No CTap or New American Grill numbers
- No invented food, liquor, beer, labor, or inventory dollars
- No merge click from this factory slot (GitHub human gate)
- No live migration, CRM write, or send
