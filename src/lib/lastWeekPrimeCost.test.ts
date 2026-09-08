import { describe, expect, it } from 'vitest';
import { NAG_TOAST_GT } from '@/lib/reportAdapters/nagToastGt';
import { TOAST_PARSE_PREFIX, type ToastFactPack } from '@/lib/toastParse';
import {
  LAST_WEEK_PRIME_BAND_MAX,
  LAST_WEEK_PRIME_BAND_MIN,
  LAST_WEEK_PRIME_LOAD_ASK,
  answerLastWeekPrime,
  collectLastWeekPrime,
  emptyLastWeekPrime,
  routeLastWeekPrimeQuestion,
} from '@/lib/lastWeekPrimeCost';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';

function toastTag(pack: ToastFactPack): SourceTag {
  return { tag: 'verified', source: `${TOAST_PARSE_PREFIX}${JSON.stringify(pack)}` };
}

function nagToastUploads() {
  return [
    {
      filename: 'SalesSummary_2026-08-24_2026-08-30.csv',
      sourceTags: [
        toastTag({
          pos: 'toast',
          family: 'sales-summary',
          filename: 'SalesSummary_2026-08-24_2026-08-30.csv',
          corpus: 'nag-seat',
          businessDate: null,
          periodStart: NAG_TOAST_GT.weekStart,
          periodEnd: NAG_TOAST_GT.weekEnd,
          netSales: NAG_TOAST_GT.weekNetSales,
          grossSales: null,
          laborCost: null,
          laborPctNet: null,
          laborPctGross: null,
          dayNetSales: { [NAG_TOAST_GT.weekStart]: 1 },
          voidLineCount: null,
          voidItems: [],
          itemDayNet: {},
          hours: null,
        }),
      ],
    },
    {
      filename: 'LaborBreakDown_2026-08-31.csv',
      sourceTags: [
        toastTag({
          pos: 'toast',
          family: 'labor-breakdown',
          filename: 'LaborBreakDown_2026-08-31.csv',
          corpus: 'nag-seat',
          businessDate: NAG_TOAST_GT.laborDate,
          periodStart: NAG_TOAST_GT.laborDate,
          periodEnd: NAG_TOAST_GT.laborDate,
          netSales: NAG_TOAST_GT.dayNetSales,
          grossSales: NAG_TOAST_GT.dayGrossSales,
          laborCost: NAG_TOAST_GT.laborCost,
          laborPctNet: NAG_TOAST_GT.laborPctNet,
          laborPctGross: NAG_TOAST_GT.laborPctGross,
          dayNetSales: {},
          voidLineCount: null,
          voidItems: [],
          itemDayNet: {},
          hours: null,
        }),
      ],
    },
  ];
}

describe('last-week prime — Action Shift path', () => {
  it('routes load / prime / making-money asks and leaves Toast Q8 alone', () => {
    expect(routeLastWeekPrimeQuestion(LAST_WEEK_PRIME_LOAD_ASK)).toBe(true);
    expect(routeLastWeekPrimeQuestion('What is last-week prime?')).toBe(true);
    expect(routeLastWeekPrimeQuestion('Are we making money under 60-65?')).toBe(true);
    expect(routeLastWeekPrimeQuestion('What were net sales Aug 31 and the week Aug 24-30? Strongest day?')).toBe(false);
    expect(routeLastWeekPrimeQuestion('What was labor cost and labor percent on Aug 31?')).toBe(false);
  });

  it('NAG Toast week + labor stay Verified; food / pop / liquor / beer stay Missing — no invented %', () => {
    const snap = collectLastWeekPrime('demo:nag-prime', nagToastUploads(), 'New American Grill');
    expect(snap.invented).toBe(false);
    expect(snap.weekSales).toBe(NAG_TOAST_GT.weekNetSales);
    expect(snap.families.find((row) => row.id === 'week-sales')).toMatchObject({
      honesty: 'Verified',
      amount: NAG_TOAST_GT.weekNetSales,
    });
    expect(snap.families.find((row) => row.id === 'labor')).toMatchObject({
      honesty: 'Verified',
      amount: NAG_TOAST_GT.laborCost,
    });
    expect(snap.missingIds).toEqual(['food', 'pop', 'liquor', 'beer']);
    expect(snap.primePct).toBeNull();
    expect(snap.cogsTotal).toBeNull();
    expect(snap.honesty).toBe('Missing');
    expect(snap.headline).toMatch(/Missing — last-week prime/);
    expect(snap.headline).toMatch(/Food, Pop, Liquor, Beer/);
    expect(snap.headline).not.toMatch(/%\s*\d/);
    const answer = answerLastWeekPrime(snap);
    expect(answer.slug).toBe('action-shift');
    expect(answer.verifiedClose).toBe(false);
    expect(answer.sampleDollars).toBe('none-verified');
    expect(answer.facts.join(' ')).toMatch(/Action Shift/);
    expect(answer.facts.join(' ')).not.toMatch(/\bPulse\b/);
    expect(answer.facts.join(' ')).toMatch(/Prime % stays Missing/);
  });

  it('invoice paper and unverified cogs tags do not invent food / pop / liquor / beer $', () => {
    const snap = collectLastWeekPrime(
      'demo:nag-prime',
      [
        ...nagToastUploads(),
        {
          filename: 'sysco-truck.jpg',
          sourceTags: [
            { tag: 'unverified', source: 'operator-upload:invoice-truck' },
            { tag: 'unverified', source: 'cogs:food:4000' },
            { tag: 'unverified', source: 'invoice-id:INV-88' },
          ],
        },
      ],
      'New American Grill',
    );
    expect(snap.families.filter((row) => ['food', 'pop', 'liquor', 'beer'].includes(row.id)).every((row) => (
      row.honesty === 'Missing' && row.amount == null
    ))).toBe(true);
    expect(snap.primePct).toBeNull();
  });

  it('computes Verified prime % only when every family has a same-week dollar', () => {
    const snap = collectLastWeekPrime(
      'demo:nag-prime',
      [
        ...nagToastUploads(),
        {
          filename: 'last-week-cogs.txt',
          sourceTags: [
            { tag: 'verified', source: 'cogs:food:4000' },
            { tag: 'verified', source: 'cogs:pop:500' },
            { tag: 'verified', source: 'cogs:liquor:2000' },
            { tag: 'verified', source: 'cogs:beer:1500' },
          ],
        },
      ],
      'New American Grill',
    );
    const cogs = NAG_TOAST_GT.laborCost + 4000 + 500 + 2000 + 1500;
    const pct = Math.round((cogs / NAG_TOAST_GT.weekNetSales) * 10000) / 100;
    expect(snap.honesty).toBe('Verified');
    expect(snap.cogsTotal).toBe(cogs);
    expect(snap.primePct).toBe(pct);
    expect(snap.missingIds).toEqual([]);
    expect(snap.headline).toContain(`Verified last-week prime ${pct}%`);
    expect(snap.headline).toContain(`${LAST_WEEK_PRIME_BAND_MIN}–${LAST_WEEK_PRIME_BAND_MAX}%`);
    const answer = answerLastWeekPrime(snap);
    expect(answer.verifiedClose).toBe(true);
    expect(answer.sampleDollars).toBe('prime-verified');
    expect(answer.facts.join(' ')).toMatch(/Action Shift/);
  });

  it('CTAP never reads NAG Toast week or labor on the last-week prime path', () => {
    const snap = collectLastWeekPrime('demo:ctap-prime', nagToastUploads(), 'Community Tap');
    expect(snap.weekSales).toBeNull();
    expect(snap.families.find((row) => row.id === 'labor')?.amount).toBeNull();
    expect(snap.missingIds).toEqual(['week-sales', 'labor', 'food', 'pop', 'liquor', 'beer']);
    expect(snap.primePct).toBeNull();
    expect(snap.headline).toBe('Missing — last-week prime. Load last-week COGS.');
    expect(emptyLastWeekPrime().primePct).toBeNull();
  });
});
