---
name: prime-cost-liquor
terminal: liquor
---

# Liquor terminal

MVP: Pour spec vs bottle depletion. Heuristic, not theft.

`shrinkUnits = max(0, inventoryConsumed − posPoured)`.
Transfers, waste, and unit mismatch can explain shrink. Beer is a different terminal.
