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
    expect(parseFilenameBusinessDate('9-2-2026 ZReport_Summary Sample Kitchen.pdf')).toBe('2026-09-02');
  });
});

describe('PDQ family detection', () => {
  it('maps the three EOD attachments', () => {
    expect(detectPdqFamily('8-24-2026 ZReport_Summary Sample.pdf')).toBe('z-summary');
    expect(detectPdqFamily('8-24-2026 Hourly_Sales_Report Sample.pdf')).toBe('hourly');
    expect(detectPdqFamily('8-24-2026 Void_Promo_Report Sample.pdf')).toBe('void-promo');
  });

  it('does not treat an EOD cover letter that lists all three names as a Z', () => {
    expect(detectPdqFamily(
      'EOD Reports Generated From Sample Kitchen',
      [
        'EOD Reports Generated From Sample Kitchen',
        '9-2-2026 ZReport_Summary Sample Kitchen.pdf',
        '9-2-2026 Hourly_Sales_Report Sample Kitchen.pdf',
        '9-2-2026 Void_Promo_Report Sample Kitchen.pdf',
      ].join('\n'),
    )).toBe('unknown');
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
  });

  it('does not invent wine when the category is absent', () => {
    expect(z.mix.wine).toEqual(expect.objectContaining({
      value: null,
      state: 'missing-evidence',
    }));
  });

  it('keeps Large Pizzas Missing when that Menu Category line is absent', () => {
    expect(z.mix.largePizzas).toEqual(expect.objectContaining({
      value: null,
      state: 'missing-evidence',
      sourceLabel: 'Menu Category · Large Pizzas',
    }));
  });

  it('reads channel mix from Sales Summary trans types', () => {
    expect(z.channels.pickup.value).toBe(180);
    expect(z.channels.delivery.value).toBe(220);
    expect(z.channels.bar.value).toBe(200);
    expect(z.channels.table.value).toBe(400);
  });
});

describe('PDQ Large Pizzas ≠ Food', () => {
  const z = parsePdqZSummary(
    load('sample-z-large-pizzas.txt'),
    '8-24-2026 ZReport_Summary Sample Kitchen Lab.pdf',
  );

  it('quotes Food and Large Pizzas as separate Menu Category lines', () => {
    expect(z.mix.food.value).toBe(400);
    expect(z.mix.largePizzas.value).toBe(250);
    expect(z.mix.food.sourceLabel).toBe('Menu Category · Food');
    expect(z.mix.largePizzas.sourceLabel).toBe('Menu Category · Large Pizzas');
    expect(z.grandTotal.value).toBe(1123.5);
    expect(z.netSales.value).toBe(1050);
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

  it('parses Spec Instruction / Neg Menu / Neg Special / Promo / UKNOWN without inventing', () => {
    const voids = parsePdqVoidPromo(
      load('sample-void-promo-negatives.txt'),
      '8-24-2026 Void_Promo_Report Sample Kitchen Lab.pdf',
    );
    expect(voids.voids.value).toBe(12);
    expect(voids.promotions.value).toBe(8);
    expect(voids.negatives.specInstruction.value).toBe(5);
    expect(voids.negatives.negMenu.value).toBe(3);
    expect(voids.negatives.negSpecialInstruction.value).toBe(2);
    expect(voids.negatives.promo.value).toBe(8);
    expect(voids.negatives.unknown.value).toBe(1.5);
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
