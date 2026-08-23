import { describe, expect, it } from 'vitest';
import {
  PUBLIC_LOGIC_DOMAINS,
  calculateMarketplaceQuickWin,
  getPublicOperatorLogic,
} from './publicOperatorLogic';

describe('public operator logic', () => {
  it('returns every declared public logic domain', () => {
    const all = getPublicOperatorLogic('all');
    for (const domain of PUBLIC_LOGIC_DOMAINS) {
      if (domain === 'all') continue;
      expect(all).toHaveProperty(domain);
      expect(getPublicOperatorLogic(domain)).toEqual(
        (all as Record<string, unknown>)[domain],
      );
    }
  });

  it('produces the same deterministic 3P receipt as the browser Quick Win', () => {
    const receipt = calculateMarketplaceQuickWin({
      platform: 'DoorDash',
      period: 'January 2026',
      eligibleSales: 8207.63,
      commission: 787.55,
      merchantFees: 39.92,
      promotions: 847.88,
      refundsAdjustments: 49.02,
      otherFees: 40,
      credits: 0.08,
      reportedPayout: 6443.34,
    });

    expect(receipt).toEqual({
      ok: true,
      result: expect.objectContaining({
        status: 'unverified',
        interpretation: 'The reported payout matches the entered statement math to the cent.',
        calculation: {
          documentedDeductions: 1764.29,
          effectiveMarketplaceCostPct: expect.closeTo(21.49573, 5),
          expectedPayout: 6443.34,
          payoutVariance: 0,
        },
      }),
    });
  });

  it('rejects invalid money instead of silently normalizing it', () => {
    expect(calculateMarketplaceQuickWin({
      eligibleSales: 100,
      commission: -1,
      merchantFees: 0,
      promotions: 0,
      refundsAdjustments: 0,
      otherFees: 0,
      credits: 0,
    })).toEqual({ ok: false, error: 'commission must be a finite, non-negative number.' });

    expect(calculateMarketplaceQuickWin({
      eligibleSales: 0,
      commission: 0,
      merchantFees: 0,
      promotions: 0,
      refundsAdjustments: 0,
      otherFees: 0,
      credits: 0,
    })).toEqual({ ok: false, error: 'eligibleSales must be greater than zero.' });
  });
});
