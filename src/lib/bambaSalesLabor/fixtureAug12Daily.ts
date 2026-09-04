import { SALES_LABOR_BUSINESS_DATE, SALES_LABOR_TENANT_ID, type SalesCalendarFlag, type SalesLaborStoreInput } from './types';

/**
 * Acceptance fixture: Taco Bamba Sales Labor Report (MP) v5 Daily totals
 * already parsed for 2026-08-12. Bamba tenant memory only.
 *
 * System CY sales is the locked canary: 125273.41.
 * Landmark has the highest Daily void rate on this pull.
 * No CTap or New American Grill rows.
 */
export const BAMBA_AUG12_DAILY_STORES: readonly SalesLaborStoreInput[] = [
  {
    store: 'Ballston',
    region: 'Arlington',
    cySales: 24850.2,
    pySales: 23110,
    fcstSales: 25000,
    checks: 620,
    catering: 2100,
    comps: 310.4,
    staffMeals: 85,
    trainingMeals: 40,
    voids: 180,
  },
  {
    store: 'Shirlington',
    region: 'Arlington',
    cySales: 22140.15,
    pySales: 21880.5,
    fcstSales: 22400,
    checks: 575,
    catering: 980,
    comps: 265.2,
    staffMeals: 72.5,
    trainingMeals: 28,
    voids: 165.4,
  },
  {
    store: 'City Ridge',
    region: 'DC',
    cySales: 19875.6,
    pySales: 20540,
    fcstSales: 20200,
    checks: 510,
    catering: 1540.25,
    comps: 290,
    staffMeals: 61,
    trainingMeals: 55,
    voids: 198.2,
  },
  {
    store: 'Landmark',
    region: 'Alexandria',
    cySales: 18920.33,
    pySales: 17650,
    fcstSales: 19000,
    checks: 498,
    catering: 720,
    comps: 410.8,
    staffMeals: 94.25,
    trainingMeals: 36.5,
    voids: 420.5,
  },
  {
    store: 'Fair Lakes',
    region: 'Fairfax',
    cySales: 21240.8,
    pySales: 20990.1,
    fcstSales: 21500,
    checks: 545,
    catering: 1880.4,
    comps: 240.15,
    staffMeals: 58.75,
    trainingMeals: 22,
    voids: 155.1,
  },
  {
    store: 'Fairfax at University Mall',
    region: 'Fairfax',
    cySales: 18246.33,
    pySales: 19120,
    fcstSales: 18600,
    checks: 480,
    catering: 640,
    comps: 198.6,
    staffMeals: 49.8,
    trainingMeals: 18,
    voids: 140,
  },
];

export const BAMBA_AUG12_SYSTEM_CY_SALES = 125273.41;

export const BAMBA_AUG12_CALENDAR_FLAGS: readonly SalesCalendarFlag[] = [
  {
    store: 'Landmark',
    region: 'Alexandria',
    kind: 'driver',
    cause: 'concert',
    thisYear: true,
    lastYear: false,
    note: 'Concert this year, not last. Color as a sales driver, not a prior-year comp.',
  },
  {
    store: 'Fairfax at University Mall',
    region: 'Fairfax',
    kind: 'prohibitor',
    cause: 'school',
    thisYear: true,
    lastYear: false,
    note: 'School in session this year, not last. Color as a sales prohibitor.',
  },
  {
    store: 'City Ridge',
    region: 'DC',
    kind: 'prohibitor',
    cause: 'holiday',
    thisYear: true,
    lastYear: false,
    note: 'Holiday this year, not last. Color as a sales prohibitor.',
  },
];

export const BAMBA_AUG12_DRILL_SOURCE = {
  tenantId: SALES_LABOR_TENANT_ID,
  businessDate: SALES_LABOR_BUSINESS_DATE,
  compsServers: [
    { station: 'FOH-4', store: 'Landmark', comps: 186.4 },
    { station: 'FOH-2', store: 'City Ridge', comps: 142.1 },
    { station: 'FOH-1', store: 'Ballston', comps: 128.75 },
  ],
  staffMeals: [
    { station: 'BOH-1', store: 'Landmark', kind: 'staff' as const, amount: 54.25 },
    { station: 'FOH-3', store: 'Ballston', kind: 'staff' as const, amount: 41 },
  ],
  trainingMeals: [
    { station: 'TRAIN-1', store: 'City Ridge', kind: 'training' as const, amount: 55 },
    { station: 'TRAIN-2', store: 'Landmark', kind: 'training' as const, amount: 36.5 },
  ],
  daypart: [
    { daypart: 'lunch' as const, cySales: 38210.2, checks: 1180 },
    { daypart: 'afternoon' as const, cySales: 16440.15, checks: 510 },
    { daypart: 'dinner' as const, cySales: 59820.73, checks: 1320 },
    { daypart: 'late' as const, cySales: 10802.33, checks: 218 },
  ],
  ticketTimes: [
    { daypart: 'lunch' as const, medianMinutes: 11.4 },
    { daypart: 'afternoon' as const, medianMinutes: 9.8 },
    { daypart: 'dinner' as const, medianMinutes: 14.6 },
    { daypart: 'late' as const, medianMinutes: 12.1 },
  ],
  pMix: [
    { category: 'Tacos', cySales: 51240.18 },
    { category: 'Bowls', cySales: 33810.55 },
    { category: 'Sides', cySales: 18620.4 },
    { category: 'Beverages', cySales: 21602.28 },
  ],
};
