import { describe, it, expect } from 'vitest';
import { computeCostPercentages } from './metrics';

describe('computeCostPercentages', () => {
  it('computes sales-mix percentages and prime cost from a full report', () => {
    const result = computeCostPercentages({
      netSales: 1000,
      foodSales: 300,
      liquorSales: 150,
      laborCost: 320,
    });
    expect(result.foodCostPercent).toBe('30.00');
    expect(result.liquorCostPercent).toBe('15.00');
    // prime cost = foodSales + laborCost = 620 → 62.00%
    expect(result.primeCostPercent).toBe('62.00');
  });

  it('rounds to two decimal places', () => {
    const result = computeCostPercentages({ netSales: 3, foodSales: 1, laborCost: 0 });
    expect(result.foodCostPercent).toBe('33.33');
  });

  it('treats a legitimate zero as 0.00, not missing (regression)', () => {
    const result = computeCostPercentages({ netSales: 1000, foodSales: 0, liquorSales: 0, laborCost: 0 });
    expect(result.foodCostPercent).toBe('0.00');
    expect(result.liquorCostPercent).toBe('0.00');
    expect(result.primeCostPercent).toBe('0.00');
  });

  it('returns null for every percentage when netSales is missing', () => {
    const result = computeCostPercentages({ foodSales: 300, laborCost: 320 });
    expect(result).toEqual({
      foodCostPercent: null,
      liquorCostPercent: null,
      primeCostPercent: null,
    });
  });

  it('returns null (no divide-by-zero) when netSales is zero', () => {
    const result = computeCostPercentages({ netSales: 0, foodSales: 100, laborCost: 50 });
    expect(result.foodCostPercent).toBeNull();
    expect(result.primeCostPercent).toBeNull();
  });

  it('omits a category percentage when that category is missing but still computes prime cost', () => {
    const result = computeCostPercentages({ netSales: 1000, laborCost: 200 });
    expect(result.foodCostPercent).toBeNull();
    expect(result.liquorCostPercent).toBeNull();
    // prime cost falls back to (0 + 200) / 1000
    expect(result.primeCostPercent).toBe('20.00');
  });

  it('treats null fields the same as undefined', () => {
    const result = computeCostPercentages({
      netSales: 500,
      foodSales: null,
      liquorSales: null,
      laborCost: null,
    });
    expect(result.foodCostPercent).toBeNull();
    expect(result.primeCostPercent).toBe('0.00');
  });
});
