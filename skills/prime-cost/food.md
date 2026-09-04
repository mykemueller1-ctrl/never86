---
name: prime-cost-food
terminal: food
---

# Food terminal

MVP: Refuse a food-cost % until count + invoice + recipe exist.

Invoice ≠ COGS. No count → no food cost. Manager-reported food cost is Estimated only.
`EP_unit_cost = AP_unit_cost / yieldFraction`.
`recipeCost = Σ (EP_qty × EP_unit_cost)`.
`foodCogs = BI + Purchases − EI (± transfers/credits/waste)`.
`foodCostPct = foodCogs / foodSales`.

Reads sales, menu, and inventory. Missing Evidence is not $0.

Code: `src/lib/recipeCost.ts`. MCP: `analyze_recipe_cost`, domains `recipe-cost`, `forensic-pnl`.
