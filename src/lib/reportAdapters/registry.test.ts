import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assertNoToastPosForCtapSales } from '@/lib/ctapPosLock';
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

  it('registers Toast + PDQ + Hy-Vee families and not a silent dollar invent', () => {
    expect(isRegisteredPosFamily('toast', 'sales-summary')).toBe(true);
    expect(isRegisteredPosFamily('toast', 'labor-breakdown')).toBe(true);
    expect(isRegisteredPosFamily('toast', 'time-entries')).toBe(true);
    expect(isRegisteredPosFamily('toast', 'item-selection')).toBe(true);
    expect(isRegisteredPosFamily('pdq', 'z-summary')).toBe(true);
    expect(isRegisteredPosFamily('pdq', 'hourly')).toBe(true);
    expect(isRegisteredPosFamily('pdq', 'void-promo')).toBe(true);
    expect(isRegisteredPosFamily('hy-vee', 'invoice')).toBe(true);
    expect(isRegisteredPosFamily('square', 'sales-summary')).toBe(false);
    expect(isRegisteredPosFamily('humes', 'invoice')).toBe(false);
    const pos = new Set(listReportAdapters().map((row) => row.pos));
    expect([...pos].sort()).toEqual(['hy-vee', 'pdq', 'toast']);
  });

  it('routes PDQ morning-pack filenames through the registry', () => {
    const zText = readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq/sample-z-large-pizzas.txt'), 'utf8');
    expect(detectReport('8-24-2026 ZReport_Summary.pdf', zText)).toEqual({
      pos: 'pdq',
      family: 'z-summary',
    });
    const pack = parseRegisteredReport(zText, '8-24-2026 ZReport_Summary.pdf');
    expect(pack && 'mix' in pack ? pack.mix.food : null).toBe(400);
    expect(pack && 'mix' in pack ? pack.mix.largePizzas : null).toBe(250);
    expect(pack && 'grandTotal' in pack ? pack.grandTotal : null).toBe(1123.5);
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

  it('routes PDQ Z to the PDQ adapter, not Toast', () => {
    expect(detectReport('8-24-2026 ZReport_Summary.pdf')).toEqual({
      pos: 'pdq',
      family: 'z-summary',
    });
  });

  it('Fails if a Toast pack is used as CTAP sales', () => {
    const toast = parseRegisteredReport(load('SalesSummary_2026-08-31.csv'), 'SalesSummary_2026-08-31.csv');
    expect(toast?.pos).toBe('toast');
    expect(() => assertNoToastPosForCtapSales(toast!.pos)).toThrow(/PDQ POS only/);
    const zText = readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq/sample-z-large-pizzas.txt'), 'utf8');
    const z = parseRegisteredReport(zText, '8-24-2026 ZReport_Summary.pdf');
    expect(z?.pos).toBe('pdq');
    expect(() => assertNoToastPosForCtapSales(z!.pos)).not.toThrow();
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
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'humes' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'pfg' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'pepsi' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'fort-dodge' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'confluence' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'us-foods' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'northern-lights' && row.status === 'hook')).toBe(true);
    expect(plannedReportAdapterHooks().some((row) => row.pos === 'pdq' && row.status === 'registered')).toBe(true);
  });
});
