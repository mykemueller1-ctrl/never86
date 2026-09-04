import { describe, expect, it } from 'vitest';
import {
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
  });
});
