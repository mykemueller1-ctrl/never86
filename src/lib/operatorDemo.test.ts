import { describe, expect, it } from 'vitest';
import {
  compareDemoInvoices, compareDemoShifts, calculateDemoPour,
  PREVIOUS_DEMO_INVOICE, CURRENT_DEMO_INVOICE,
} from './operatorDemo';

describe('public sample invoice comparison', () => {
  it('reconciles the advertised cheese example to the visible invoice inputs', () => {
    const result = compareDemoInvoices(PREVIOUS_DEMO_INVOICE, CURRENT_DEMO_INVOICE)!;
    expect(result.previousUnitPrice).toBe(2.4);
    expect(result.currentUnitPrice).toBe(2.6);
    expect(result.percentChange).toBeCloseTo(8.333333);
    expect(result.equivalentCaseDifference).toBeCloseTo(6);
    expect(result.currentOrderDifference).toBeCloseTo(12);
    expect(result.currentInvoiceTotal).toBe(156);
  });
  it('normalizes a smaller case before comparing prices', () => {
    const result = compareDemoInvoices(PREVIOUS_DEMO_INVOICE, { ...CURRENT_DEMO_INVOICE, casePrice: 36, poundsPerCase: 15 })!;
    expect(result.unitDifference).toBe(0);
    expect(result.currentOrderDifference).toBe(0);
  });
  it('withholds a result for mismatched products or unusable measurements', () => {
    expect(compareDemoInvoices(PREVIOUS_DEMO_INVOICE, { ...CURRENT_DEMO_INVOICE, sku: 'OTHER' })).toBeNull();
    expect(compareDemoInvoices(PREVIOUS_DEMO_INVOICE, { ...CURRENT_DEMO_INVOICE, vendor: 'Different' })).toBeNull();
    for (const value of [0, -1, NaN, Infinity]) {
      expect(compareDemoInvoices(PREVIOUS_DEMO_INVOICE, { ...CURRENT_DEMO_INVOICE, poundsPerCase: value })).toBeNull();
    }
  });
});

describe('public sample labor comparison', () => {
  const planned = { start: '16:00', end: '22:00', nextDay: false, unpaidBreakMinutes: 0 };
  const actual = { start: '16:00', end: '00:00', nextDay: true, unpaidBreakMinutes: 0 };
  it('finds two extra hours without inventing a wage or implying theft', () => {
    expect(compareDemoShifts(planned, actual)).toEqual({ plannedMinutes: 360, actualMinutes: 480, differenceMinutes: 120, wageDifference: null });
  });
  it('requires an explicit next day for overnight punches', () => {
    expect(compareDemoShifts(planned, { ...actual, nextDay: false })).toBeNull();
  });
  it('subtracts recorded unpaid breaks and only computes supplied straight hourly wages', () => {
    const result = compareDemoShifts(planned, { ...actual, unpaidBreakMinutes: 30 }, 18)!;
    expect(result.differenceMinutes).toBe(90);
    expect(result.wageDifference).toBe(27);
  });
  it('rejects impossible times and breaks longer than the shift', () => {
    expect(compareDemoShifts(planned, { ...actual, start: '25:00' })).toBeNull();
    expect(compareDemoShifts(planned, { ...actual, unpaidBreakMinutes: 600 })).toBeNull();
  });
});

describe('public sample pour calculation', () => {
  it('uses US fluid ounces and does not round the conversion before costing', () => {
    expect(calculateDemoPour(25, 750, 1.5)?.costPerPour).toBeCloseTo(1.478676478, 8);
    expect(calculateDemoPour(25, 750, 2)?.costPerPour).toBeCloseTo(1.971568638, 8);
  });
  it('withholds a result for impossible or absent inputs', () => {
    expect(calculateDemoPour(25, 0, 1.5)).toBeNull();
    expect(calculateDemoPour(NaN, 750, 1.5)).toBeNull();
    expect(calculateDemoPour(25, 750, 30)).toBeNull();
  });
});
