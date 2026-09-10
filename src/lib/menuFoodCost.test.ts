import { describe, expect, it } from 'vitest';
import { menuFoodCost } from './menuFoodCost';

describe('recipe food cost target', () => {
  it('links the cheese increase to the plate and operator target', () => {
    const before = menuFoodCost(16, 3.6, 8, 2.4, 30)!;
    const now = menuFoodCost(16, 3.6, 8, 2.6, 30)!;
    expect(before.foodCostPercent).toBeCloseTo(30);
    expect(before.overTarget).toBe(false);
    expect(now.plateCost - before.plateCost).toBeCloseTo(0.1);
    expect(now.foodCostPercent).toBeCloseTo(30.625);
    expect(now.overTarget).toBe(true);
  });
  it('uses the supplied target rather than prescribing a restaurant benchmark', () => {
    expect(menuFoodCost(16, 3.6, 8, 2.6, 31)?.overTarget).toBe(false);
  });
  it('requires a confirmed usable cost and valid recipe inputs', () => {
    expect(menuFoodCost(16, 3.6, 8, null, 30)).toBeNull();
    expect(menuFoodCost(0, 3.6, 8, 2.6, 30)).toBeNull();
    expect(menuFoodCost(16, -1, 8, 2.6, 30)).toBeNull();
    expect(menuFoodCost(16, 3.6, 8, 2.6, 101)).toBeNull();
    expect(menuFoodCost(16, 3.6, NaN, 2.6, 30)).toBeNull();
  });
});
