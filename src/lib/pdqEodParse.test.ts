import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  detectPdqFamily,
  parseFilenameBusinessDate,
  parsePdqHourly,
  parsePdqNativeText,
  parsePdqVoidPromo,
  parsePdqZSummary,
} from './pdqEodParse';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/pdq');
const load = (name: string) => readFileSync(join(fixtureDir, name), 'utf8');

describe('PDQ filename business date', () => {
  it('reads M-D-YYYY from the PDQ EOD filename', () => {
    expect(parseFilenameBusinessDate('8-24-2026 ZReport_Summary Sample Kitchen.pdf')).toBe('2026-08-24');
    expect(parseFilenameBusinessDate('8-24-2026 Void_Promo_Report Sample Kitchen.pdf')).toBe('2026-08-24');
    expect(parseFilenameBusinessDate('8-24-2026 Hourly_Sales_Report Sample Kitchen.pdf')).toBe('2026-08-24');
  });
});

describe('PDQ family detection', () => {
  it('maps the three EOD attachments', () => {
    expect(detectPdqFamily('8-24-2026 ZReport_Summary Sample.pdf')).toBe('z-summary');
    expect(detectPdqFamily('8-24-2026 Hourly_Sales_Report Sample.pdf')).toBe('hourly');
    expect(detectPdqFamily('8-24-2026 Void_Promo_Report Sample.pdf')).toBe('void-promo');
  });
});

describe('PDQ ZReport_Summary native text', () => {
  const z = parsePdqZSummary(
    load('sample-z-summary.txt'),
    '8-24-2026 ZReport_Summary Sample Kitchen Lab.pdf',
  );

  it('pulls net sales, mix, labor, and leaves cash unentered when the field is $0', () => {
    expect(z.businessDate).toBe('2026-08-24');
    expect(z.netSales).toEqual(expect.objectContaining({ value: 1000, state: 'unverified' }));
    expect(z.mix.food.value).toBe(600);
    expect(z.mix.beer.value).toBe(200);
    expect(z.mix.liquor.value).toBe(150);
    expect(z.mix.pop.value).toBe(50);
    expect(z.laborDollars.value).toBe(280);
    expect(z.cashStatus).toBe('unentered');
    expect(z.expectedCash.value).toBe(0);
    expect(z.lateDeliveryCount).toBe(1);
    expect(z.lateDeliverySales.value).toBe(22);
    expect(z.inHouseDeliveryCount).toBe(8);
    expect(z.inHouseDeliverySales.value).toBe(220);
    expect(z.deliveryChannel).toBe('in_house');
  });

  it('does not invent wine when the category is absent', () => {
    expect(z.mix.wine).toEqual(expect.objectContaining({
      value: null,
      state: 'missing-evidence',
    }));
  });
});

describe('PDQ missing category is not $0', () => {
  it('marks absent pop as Missing Evidence', () => {
    const z = parsePdqZSummary(
      load('sample-z-missing-pop.txt'),
      '8-23-2026 ZReport_Summary Sample Kitchen Lab.pdf',
    );
    expect(z.mix.food.value).toBe(540);
    expect(z.mix.pop).toEqual(expect.objectContaining({
      value: null,
      state: 'missing-evidence',
      sourceLabel: 'Menu Category · Pop',
    }));
    expect(z.mix.wine.state).toBe('missing-evidence');
  });
});

describe('PDQ Hourly_Sales_Report', () => {
  it('parses hour, sales, guests, and names the peak hour', () => {
    const hourly = parsePdqHourly(
      load('sample-hourly.txt'),
      '8-24-2026 Hourly_Sales_Report Sample Kitchen Lab.pdf',
    );
    expect(hourly.businessDate).toBe('2026-08-24');
    expect(hourly.rows).toHaveLength(9);
    expect(hourly.peak).toEqual({ hour: '6:00 PM', sales: 220, guests: 16 });
  });
});

describe('PDQ Void_Promo_Report', () => {
  it('parses void and promo dollars', () => {
    const voids = parsePdqVoidPromo(
      load('sample-void-promo.txt'),
      '8-24-2026 Void_Promo_Report Sample Kitchen Lab.pdf',
    );
    expect(voids.voids.value).toBe(12);
    expect(voids.promotions.value).toBe(8);
  });
});

describe('PDQ native-text dispatcher', () => {
  it('routes by filename even when the body is mixed', () => {
    const parsed = parsePdqNativeText(
      load('sample-hourly.txt'),
      '8-24-2026 Hourly_Sales_Report Sample.pdf',
    );
    expect(parsed.family).toBe('hourly');
  });
});
