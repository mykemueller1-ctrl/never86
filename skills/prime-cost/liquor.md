---
name: prime-cost-liquor
terminal: liquor
---

# Liquor terminal

MVP: Pour spec vs bottle depletion. Heuristic, not theft.

`shrinkUnits = max(0, inventoryConsumed − posPoured)`.
`bottleFlOz = packageMl / 29.5735295625`.
`poursPerPackage = (unitsPerPackage × unitFlOz) / housePourSpecFlOz` — only when pack + **this unit’s** pourSpec verified.

**Ask first:** shot vs mixed-drink liquor ounces (1.5 / 1.75 / 2 / custom). Never invent.  
MCP: `ask_pour_standards`, `declare_pour_standards`, `ask_fountain_standards`, `convert_uom`, `analyze_beverage`, `analyze_recipe_cost` (`mode=drink_recipe` or `fountain_spirit_drink`).

Drink recipes: liquor fl oz come from **this unit’s** house pour (or an explicit recipe-specific ounce the operator stated). Unit A ≠ Unit B.

Fountain gun (Pepsi BIB): ask syrup gallons, invoice $, mix ratio, cup mark, liquid after ice — then cost the Pepsi line.

Transfers, waste, and unit mismatch can explain shrink. Beer is a different terminal.
Fluid oz ≠ weight oz. Missing pourSpec → Open / Missing Evidence.

Code: `src/lib/operatorPourStandards.ts`, `src/lib/uomConvert.ts`, `src/lib/beverageScoreCsv.ts`.
