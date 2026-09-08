import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { NAG_TOAST_GT } from './nagToastGt';
import {
  detectReport,
  isRegisteredPosFamily,
  listReportAdapters,
  parseRegisteredReport,
  plannedReportAdapterHooks,
  registerReportAdapter,
  unregisterReportAdapter,
} from './registry';

function load(name: string): string {
  return readFileSync(path.join(process.cwd(), 'tests/fixtures/toast', name), 'utf8');
}

describe('report adapter registry', () => {
  afterEach(() => {
    unregisterReportAdapter('square', 'sales-summary');
  });

  it('registers Toast families and not a silent dollar invent', () => {
    expect(isRegisteredPosFamily('toast', 'sales-summary')).toBe(true);
    expect(isRegisteredPosFamily('toast', 'labor-breakdown')).toBe(true);
    expect(isRegisteredPosFamily('toast', 'time-entries')).toBe(true);
    expect(isRegisteredPosFamily('toast', 'item-selection')).toBe(true);
    expect(isRegisteredPosFamily('square', 'sales-summary')).toBe(false);
    expect(listReportAdapters().every((row) => row.pos === 'toast')).toBe(true);
  });

  it('routes NAG Toast filenames through the registry to locked cents', () => {
    expect(detectReport('LaborBreakDown_2026-08-31.csv')).toEqual({
      pos: 'toast',
      family: 'labor-breakdown',
    });
    const labor = parseRegisteredReport(load('LaborBreakDown_2026-08-31.csv'), 'LaborBreakDown_2026-08-31.csv');
    expect(labor?.laborCost).toBe(NAG_TOAST_GT.laborCost);
    expect(labor?.laborPctNet).toBe(NAG_TOAST_GT.laborPctNet);
    expect(labor?.netSales).toBe(NAG_TOAST_GT.dayNetSales);

    const day = parseRegisteredReport(load('SalesSummary_2026-08-31.csv'), 'SalesSummary_2026-08-31.csv');
    expect(day?.netSales).toBe(NAG_TOAST_GT.dayNetSales);
    const week = parseRegisteredReport(
      load('SalesSummary_2026-08-24_2026-08-30.csv'),
      'SalesSummary_2026-08-24_2026-08-30.csv',
    );
    expect(week?.netSales).toBe(NAG_TOAST_GT.weekNetSales);
    const items = parseRegisteredReport(load('ItemSelectionDetails.csv'), 'ItemSelectionDetails.csv');
    expect(items?.voidLineCount).toBe(NAG_TOAST_GT.voidLines);
  });

  it('keeps PDQ Z out of the Toast adapter so the desk does not fork POS', () => {
    expect(detectReport('8-24-2026 ZReport_Summary.pdf')).toBeNull();
  });

  it('lets the next POS register without rewriting the desk, and parse=null invents no $', () => {
    registerReportAdapter({
      pos: 'square',
      family: 'sales-summary',
      detect: (filename) => /square[_-]?sales/i.test(filename),
      parse: () => null,
    });
    expect(detectReport('square-sales.csv')).toEqual({ pos: 'square', family: 'sales-summary' });
    expect(parseRegisteredReport('Net Sales,99999', 'square-sales.csv')).toBeNull();
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'square' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'sysco')).toBe(true);
  });
});
