import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { NAG_TOAST_GT } from './reportAdapters/nagToastGt';
import {
  answerToastDeskQuestion,
  collectToastFacts,
  detectToastFamily,
  parseToastReport,
  routeToastDeskQuestion,
  toastSourceTags,
} from './toastParse';

function load(name: string): string {
  return readFileSync(path.join(process.cwd(), 'tests/fixtures/toast', name), 'utf8');
}

function bytes(name: string): Uint8Array {
  return new TextEncoder().encode(load(name));
}

const FILES = {
  labor: 'LaborBreakDown_2026-08-31.csv',
  salesDay: 'SalesSummary_2026-08-31.csv',
  salesWeek: 'SalesSummary_2026-08-24_2026-08-30.csv',
  items: 'ItemSelectionDetails.csv',
  time: 'TimeEntries.csv',
} as const;

function seatFacts() {
  const uploads = Object.values(FILES).map((filename) => ({
    filename,
    sourceTags: toastSourceTags(filename, bytes(filename)),
  }));
  return collectToastFacts(uploads);
}

describe('Toast family detect', () => {
  it('maps the four NAG report names', () => {
    expect(detectToastFamily(FILES.labor)).toBe('labor-breakdown');
    expect(detectToastFamily(FILES.salesDay)).toBe('sales-summary');
    expect(detectToastFamily(FILES.time)).toBe('time-entries');
    expect(detectToastFamily(FILES.items)).toBe('item-selection');
    expect(detectToastFamily('ZReport_Summary.pdf')).toBeNull();
  });
});

describe('Toast parsers — NAG ground truth', () => {
  it('Q1 LaborBreakDown Aug 31: 1211.85 / 35.56 / 3408.15', () => {
    const pack = parseToastReport(load(FILES.labor), FILES.labor);
    expect(pack?.family).toBe('labor-breakdown');
    expect(pack?.businessDate).toBe('2026-08-31');
    expect(pack?.laborCost).toBe(NAG_TOAST_GT.laborCost);
    expect(pack?.laborPctNet).toBe(NAG_TOAST_GT.laborPctNet);
    expect(pack?.netSales).toBe(NAG_TOAST_GT.dayNetSales);
    expect(pack?.grossSales).toBe(NAG_TOAST_GT.dayGrossSales);
    expect(pack?.laborPctGross).toBe(NAG_TOAST_GT.laborPctGross);
  });

  it('Q8 SalesSummary day + week', () => {
    const day = parseToastReport(load(FILES.salesDay), FILES.salesDay);
    const week = parseToastReport(load(FILES.salesWeek), FILES.salesWeek);
    expect(day?.netSales).toBe(NAG_TOAST_GT.dayNetSales);
    expect(day?.businessDate).toBe(NAG_TOAST_GT.laborDate);
    expect(week?.netSales).toBe(NAG_TOAST_GT.weekNetSales);
    expect(week?.periodStart).toBe(NAG_TOAST_GT.weekStart);
    expect(week?.periodEnd).toBe(NAG_TOAST_GT.weekEnd);
  });

  it('Q10 ItemSelectionDetails Void?=true is 24 lines', () => {
    const pack = parseToastReport(load(FILES.items), FILES.items);
    expect(pack?.voidLineCount).toBe(NAG_TOAST_GT.voidLines);
    expect(pack?.voidItems).toEqual([
      { item: 'Burger', count: 6 },
      { item: 'Fries', count: 5 },
      { item: 'Fountain Drink', count: 4 },
      { item: 'Brownie', count: 3 },
      { item: 'House Salad', count: 3 },
      { item: 'Wings', count: 3 },
    ]);
    expect(pack?.itemDayNet[NAG_TOAST_GT.strongestItemDay]).toBe(NAG_TOAST_GT.strongestItemNet);
    expect(pack?.voidItems.every((row) => !/\b(server|employee|id)\b/i.test(row.item))).toBe(true);
  });
});

describe('Toast desk answers Q1 / Q8 / Q10 / Q11', () => {
  it('routes the operator Qs', () => {
    expect(routeToastDeskQuestion('What was labor Aug 31?')).toBe('labor');
    expect(routeToastDeskQuestion('Net sales Aug 31 and the week of Aug 24-30. Strongest day?')).toBe('sales');
    expect(routeToastDeskQuestion('What were voids Aug 24-30?')).toBe('voids');
    expect(routeToastDeskQuestion('What is 30/60/90 payables?')).toBe('payables');
  });

  it('Q1 Verified from LaborBreakDown', () => {
    const answer = answerToastDeskQuestion('What was labor cost and labor % Aug 31?', seatFacts());
    expect(answer?.kind).toBe('labor');
    expect(answer?.verifiedClose).toBe(true);
    expect(answer?.sampleDollars).toBe('toast-verified');
    expect(answer?.headline).toMatch(/Verified/);
    expect(answer?.facts.join('\n')).toMatch(/1,211\.85/);
    expect(answer?.facts.join('\n')).toMatch(/35\.56/);
    expect(answer?.facts.join('\n')).toMatch(/3,408\.15/);
    expect(answer?.facts.join('\n')).toMatch(/LaborBreakDown_2026-08-31/);
    expect(answer?.facts.join('\n')).not.toMatch(/invent/i);
  });

  it('Q8 Verified day+week and Estimated strongest day from items', () => {
    const answer = answerToastDeskQuestion(
      'What were net sales Aug 31 and Aug 24-30? Strongest day?',
      seatFacts(),
    );
    expect(answer?.kind).toBe('sales');
    expect(answer?.verifiedClose).toBe(true);
    expect(answer?.facts.join('\n')).toMatch(/3,408\.15/);
    expect(answer?.facts.join('\n')).toMatch(/36,827\.34/);
    expect(answer?.facts.join('\n')).toMatch(/Estimated strongest day/);
    expect(answer?.facts.join('\n')).toMatch(/6,619\.00/);
    expect(answer?.facts.join('\n')).toMatch(/Aug 25/);
    expect(answer?.facts.join('\n')).toMatch(/sum\(Net Price\)/);
    expect(answer?.sourceTags.some((tag) => tag.tag === 'estimated')).toBe(true);
  });

  it('Q8 strongest day is Estimated when only ItemSelectionDetails is on the seat', () => {
    const facts = collectToastFacts([
      { filename: FILES.items, sourceTags: toastSourceTags(FILES.items, bytes(FILES.items)) },
    ]);
    const answer = answerToastDeskQuestion('Strongest day last week?', facts);
    expect(answer?.verifiedClose).toBe(false);
    expect(answer?.sampleDollars).toBe('toast-estimated');
    expect(answer?.headline).toMatch(/Estimated/);
    expect(answer?.facts.join('\n')).toMatch(/6,619\.00/);
    expect(answer?.facts.join('\n')).toMatch(/Aug 25/);
    expect(answer?.facts.join('\n')).toMatch(/Missing until a SalesSummary/);
  });

  it('Q8 strongest day stays Missing when desk only has a week total and no items', () => {
    const facts = collectToastFacts([
      { filename: FILES.salesWeek, sourceTags: toastSourceTags(FILES.salesWeek, bytes(FILES.salesWeek)) },
    ]);
    const answer = answerToastDeskQuestion('Strongest day last week?', facts);
    expect(answer?.facts.join('\n')).toMatch(/36,827\.34/);
    expect(answer?.facts.join('\n')).toMatch(/Strongest day stays Missing/);
    expect(answer?.facts.join('\n')).not.toMatch(/6,619/);
  });

  it('Q10 Verified void lines, no theft narrative, no PDQ demand', () => {
    const answer = answerToastDeskQuestion('What were voids Aug 24-30?', seatFacts());
    expect(answer?.verifiedClose).toBe(true);
    expect(answer?.headline).toMatch(/24 void lines/);
    expect(answer?.facts.join('\n')).toMatch(/Burger × 6/);
    expect(answer?.facts.join('\n')).toMatch(/Fries × 5/);
    expect(answer?.needs).not.toMatch(/PDQ Void_Promo/);
    expect(answer?.facts.join('\n').toLowerCase()).not.toMatch(/thief|theft|steal|skim/);
  });

  it('Q11 payables stay Missing with no AP file', () => {
    const answer = answerToastDeskQuestion('What is our 30/60/90 payables?', seatFacts());
    expect(answer?.kind).toBe('payables');
    expect(answer?.verifiedClose).toBe(false);
    expect(answer?.sampleDollars).toBe('none-verified');
    expect(answer?.headline).toMatch(/Missing/);
    expect(answer?.facts.join('\n')).not.toMatch(/\$\d/);
    expect(answer?.needs).toMatch(/AP aging/);
  });

  it('does not invent a void count when only sales/labor are on the seat', () => {
    const facts = collectToastFacts([
      { filename: FILES.labor, sourceTags: toastSourceTags(FILES.labor, bytes(FILES.labor)) },
      { filename: FILES.salesDay, sourceTags: toastSourceTags(FILES.salesDay, bytes(FILES.salesDay)) },
    ]);
    const answer = answerToastDeskQuestion('Show me voids', facts);
    expect(answer?.verifiedClose).toBe(false);
    expect(answer?.headline).toMatch(/Missing/);
    expect(answer?.needs).toMatch(/ItemSelectionDetails/);
    expect(answer?.needs).not.toMatch(/PDQ Void_Promo/);
  });
});
