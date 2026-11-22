import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runVendorDrift, type VendorDriftReport } from './vendorDriftCsv';

const header = 'Vendor,SKU,Period,UnitPrice';
function report(csv: string): VendorDriftReport {
  const result = runVendorDrift(csv);
  expect(result).not.toHaveProperty('ok', false);
  if ('ok' in result) throw new Error(result.error);
  return result;
}
function held(csv: string, reason: RegExp) {
  const result = runVendorDrift(csv);
  expect(result).toMatchObject({ ok: false, error: expect.stringMatching(reason) });
  expect(result).not.toHaveProperty('flaggedSkus');
  expect(result).not.toHaveProperty('totalDriftDollars');
}

describe('vendor CSV comparison', () => {
  it('preserves the complete published monthly sample result', () => {
    const csv = readFileSync(new URL('../../public/samples/vendor-drift.csv', import.meta.url), 'utf8');
    expect(report(csv)).toMatchInlineSnapshot(`
      {
        "currPeriod": "2026-05",
        "flaggedSkus": 6,
        "perSku": [
          {
            "category": "Dry",
            "currPeriod": "2026-05",
            "currPrice": 21.45,
            "driftDollars": 3.349999999999998,
            "driftPct": 0.18508287292817666,
            "flagged": true,
            "prevPeriod": "2026-04",
            "prevPrice": 18.1,
            "sku": "Pasta Penne Rigate 2/10 LB",
            "vendor": "PFG",
          },
          {
            "category": "Dry",
            "currPeriod": "2026-05",
            "currPrice": 79.2,
            "driftDollars": 10.799999999999997,
            "driftPct": 0.1578947368421052,
            "flagged": true,
            "prevPeriod": "2026-04",
            "prevPrice": 68.4,
            "sku": "Olive Oil Pure 4/1 GAL",
            "vendor": "PFG",
          },
          {
            "category": "Bar",
            "currPeriod": "2026-05",
            "currPrice": 46.75,
            "driftDollars": 4.25,
            "driftPct": 0.1,
            "flagged": true,
            "prevPeriod": "2026-04",
            "prevPrice": 42.5,
            "sku": "Premium Cocktail Mix Asst",
            "vendor": "Northern Lights",
          },
          {
            "category": "Cheese",
            "currPeriod": "2026-05",
            "currPrice": 2.37,
            "driftDollars": 0.16000000000000014,
            "driftPct": 0.07239819004524893,
            "flagged": true,
            "prevPeriod": "2026-04",
            "prevPrice": 2.21,
            "sku": "Mozzarella LMPS 6/5 LB",
            "vendor": "PFG",
          },
          {
            "category": "Eggs",
            "currPeriod": "2026-05",
            "currPrice": 23.95,
            "driftDollars": 1.4499999999999993,
            "driftPct": 0.06444444444444442,
            "flagged": true,
            "prevPeriod": "2026-04",
            "prevPrice": 22.5,
            "sku": "Eggs Large Grade A 15DZ",
            "vendor": "Sysco",
          },
          {
            "category": "Produce",
            "currPeriod": "2026-05",
            "currPrice": 37.07,
            "driftDollars": 1.8699999999999974,
            "driftPct": 0.05312499999999992,
            "flagged": true,
            "prevPeriod": "2026-04",
            "prevPrice": 35.2,
            "sku": "Fries Straight Cut 3/8 6/5 LB",
            "vendor": "Sysco",
          },
          {
            "category": "Eggs",
            "currPeriod": "2026-05",
            "currPrice": 18.57,
            "driftDollars": 0.620000000000001,
            "driftPct": 0.034540389972144904,
            "flagged": false,
            "prevPeriod": "2026-04",
            "prevPrice": 17.95,
            "sku": "Eggs Large Grade A 15DZ",
            "vendor": "PFG",
          },
          {
            "category": "Specialty",
            "currPeriod": "2026-05",
            "currPrice": 13.38,
            "driftDollars": 0.4300000000000015,
            "driftPct": 0.03320463320463332,
            "flagged": false,
            "prevPeriod": "2026-04",
            "prevPrice": 12.95,
            "sku": "Honey Packer R4910 6/5 LB",
            "vendor": "PFG",
          },
          {
            "category": "Canned",
            "currPeriod": "2026-05",
            "currPrice": 32.95,
            "driftDollars": 0.15000000000000568,
            "driftPct": 0.004573170731707491,
            "flagged": false,
            "prevPeriod": "2026-04",
            "prevPrice": 32.8,
            "sku": "Tomato Crushed 6/10 CN",
            "vendor": "PFG",
          },
          {
            "category": "Cheese",
            "currPeriod": "2026-05",
            "currPrice": 1.96,
            "driftDollars": 0,
            "driftPct": 0,
            "flagged": false,
            "prevPeriod": "2026-04",
            "prevPrice": 1.96,
            "sku": "Mozzarella LMPS 6/5 LB",
            "vendor": "Sysco",
          },
          {
            "category": "Produce",
            "currPeriod": "2026-05",
            "currPrice": 28.5,
            "driftDollars": 0,
            "driftPct": 0,
            "flagged": false,
            "prevPeriod": "2026-04",
            "prevPrice": 28.5,
            "sku": "Fries Straight Cut 3/8 6/5 LB",
            "vendor": "PFG",
          },
          {
            "category": "Dry",
            "currPeriod": "2026-05",
            "currPrice": 19.5,
            "driftDollars": 0,
            "driftPct": 0,
            "flagged": false,
            "prevPeriod": "2026-04",
            "prevPrice": 19.5,
            "sku": "Pasta Penne Rigate 2/10 LB",
            "vendor": "Sysco",
          },
        ],
        "periodsCount": 2,
        "prevPeriod": "2026-04",
        "rowsParsed": 24,
        "totalDriftDollars": 23.08,
        "totalSkus": 12,
        "vendors": [
          "Northern Lights",
          "PFG",
          "Sysco",
        ],
      }
    `);
  });

  it.each([
    'Vendor,SKU,Description,Invoice Date,Unit Price,Pack,Billed Unit',
    'Vendor,SKU,Description,Period,UnitPrice,Pack,BilledUnit',
    'vendor,sku,description,period,unit_price,pack,billed_unit',
  ])('compares same-month invoices using retained headers: %s', (columns) => {
    const result = report([
      columns,
      'PFG,19784,Chopped green bell peppers,2026-10-02,29.98,1/9 BU,CS',
      'PFG,19784,Chopped green bell peppers,2026-10-09,33.35,1/9 BU,CS',
    ].join('\n'));
    expect(result).toMatchObject({ rowsParsed: 2, periodsCount: 2,
      prevPeriod: '2026-10-02', currPeriod: '2026-10-09', totalSkus: 1, flaggedSkus: 1 });
    expect(result.perSku[0]).toMatchObject({ vendor: 'PFG', sku: '19784',
      prevPrice: 29.98, currPrice: 33.35, flagged: true });
    expect(result.perSku[0].driftDollars).toBeCloseTo(3.37, 10);
    expect(result.perSku[0].driftPct).toBeCloseTo(0.1124082721814543, 12);
    expect(result.totalDriftDollars).toBeCloseTo(3.37, 10);
  });

  it('retains full invoice dates across months and ignores input row order', () => {
    const result = report(`${header}\nPFG,A,2026-11-02,54\nPFG,A,2026-10-30,50`);
    expect(result).toMatchObject({ prevPeriod: '2026-10-30', currPeriod: '2026-11-02' });
    expect(result.perSku[0].driftPct).toBe(0.08);
  });

  it.each(['2026-02-29', '2026-02-30', '2026-04-31', '1900-02-29', '2026-13',
    '2026-00', '2026-10-00', '0000-10-02', '10/09/2026', '2026-W41', 'October',
    '2026-10-09T23:00:00-05:00', ''])('holds invalid or ambiguous period %j', (period) => {
    held(`${header}\nPFG,A,2026-10-02,50\nPFG,A,${period},54`, /date|period/i);
  });

  it.each(['2024', '2000'])('accepts a valid leap day in %s', (year) => {
    expect(report(`${header}\nPFG,A,${year}-02-28,50\nPFG,A,${year}-02-29,54`)
      .currPeriod).toBe(`${year}-02-29`);
  });

  it('holds mixed monthly and invoice-date inputs', () => {
    held(`${header}\nPFG,A,2026-09,50\nPFG,A,2026-10-09,54`, /mix/i);
  });

  it('does not invent a clean report when selected latest periods have no matching SKU', () => {
    held(`${header}\nPFG,A,2026-10-02,50\nPFG,A,2026-10-09,54\nPFG,B,2026-10-03,20\nPFG,B,2026-10-10,25`,
      /no comparable/i);
  });

  it('never pairs different vendors or different SKUs', () => {
    held(`${header}\nPFG,A,2026-09,50\nSysco,A,2026-10,54\nPFG,B,2026-10,54`, /no comparable/i);
  });

  it('does not combine vendor and SKU identities containing the old separator', () => {
    held(`${header}\nPFG::A,B,2026-09,50\nPFG,A::B,2026-10,54`, /no comparable/i);
  });

  it('round-trips punctuation and keeps two separate vendor/SKU pairs', () => {
    const result = report(`${header}\nPFG::A,B,2026-09,50\nPFG::A,B,2026-10,55\nPFG,A::B,2026-09,20\nPFG,A::B,2026-10,21`);
    expect(result.totalSkus).toBe(2);
    expect(result.perSku).toMatchObject([
      { vendor: 'PFG::A', sku: 'B', prevPrice: 50, currPrice: 55 },
      { vendor: 'PFG', sku: 'A::B', prevPrice: 20, currPrice: 21 },
    ]);
  });

  it('uses only the latest two periods, even when an earlier price also exists', () => {
    const result = report(`${header}\nPFG,A,2026-08,10\nPFG,A,2026-09,50\nPFG,A,2026-10,54`);
    expect(result).toMatchObject({ prevPeriod: '2026-09', currPeriod: '2026-10', periodsCount: 3 });
    expect(result.perSku[0]).toMatchObject({ prevPrice: 50, currPrice: 54, driftPct: 0.08 });
  });

  it.each([
    ['Pack', '6/5 LB', '4/5 LB', /pack/i],
    ['Pack Size', '6/5 LB', '', /pack/i],
    ['Billed Unit', 'CS', 'EA', /unit/i],
    ['UOM', 'CS', 'LB', /unit/i],
    ['Unit of Measure', '', 'CS', /unit/i],
    ['Location', 'North', 'South', /location|restaurant/i],
    ['Restaurant ID', 'one', '', /location|restaurant/i],
    ['Store ID', 'AbC', 'abc', /location|restaurant/i],
    ['Store', 'one', 'two', /location|restaurant/i],
  ] as const)('holds incompatible supplied %s values', (column, prev, curr, reason) => {
    held(`${header},${column}\nPFG,A,2026-09,50,${prev}\nPFG,A,2026-10,54,${curr}`, reason);
  });

  it('holds a conflicting pack even when another SKU is comparable', () => {
    held(`${header},Pack\nPFG,A,2026-09,50,6/5 LB\nPFG,A,2026-10,54,4/5 LB\nPFG,B,2026-09,20,1/1 LB\nPFG,B,2026-10,22,1/1 LB`, /pack/i);
  });

  it.each([
    ['Pack', '6/5 LB', '4/5 LB', /pack/i],
    ['Billed Unit', 'CS', 'LB', /unit/i],
  ] as const)('holds conflicting %s rows within a single period', (column, first, second, reason) => {
    held(`${header},${column}\nPFG,A,2026-09,50,${first}\nPFG,A,2026-09,40,${second}\nPFG,A,2026-10,54,${first}`, reason);
  });

  it.each([
    ['Pack,Pack Size', '6/5 LB,4/5 LB', /pack/i],
    ['Billed Unit,UOM', 'CS,EA', /unit/i],
  ] as const)('holds conflicting aliases within a row: %s', (columns, values, reason) => {
    held(`${header},${columns}\nPFG,A,2026-09,50,${values}\nPFG,A,2026-10,54,${values}`, reason);
  });

  it('accepts matching supplied dimensions without confusing location name and ID', () => {
    const result = report(`${header},Pack,Billed Unit,Location,Location ID\nPFG,A,2026-09,50,6/5 LB,CS,North,123\nPFG,A,2026-10,54,6/5 lb,cs,north,123`);
    expect(result.flaggedSkus).toBe(1);
  });

  it('does not confuse Unit Price with a billed unit or require absent optional columns', () => {
    expect(report('Vendor,SKU,Period,Unit Price\nPFG,A,2026-09,50\nPFG,A,2026-10,54')
      .flaggedSkus).toBe(1);
    expect(report(`${header},Pack,UOM,Location\nPFG,A,2026-09,50,,,\nPFG,A,2026-10,54,,,`)
      .flaggedSkus).toBe(1);
  });

  it.each(['0', '-50', 'credit', 'not a price', ''])('does not turn invalid prior price %j into a saving', (price) => {
    held(`${header}\nPFG,A,2026-09,${price}\nPFG,A,2026-10,54`, /period/i);
  });

  it('retains unweighted means and repeated rows without inventing invoice deduplication or quantity weighting', () => {
    const result = report(`${header},Quantity\nPFG,A,2026-09,10,1\nPFG,A,2026-09,10,1\nPFG,A,2026-09,40,100\nPFG,A,2026-10,30,2`);
    expect(result.perSku[0]).toMatchObject({ prevPrice: 20, currPrice: 30, driftPct: 0.5, driftDollars: 10 });
    expect(result.totalDriftDollars).toBe(10);
  });

  it('keeps the strict five-percent threshold and signed price declines', () => {
    const result = report(`${header}\nPFG,A,2026-09,100\nPFG,A,2026-10,105\nPFG,B,2026-09,100\nPFG,B,2026-10,105.01\nPFG,C,2026-09,100\nPFG,C,2026-10,90`);
    expect(result.flaggedSkus).toBe(1);
    expect(result.perSku.find((row) => row.sku === 'A')).toMatchObject({ driftPct: 0.05, flagged: false });
    expect(result.perSku.find((row) => row.sku === 'B')).toMatchObject({ flagged: true });
    expect(result.perSku.find((row) => row.sku === 'C')).toMatchObject({ driftPct: -0.1, driftDollars: -10, flagged: false });
    expect(result.totalDriftDollars).toBeCloseTo(10.01, 10);
  });
});
