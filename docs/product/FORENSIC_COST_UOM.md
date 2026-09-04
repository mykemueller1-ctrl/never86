# Forensic cost · UoM · vendors · pour · recipe · P&L

**Branch track:** `cursor/forensic-cost-uom-vendors-b9cf`  
**MCP:** call `get_operator_system` → `get_operator_logic` with domains `uom-cost`, `recipe-cost`, `forensic-pnl`, `beverage`, `vendor-drift`, `invoices-daily-prime`  
**Code:** `src/lib/uomConvert.ts`, `src/lib/recipeCost.ts`  
**Analysis tools:** `convert_uom`, `analyze_recipe_cost` (Unverified; read-only)

## Contract

- Fluid ounce ≠ weight ounce.
- Invoice ≠ COGS. No count → no food or beverage cost. Incomplete week stays Open.
- Never invent pack size, keg size, pourSpec, yield, or case conversion.
- Shrink / variance ranks **review work**. Never name staff as thieves.
- POS ≠ payout. Marketplace statement ≠ bank deposit.

## House pour — ask every unit

Drink recipes are **per operator**. Never assume 1.5 oz (or 1.75 / 2).

```
ask_pour_standards → operator answers → declare_pour_standards → human approves memory
```

Categories: spirit_shot · mixed_drink_liquor · wine_glass · draft_pour · packaged_beer · double_spirit  

Choice menu (options only): 1 · 1.25 · 1.5 · **1.75** · 2 · 4 · 5 · 6 · 12 · 16 fl oz (+ custom).

Straight shot and mixed-drink liquor are often different — ask both. Doubles are their own line.

## Beverage pour path

```
bottleFlOz = packageMl / 29.5735295625
poursPerPackage = (unitsPerPackage × unitFlOz) / housePourSpecFlOz
costPerPour = packageCost / poursPerPackage   # pack + HOUSE pourSpec verified
shrinkUnits = max(0, inventoryConsumed − posPoured)   # Never86 BCS
pourCostPct = beverageCogs$ / beverageSales$          # needs counts + sales
```

Kegs (TTB barrel = 31 US gal): half 15.5 · quarter 7.75 · sixth ≈ 5.1667.

## Drink recipe path (per unit)

```
ask_pour_standards → operator picks 1.5 / 1.75 / 2 / custom per category
declare_pour_standards → human approves memory
analyze_recipe_cost mode=drink_recipe + house_pour_lines + ingredients
drinkCost = Σ (housePourFlOz_or_recipeSpecificFlOz × costPerFlOz)
```

Unit A can be 1.5 shot / 1.75 mixed. Unit B can be 2 / 2. Same drink name ≠ same ounces.

## Food recipe path

```
EP_unit_cost = AP_unit_cost / yieldFraction
recipeCost = Σ (EP_qty × EP_unit_cost)
foodCogs = BI + Purchases − EI (± transfers/credits/waste)
foodCostPct = foodCogs / foodSales
contributionMargin = menuPrice − recipeCost
```

## Vendor path

- Invoice line = purchase, not COGS.
- Drift flag: same vendor+SKU unit price up >5% across two complete periods.
- Confirm pack size before disputing price (12 ≠ 24 ≠ 30).

## Forensic P&L stack (1–3 unit)

1. Sales (food / bev / other — disclose voids/comps policy)
2. − COGS → gross profit
3. − Labor (disclose wages-only vs loaded benefits)
4. − Controllable expenses → controllable income
5. − Occupancy / non-controllable → net

**Prime cost (disclose variant):** F&B COGS + labor wages, or F&B COGS + payroll & benefits (USAR-leaning).

## Investigation ladder

Evidence → math → owner → proof. LLM ranks. Human sends. No portal logins. No auto-mail.

## Do not

- CTap private dollars, staff names, PINs
- Guarantee recovery
- Fork formulas outside these modules / MCP domains
