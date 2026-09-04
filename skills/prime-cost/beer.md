---
name: prime-cost-beer
terminal: beer
---

# Beer terminal

MVP: Draft/keg depletion vs POS pours. Separate from liquor.

Do not blend beer into liquor. Keg size and pack conversion must be verified.
TTB barrel = 31 US gal → half 15.5 · quarter 7.75 · sixth ≈ 5.1667. `kegFlOz = kegGal × 128`.
12-pack ≠ 24-pack ≠ 30-pack. Missing count stays Open.

Code: `src/lib/uomConvert.ts`, `src/lib/beverageScoreCsv.ts`. MCP: `convert_uom`, `analyze_beverage`.
