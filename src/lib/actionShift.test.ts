import { describe, expect, it } from 'vitest';
import { buildActionShift } from './actionShift';

describe('Action Shift', () => {
  it('ranks at most three evidence-backed moves from a daily close', () => {
    const shift = buildActionShift({
      store: 'CTAP',
      businessDate: '2026-08-21',
      grossSales: 9117.74,
      orderCount: 274,
      expectedCash: 2198.45,
      enteredDeposit: 0,
      payouts: 293.60,
      discounts: 177.63,
      promotions: 58.74,
      voids: 33.06,
      lateDeliveryCount: 9,
      lateDeliverySales: 416.72,
      averageDeliveryMinutes: 21,
      targetDeliveryMinutes: 18,
    });

    expect(shift.ok).toBe(true);
    if (!shift.ok) return;
    expect(shift.result.morningActions).toHaveLength(3);
    expect(shift.result.morningActions.map((action) => action.id)).toEqual([
      'cash-proof',
      'payout-proof',
      'delivery-clock',
    ]);
    expect(shift.result.morningActions[0]).toEqual(expect.objectContaining({
      dollarsObserved: 2198.45,
      sourceStatus: 'unverified',
    }));
    expect(shift.result.policy.maxMorningActions).toBe(3);
    expect(shift.result.nightCloseCheck).toHaveLength(3);
    expect(shift.result.missingEvidence).not.toContain(
      'Ticket-level exception detail with employee, approver, reason, tender, and timestamp.',
    );
  });

  it('uses only an operator-supplied labor target', () => {
    const withoutTarget = buildActionShift({ grossSales: 1000, laborDollars: 400 });
    expect(withoutTarget.ok && withoutTarget.result.morningActions[0].id).toBe('close-packet');

    const withTarget = buildActionShift({ grossSales: 1000, laborDollars: 400, laborTargetPct: 30 });
    expect(withTarget.ok && withTarget.result.morningActions[0]).toEqual(expect.objectContaining({
      id: 'labor-window',
      dollarsObserved: 100,
    }));
  });

  it('rejects invalid figures instead of silently repairing them', () => {
    expect(buildActionShift({ grossSales: 100, payouts: -1 })).toEqual({
      ok: false,
      error: 'payouts must be a finite, non-negative number.',
    });
    expect(buildActionShift({ grossSales: 100, laborTargetPct: 101 })).toEqual({
      ok: false,
      error: 'laborTargetPct must be between 0 and 100.',
    });
  });
});
