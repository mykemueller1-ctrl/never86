import { describe, expect, it } from 'vitest';
import {
  calculateDrinkRecipeCost,
  calculateEpUnitCost,
  calculateRecipeCost,
  contributionMargin,
  foodCogs,
  foodCostPct,
  recipeCostKnowledgePack,
  theoreticalUsageFromPmix,
} from './recipeCost';

describe('recipeCost', () => {
  it('converts AP cost to EP cost with verified yield', () => {
    const ep = calculateEpUnitCost(4, 0.75);
    expect(ep.ok).toBe(true);
    if (ep.ok) expect(ep.epUnitCost).toBeCloseTo(5.3333, 3);
    expect(calculateEpUnitCost(4, 0).ok).toBe(false);
  });

  it('sums plate cost from EP lines without inventing ingredients', () => {
    const recipe = calculateRecipeCost([
      { name: 'chicken EP', epQty: 0.5, epUnitCost: 5.3333 },
      { name: 'sauce', epQty: 0.1, epUnitCost: 2 },
    ]);
    expect(recipe.ok).toBe(true);
    if (recipe.ok) {
      expect(recipe.recipeCost).toBeCloseTo(2.86665, 4);
      expect(recipe.evidenceState).toBe('Unverified');
    }
    expect(calculateRecipeCost([]).ok).toBe(false);
  });

  it('builds theoretical usage and refuses food % without sales scope', () => {
    const usage = theoreticalUsageFromPmix({ unitsSold: 40, recipeEpQty: 0.5, yieldFraction: 0.75 });
    expect(usage.ok).toBe(true);
    if (usage.ok) {
      expect(usage.epUsage).toBe(20);
      expect(usage.apUsage).toBeCloseTo(26.6667, 3);
    }

    const cogs = foodCogs({ beginningInventory: 100, purchases: 200, endingInventory: 80 });
    expect(cogs.ok).toBe(true);
    if (cogs.ok) expect(cogs.foodCogs).toBe(220);

    const pct = foodCostPct(220, 1000);
    expect(pct.ok).toBe(true);
    if (pct.ok) expect(pct.foodCostPct).toBe(22);

    expect(foodCostPct(220, 0).ok).toBe(false);
  });

  it('keeps contribution margin separate from food-cost %', () => {
    const cm = contributionMargin(18, 4.5);
    expect(cm.ok).toBe(true);
    if (cm.ok) {
      expect(cm.contributionMargin).toBe(13.5);
      expect(cm.foodCostPct).toBe(25);
    }
    const pack = recipeCostKnowledgePack();
    expect(pack.truthGates.join(' ')).toMatch(/Invoice ≠ COGS/);
    expect(pack.truthGates.join(' ')).toMatch(/No count → no food cost/);
    expect(pack.truthGates.join(' ')).toMatch(/house pour/);
  });

  it('refuses drink recipes until this unit declares house pour (never assumes 1.5)', () => {
    const blocked = calculateDrinkRecipeCost({
      storeId: 'unit-a',
      housePourLines: [],
      ingredients: [
        { name: 'well vodka', pourCategory: 'mixed_drink_liquor', epUnitCost: 0.4 },
        { name: 'soda', pourSource: 'fixed', epQty: 4, epUnitCost: 0.02 },
      ],
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.evidenceState).toBe('Missing Evidence');
      expect(blocked.error).toMatch(/1\.5|1\.75|2/);
      expect(blocked.ask?.some((a) => a.category === 'mixed_drink_liquor')).toBe(true);
    }
  });

  it('costs a drink with unit A at 1.5 and unit B at 2 — different operators, different pours', () => {
    const unitA = calculateDrinkRecipeCost({
      storeId: 'unit-a',
      housePourLines: [
        { category: 'mixed_drink_liquor', pourSpecFlOz: 1.5, approvedBy: 'owner' },
        { category: 'spirit_shot', pourSpecFlOz: 1.5, approvedBy: 'owner' },
        { category: 'wine_glass', pourSpecFlOz: 5, approvedBy: 'owner' },
        { category: 'draft_pour', pourSpecFlOz: 16, approvedBy: 'owner' },
      ],
      ingredients: [
        { name: 'well vodka', pourCategory: 'mixed_drink_liquor', epUnitCost: 0.5 },
        { name: 'soda', pourSource: 'fixed', epQty: 4, epUnitCost: 0.02 },
      ],
    });
    expect(unitA.ok).toBe(true);
    if (unitA.ok) {
      expect(unitA.lines[0]?.epQty).toBe(1.5);
      expect(unitA.recipeCost).toBeCloseTo(1.5 * 0.5 + 4 * 0.02, 6);
    }

    const unitB = calculateDrinkRecipeCost({
      storeId: 'unit-b',
      housePourLines: [
        { category: 'mixed_drink_liquor', pourSpecFlOz: 2, approvedBy: 'gm' },
        { category: 'spirit_shot', pourSpecFlOz: 1.75, approvedBy: 'gm' },
        { category: 'wine_glass', pourSpecFlOz: 6, approvedBy: 'gm' },
        { category: 'draft_pour', pourSpecFlOz: 12, approvedBy: 'gm' },
      ],
      ingredients: [
        { name: 'well vodka', pourCategory: 'mixed_drink_liquor', epUnitCost: 0.5 },
        { name: 'soda', pourSource: 'fixed', epQty: 4, epUnitCost: 0.02 },
      ],
    });
    expect(unitB.ok).toBe(true);
    if (unitB.ok) {
      expect(unitB.lines[0]?.epQty).toBe(2);
      expect(unitB.recipeCost).toBeCloseTo(2 * 0.5 + 4 * 0.02, 6);
      expect(unitB.housePoursUsed[0]?.pourSpecFlOz).toBe(2);
    }
  });

  it('allows recipe-specific fl oz only when the operator states it explicitly', () => {
    const missing = calculateDrinkRecipeCost({
      storeId: 'unit-a',
      housePourLines: [{ category: 'spirit_shot', pourSpecFlOz: 1.5 }],
      ingredients: [{ name: 'martini gin', pourCategory: 'spirit_shot', pourSource: 'recipe_specific', epUnitCost: 0.6 }],
    });
    expect(missing.ok).toBe(false);

    const explicit = calculateDrinkRecipeCost({
      storeId: 'unit-a',
      housePourLines: [{ category: 'spirit_shot', pourSpecFlOz: 1.5 }],
      ingredients: [
        {
          name: 'martini gin',
          pourCategory: 'spirit_shot',
          pourSource: 'recipe_specific',
          epQty: 2.5,
          epUnitCost: 0.6,
        },
      ],
    });
    expect(explicit.ok).toBe(true);
    if (explicit.ok) expect(explicit.lines[0]?.epQty).toBe(2.5);
  });
});
