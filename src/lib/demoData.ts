import type { VoidHunter } from './voidHunter';
import type { ThreePFees } from './threePFees';
import type { LaborLeak } from './laborLeak';
import type { ShiftPulse } from './shiftPulse';
import type { CateringLeak } from './cateringLeak';
import type { TipVariance } from './tipVariance';

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
  // Per-partner rates shaped like the real chef-led 16-unit operator card
  // (confirmed via Rik May 8 2026). Lets the demo render the contract-vs-effective
  // story the platform is actually built to find.
  partnerRates: [
    {
      partner: 'DoorDash',
      contractDelivery: 0.10,
      contractPickup: 0.06,
      premiumLabel: 'DashPass',
      premiumRate: 0.14,
      premiumShareEstimate: 0.30,
      fourWeekRevenue: 184_000,
      source: 'verified',
    },
    {
      partner: 'Uber Eats',
      contractDelivery: 0.18,
      contractPickup: 0.06,
      fourWeekRevenue: 89_800,
      source: 'verified',
    },
    {
      partner: 'GrubHub',
      contractDelivery: 0.18,
      fourWeekRevenue: 11_400,
      source: 'verified',
    },
  ],
  renegotiationLever: {
    precedentLabel: 'DoorDash 10% precedent',
    precedentRate: 0.10,
    fourWeekSavingsEstimate: 45_000,
    annualSavingsEstimate: 585_000,
    basis: "UE at 18% costs ~$89.8K/4wk + GH at 18% costs ~$11.4K/4wk on chain volume. If both landed at DD's 10% precedent, savings ≈ $45K / 4 weeks ≈ $585K / year. One conversation per partner, chain volume as leverage, DD precedent already inside the house.",
  },
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

export const DEMO_SHIFT_PULSE: ShiftPulse = {
  store: 'Downtown',
  shift: 'Friday Dinner',
  startedAt: '5:00 PM',
  forecastCovers: 240,
  actualCovers: 178,
  forecastNet: 6_800,
  actualNet: 5_220,
  shiftGoalLabel: 'Hit $1,800 in shareable apps',
  shiftGoalTarget: 1_800,
  shiftGoalActual: 1_245,
  voidMedian: 0.0051,
  topAchievements: [
    { name: 'Voids under the line', crew: 'Jordan (Server)', description: '3 shifts running below station median · streak goes hot at 5' },
    { name: 'Upsell streak', crew: 'Aaron (Server)', description: '4 consecutive shifts above $14 ticket average' },
    { name: 'Zero comp shift', crew: 'Sam (Manager)', description: 'No manager comp punches this entire shift so far' },
  ],
  stations: [
    { name: 'Pizza line', net: 1_840, voids: 12, voidRate: 12 / 1_840, stationMedianVoidRate: 0.0048, flagged: true },
    { name: 'Salad / cold', net: 720, voids: 3, voidRate: 3 / 720, stationMedianVoidRate: 0.0051, flagged: false },
    { name: 'Bar', net: 1_410, voids: 6, voidRate: 6 / 1_410, stationMedianVoidRate: 0.0042, flagged: false },
    { name: 'FOH', net: 1_250, voids: 4, voidRate: 4 / 1_250, stationMedianVoidRate: 0.0049, flagged: false },
  ],
  crew: [
    { name: 'Jordan', role: 'server', station: 'FOH', covers: 41, net: 1_320, voidRate: 0.0019, achievementCount: 4, streakDays: 3 },
    { name: 'Aaron', role: 'server', station: 'FOH', covers: 36, net: 1_180, voidRate: 0.0034, achievementCount: 3, streakDays: 4 },
    { name: 'Sam', role: 'manager', station: 'Mgmt', covers: 0, net: 0, voidRate: 0, achievementCount: 2, streakDays: 1 },
    { name: 'Cam', role: 'line cook', station: 'Pizza line', covers: 88, net: 1_540, voidRate: 0.0061, achievementCount: 1, streakDays: 1 },
    { name: 'Riley', role: 'bar', station: 'Bar', covers: 22, net: 1_180, voidRate: 0.0042, achievementCount: 2, streakDays: 2 },
  ],
};

export const DEMO_CATERING_LEAK: CateringLeak = {
  lastIngest: '2026-05-25',
  networkCateringNet: 612_400,
  networkCateringOrders: 1_840,
  networkAvgTicket: 333,
  inStoreAvgTicket: 32,
  ticketMultiplier: 10.4,
  reconciledGapDollars: 38_100,
  reconciledGapPct: 0.062,
  storesFlagged: 2,
  channels: [
    { name: 'In-house (phone / email)', net: 268_400, orders: 720, feePct: 0 },
    { name: 'Toast Catering', net: 184_200, orders: 612, feePct: 0.029 },
    { name: 'EzCater / Foodja (3P)', net: 122_300, orders: 408, feePct: 0.18 },
    { name: 'Walk-in trays', net: 37_500, orders: 100, feePct: 0 },
  ],
  stores: [
    { name: 'Downtown', cateringNet: 184_500, cateringOrders: 510, avgTicket: 362, invoicedNet: 168_700, reconciledGap: 15_800, flagged: true },
    { name: 'University', cateringNet: 142_300, cateringOrders: 480, avgTicket: 296, invoicedNet: 134_200, reconciledGap: 8_100, flagged: false },
    { name: 'Midtown', cateringNet: 118_400, cateringOrders: 340, avgTicket: 348, invoicedNet: 107_900, reconciledGap: 10_500, flagged: true },
    { name: 'Riverside', cateringNet: 96_200, cateringOrders: 320, avgTicket: 300, invoicedNet: 94_500, reconciledGap: 1_700, flagged: false },
    { name: 'Airport', cateringNet: 71_000, cateringOrders: 190, avgTicket: 374, invoicedNet: 69_000, reconciledGap: 2_000, flagged: false },
  ],
};

export const DEMO_TIP_VARIANCE: TipVariance = {
  lastIngest: '2026-05-25',
  weekLabel: 'Week of May 19',
  networkTotalTips: 84_200,
  networkAvgPerCover: 4.72,
  networkVariancePct: -0.082,
  storesFlagged: 2,
  stores: [
    { name: 'Downtown', totalTips: 24_100, perCoverAvg: 5.41, weekVariance: -0.121, flagged: true },
    { name: 'Midtown', totalTips: 18_600, perCoverAvg: 4.92, weekVariance: -0.094, flagged: true },
    { name: 'University', totalTips: 15_400, perCoverAvg: 4.51, weekVariance: -0.045, flagged: false },
    { name: 'Riverside', totalTips: 14_800, perCoverAvg: 4.62, weekVariance: 0.018, flagged: false },
    { name: 'Airport', totalTips: 11_300, perCoverAvg: 3.81, weekVariance: -0.032, flagged: false },
  ],
  movers: [
    { store: 'Downtown', name: 'Server #14', role: 'server', tipsThisWeek: 980, tipsLastWeek: 1_420, deltaPct: -0.31 },
    { store: 'Downtown', name: 'Bartender #2', role: 'bar', tipsThisWeek: 1_120, tipsLastWeek: 1_540, deltaPct: -0.27 },
    { store: 'Midtown', name: 'Server #9', role: 'server', tipsThisWeek: 840, tipsLastWeek: 1_180, deltaPct: -0.29 },
    { store: 'Riverside', name: 'Server #6', role: 'server', tipsThisWeek: 1_290, tipsLastWeek: 1_080, deltaPct: 0.19 },
    { store: 'University', name: 'Server #11', role: 'server', tipsThisWeek: 1_140, tipsLastWeek: 1_050, deltaPct: 0.09 },
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

export const DEMO_SHIFT_PULSE: ShiftPulse = {
  store: 'Downtown',
  shift: 'Friday Dinner',
  startedAt: '5:00 PM',
  forecastCovers: 240,
  actualCovers: 178,
  forecastNet: 6_800,
  actualNet: 5_220,
  shiftGoalLabel: 'Hit $1,800 in shareable apps',
  shiftGoalTarget: 1_800,
  shiftGoalActual: 1_245,
  voidMedian: 0.0051,
  topAchievements: [
    { name: 'Voids under the line', crew: 'Jordan (Server)', description: '3 shifts running below station median · streak goes hot at 5' },
    { name: 'Upsell streak', crew: 'Aaron (Server)', description: '4 consecutive shifts above $14 ticket average' },
    { name: 'Zero comp shift', crew: 'Sam (Manager)', description: 'No manager comp punches this entire shift so far' },
  ],
  stations: [
    { name: 'Pizza line', net: 1_840, voids: 12, voidRate: 12 / 1_840, stationMedianVoidRate: 0.0048, flagged: true },
    { name: 'Salad / cold', net: 720, voids: 3, voidRate: 3 / 720, stationMedianVoidRate: 0.0051, flagged: false },
    { name: 'Bar', net: 1_410, voids: 6, voidRate: 6 / 1_410, stationMedianVoidRate: 0.0042, flagged: false },
    { name: 'FOH', net: 1_250, voids: 4, voidRate: 4 / 1_250, stationMedianVoidRate: 0.0049, flagged: false },
  ],
  crew: [
    { name: 'Jordan', role: 'server', station: 'FOH', covers: 41, net: 1_320, voidRate: 0.0019, achievementCount: 4, streakDays: 3 },
    { name: 'Aaron', role: 'server', station: 'FOH', covers: 36, net: 1_180, voidRate: 0.0034, achievementCount: 3, streakDays: 4 },
    { name: 'Sam', role: 'manager', station: 'Mgmt', covers: 0, net: 0, voidRate: 0, achievementCount: 2, streakDays: 1 },
    { name: 'Cam', role: 'line cook', station: 'Pizza line', covers: 88, net: 1_540, voidRate: 0.0061, achievementCount: 1, streakDays: 1 },
    { name: 'Riley', role: 'bar', station: 'Bar', covers: 22, net: 1_180, voidRate: 0.0042, achievementCount: 2, streakDays: 2 },
  ],
};

export const DEMO_CATERING_LEAK: CateringLeak = {
  lastIngest: '2026-05-25',
  networkCateringNet: 612_400,
  networkCateringOrders: 1_840,
  networkAvgTicket: 333,
  inStoreAvgTicket: 32,
  ticketMultiplier: 10.4,
  reconciledGapDollars: 38_100,
  reconciledGapPct: 0.062,
  storesFlagged: 2,
  channels: [
    { name: 'In-house (phone / email)', net: 268_400, orders: 720, feePct: 0 },
    { name: 'Toast Catering', net: 184_200, orders: 612, feePct: 0.029 },
    { name: 'EzCater / Foodja (3P)', net: 122_300, orders: 408, feePct: 0.18 },
    { name: 'Walk-in trays', net: 37_500, orders: 100, feePct: 0 },
  ],
  stores: [
    { name: 'Downtown', cateringNet: 184_500, cateringOrders: 510, avgTicket: 362, invoicedNet: 168_700, reconciledGap: 15_800, flagged: true },
    { name: 'University', cateringNet: 142_300, cateringOrders: 480, avgTicket: 296, invoicedNet: 134_200, reconciledGap: 8_100, flagged: false },
    { name: 'Midtown', cateringNet: 118_400, cateringOrders: 340, avgTicket: 348, invoicedNet: 107_900, reconciledGap: 10_500, flagged: true },
    { name: 'Riverside', cateringNet: 96_200, cateringOrders: 320, avgTicket: 300, invoicedNet: 94_500, reconciledGap: 1_700, flagged: false },
    { name: 'Airport', cateringNet: 71_000, cateringOrders: 190, avgTicket: 374, invoicedNet: 69_000, reconciledGap: 2_000, flagged: false },
  ],
};

export const DEMO_TIP_VARIANCE: TipVariance = {
  lastIngest: '2026-05-25',
  weekLabel: 'Week of May 19',
  networkTotalTips: 84_200,
  networkAvgPerCover: 4.72,
  networkVariancePct: -0.082,
  storesFlagged: 2,
  stores: [
    { name: 'Downtown', totalTips: 24_100, perCoverAvg: 5.41, weekVariance: -0.121, flagged: true },
    { name: 'Midtown', totalTips: 18_600, perCoverAvg: 4.92, weekVariance: -0.094, flagged: true },
    { name: 'University', totalTips: 15_400, perCoverAvg: 4.51, weekVariance: -0.045, flagged: false },
    { name: 'Riverside', totalTips: 14_800, perCoverAvg: 4.62, weekVariance: 0.018, flagged: false },
    { name: 'Airport', totalTips: 11_300, perCoverAvg: 3.81, weekVariance: -0.032, flagged: false },
  ],
  movers: [
    { store: 'Downtown', name: 'Server #14', role: 'server', tipsThisWeek: 980, tipsLastWeek: 1_420, deltaPct: -0.31 },
    { store: 'Downtown', name: 'Bartender #2', role: 'bar', tipsThisWeek: 1_120, tipsLastWeek: 1_540, deltaPct: -0.27 },
    { store: 'Midtown', name: 'Server #9', role: 'server', tipsThisWeek: 840, tipsLastWeek: 1_180, deltaPct: -0.29 },
    { store: 'Riverside', name: 'Server #6', role: 'server', tipsThisWeek: 1_290, tipsLastWeek: 1_080, deltaPct: 0.19 },
    { store: 'University', name: 'Server #11', role: 'server', tipsThisWeek: 1_140, tipsLastWeek: 1_050, deltaPct: 0.09 },
  ],
};
