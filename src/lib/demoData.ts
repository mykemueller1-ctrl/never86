import type { VoidHunter } from './voidHunter';
import type { ThreePFees } from './threePFees';
import type { LaborLeak } from './laborLeak';

// Clearly-fictional sample data for the public demo tools at /demo/*.
// NOT a real operator — invented numbers for a made-up 5-unit pizza group,
// internally consistent so the tool looks real, but never anyone's actual data.
// The demo pages render a "Sample data" banner so this is never mistaken for live.

export const DEMO_VOID_HUNTER: VoidHunter = {
  lastIngest: '2026-05-25',
  networkNet: 4_200_000,
  networkVoids: 27_600,
  networkVoidRate: 27_600 / 4_200_000,
  medianStoreVoidRate: 0.0051,
  storesFlagged: 1,
  stores: [
    { name: 'Downtown', net: 980_000, voids: 12_200, voidRate: 12_200 / 980_000, excessYr: Math.round((12_200 - 0.0051 * 980_000) * 3), flagged: true },
    { name: 'University', net: 760_000, voids: 5_300, voidRate: 5_300 / 760_000, excessYr: Math.round((5_300 - 0.0051 * 760_000) * 3), flagged: false },
    { name: 'Riverside', net: 910_000, voids: 4_600, voidRate: 4_600 / 910_000, excessYr: 0, flagged: false },
    { name: 'Midtown', net: 840_000, voids: 3_400, voidRate: 3_400 / 840_000, excessYr: 0, flagged: false },
    { name: 'Airport', net: 710_000, voids: 2_100, voidRate: 2_100 / 710_000, excessYr: 0, flagged: false },
  ],
  employees: [
    { store: 'Downtown', name: 'Server #14', net: 88_000, voidAmount: 4_200, voidedItems: 41, voidRate: 4_200 / 88_000, flagged: true },
    { store: 'Downtown', name: 'Server #22', net: 102_000, voidAmount: 3_100, voidedItems: 28, voidRate: 3_100 / 102_000, flagged: true },
    { store: 'University', name: 'Server #7', net: 76_000, voidAmount: 2_400, voidedItems: 19, voidRate: 2_400 / 76_000, flagged: true },
    { store: 'Riverside', name: 'Bartender #3', net: 54_000, voidAmount: 1_500, voidedItems: 12, voidRate: 1_500 / 54_000, flagged: true },
    { store: 'Midtown', name: 'Server #9', net: 81_000, voidAmount: 900, voidedItems: 7, voidRate: 900 / 81_000, flagged: true },
    { store: 'Airport', name: 'Server #2', net: 60_000, voidAmount: 300, voidedItems: 3, voidRate: 300 / 60_000, flagged: false },
  ],
};

export const DEMO_THREE_P: ThreePFees = {
  lastIngest: '2026-05-25',
  networkTpRevenueYr: 3_610_000,
  networkFees20: 722_000,
  networkFees25: 902_500,
  networkFirstPartyPct: 41.4,
  storesBelowTarget: 4,
  firstPartyTarget: 50,
  stores: [
    { name: 'Downtown', tpRevenueYr: 1_020_000, fees20: 204_000, fees25: 255_000, firstPartyPct: 28, flagged: true },
    { name: 'Midtown', tpRevenueYr: 880_000, fees20: 176_000, fees25: 220_000, firstPartyPct: 41, flagged: true },
    { name: 'University', tpRevenueYr: 760_000, fees20: 152_000, fees25: 190_000, firstPartyPct: 47, flagged: true },
    { name: 'Riverside', tpRevenueYr: 540_000, fees20: 108_000, fees25: 135_000, firstPartyPct: 58, flagged: false },
    { name: 'Airport', tpRevenueYr: 410_000, fees20: 82_000, fees25: 102_500, firstPartyPct: 33, flagged: true },
  ],
};

export const DEMO_LABOR_LEAK: LaborLeak = {
  lastIngest: '2026-05-25',
  networkNetSales: 4_200_000,
  networkLabor: 1_350_000,
  networkLaborPct: 0.321,
  budgetedLaborPct: 0.28,
  overtimeDollarsYr: 86_400,
  ghostShiftDollarsYr: 17_200,
  storesFlagged: 3,
  stores: [
    { name: 'Downtown', netSales: 980_000, laborDollars: 348_000, laborPct: 0.355, budgetedPct: 0.28, overtimeHours: 612, overtimeDollars: 19_300, ghostShiftCount: 14, ghostShiftDollars: 4_900, flagged: true },
    { name: 'Midtown', netSales: 840_000, laborDollars: 296_000, laborPct: 0.352, budgetedPct: 0.28, overtimeHours: 540, overtimeDollars: 17_400, ghostShiftCount: 11, ghostShiftDollars: 3_700, flagged: true },
    { name: 'University', netSales: 760_000, laborDollars: 252_000, laborPct: 0.331, budgetedPct: 0.28, overtimeHours: 410, overtimeDollars: 12_900, ghostShiftCount: 8, ghostShiftDollars: 2_400, flagged: true },
    { name: 'Riverside', netSales: 910_000, laborDollars: 244_000, laborPct: 0.268, budgetedPct: 0.28, overtimeHours: 220, overtimeDollars: 7_100, ghostShiftCount: 3, ghostShiftDollars: 900, flagged: false },
    { name: 'Airport', netSales: 710_000, laborDollars: 210_000, laborPct: 0.296, budgetedPct: 0.28, overtimeHours: 350, overtimeDollars: 11_200, ghostShiftCount: 6, ghostShiftDollars: 1_900, flagged: false },
  ],
  offenders: [
    { store: 'Downtown', name: 'Line cook #4', role: 'kitchen', scheduled: 38, clocked: 47.5, overtime: 7.5, drift: 9.5 },
    { store: 'Downtown', name: 'Server #14', role: 'foh', scheduled: 32, clocked: 41.2, overtime: 1.2, drift: 9.2 },
    { store: 'Midtown', name: 'Dishwasher #2', role: 'kitchen', scheduled: 35, clocked: 44, overtime: 4, drift: 9 },
    { store: 'University', name: 'Manager #1', role: 'salaried', scheduled: 45, clocked: 58, overtime: 0, drift: 13 },
    { store: 'Midtown', name: 'Server #22', role: 'foh', scheduled: 28, clocked: 35.5, overtime: 0, drift: 7.5 },
  ],
};
