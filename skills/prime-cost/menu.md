---
name: prime-cost-menu
terminal: menu
---

# Menu terminal

MVP: P-mix and item→recipe maps that feed food, liquor, and beer theoretical usage.

Preserve raw POS labels. Do not copy one store's mapping to another.
UNKNOWN/UKNOWN rolls to Food for mix. Not a person. Not theft.
`theoreticalUsage = unitsSold × recipeEpQty` (AP via `/ yieldFraction` when yield verified).
Never invent case conversion or yield — Missing Evidence.

Code: `src/lib/recipeCost.ts`, `src/lib/poReceiveParse.ts`. Domains: `product-mix-pars`, `recipe-cost`, `uom-cost`.
