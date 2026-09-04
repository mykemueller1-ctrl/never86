---
name: prime-cost-liquor
terminal: liquor
---

# Liquor terminal

MVP: Pour spec vs bottle depletion. Heuristic, not theft.

`shrinkUnits = max(0, inventoryConsumed − posPoured)`.
`bottleFlOz = packageMl / 29.5735295625`.
`poursPerPackage = (unitsPerPackage × unitFlOz) / pourSpecFlOz` — only when pack + pourSpec verified.

Transfers, waste, and unit mismatch can explain shrink. Beer is a different terminal.
Fluid oz ≠ weight oz. Missing pourSpec → Open / Missing Evidence.

Code: `src/lib/uomConvert.ts`, `src/lib/beverageScoreCsv.ts`. MCP: `convert_uom`, `analyze_beverage`, domain `uom-cost`.
