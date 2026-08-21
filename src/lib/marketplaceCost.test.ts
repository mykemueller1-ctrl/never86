import { describe, expect, it } from 'vitest';
import { calculateMarketplaceCost } from './marketplaceCost';

describe('calculateMarketplaceCost', () => {
  it('separates all documented deductions and credits', () => {
    expect(
      calculateMarketplaceCost({
        eligibleSales: 8207.63,
        commission: 787.55,
        merchantFees: 39.92,
        promotions: 847.88,
        refundsAdjustments: 49.02,
        otherFees: 40,
        credits: 0.08,
        reportedPayout: 6443.34,
      })
    ).toEqual({
      documentedDeductions: 1764.29,
      effectiveMarketplaceCostPct: expect.closeTo(21.49573, 5),
      expectedPayout: 6443.34,
      payoutVariance: 0,
    });
  });

  it('leaves payout variance unknown when no reported payout is entered', () => {
    expect(
      calculateMarketplaceCost({
        eligibleSales: 1000,
        commission: 150,
        merchantFees: 0,
        promotions: 50,
        refundsAdjustments: 0,
        otherFees: 0,
        credits: 10,
      })
    ).toEqual({
      documentedDeductions: 190,
      effectiveMarketplaceCostPct: 19,
      expectedPayout: 810,
      payoutVariance: null,
    });
  });

  it('requires positive sales and neutralizes negative deductions', () => {
    expect(
      calculateMarketplaceCost({
        eligibleSales: 0,
        commission: 1,
        merchantFees: 0,
        promotions: 0,
        refundsAdjustments: 0,
        otherFees: 0,
        credits: 0,
      })
    ).toBeNull();

    expect(
      calculateMarketplaceCost({
        eligibleSales: 100,
        commission: -5,
        merchantFees: 0,
        promotions: 0,
        refundsAdjustments: 0,
        otherFees: 0,
        credits: 0,
      })?.documentedDeductions
    ).toBe(0);
  });
});
