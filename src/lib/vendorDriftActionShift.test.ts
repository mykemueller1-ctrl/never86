import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ingestCloseDocuments } from './deskClose';
import {
  buildVendorDriftActionShift,
  compareVendorInvoiceDocuments,
  feedVendorDriftIntoActionShift,
  VENDOR_DRIFT_THRESHOLD,
} from './vendorDriftActionShift';
import { parseVendorInvoice } from './vendorInvoiceParse';
import { buildActionShift } from './actionShift';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/vendor-invoices');
const load = (name: string) => readFileSync(join(fixtureDir, name), 'utf8');

describe('vendor drift comparison', () => {
  const compare = compareVendorInvoiceDocuments([
    parseVendorInvoice(load('prior-pfg.csv'), 'prior-pfg.csv'),
    parseVendorInvoice(load('current-pfg.csv'), 'current-pfg.csv'),
  ]);

  it('flags only SKUs with >5% upward drift when both periods exist', () => {
    expect(VENDOR_DRIFT_THRESHOLD).toBe(0.05);
    const oil = compare.rows.find((row) => row.sku === '401122');
    const pasta = compare.rows.find((row) => row.sku === '188210');
    const honey = compare.rows.find((row) => row.sku === 'R4910');
    const tomato = compare.rows.find((row) => row.sku === 'T610');
    const fries = compare.rows.find((row) => row.sku === 'FRN38');

    expect(oil).toEqual(expect.objectContaining({
      flagged: true,
      dollarsObserved: expect.closeTo(10.8, 5),
      evidenceState: 'unverified',
    }));
    expect(oil!.driftPct).toBeCloseTo((79.2 - 68.4) / 68.4, 5);
    expect(pasta?.flagged).toBe(true);
    expect(honey?.flagged).toBe(false);
    expect(tomato).toEqual(expect.objectContaining({
      flagged: false,
      driftPct: 0.05,
      dollarsObserved: 5,
    }));
    expect(fries?.flagged).toBe(false);
    expect(compare.flagged.map((row) => row.sku).sort()).toEqual(['188210', '401122']);
  });

  it('treats a missing prior period as Missing Evidence, not $0', () => {
    const fresh = compare.rows.find((row) => row.sku === 'NEW99');
    expect(fresh).toEqual(expect.objectContaining({
      flagged: false,
      dollarsObserved: null,
      priorPrice: null,
      evidenceState: 'missing-evidence',
    }));
    expect(fresh?.missingEvidence).toMatch(/Missing Evidence, not \$0/);
    expect(compare.missingEvidence.join(' ')).toMatch(/Missing Evidence, not \$0/);
  });
});

describe('vendor drift Action Shift', () => {
  it('emits ≤3 moves with owner, per-unit dollars, claim boundary, and proof', () => {
    const built = buildVendorDriftActionShift({
      store: 'Sample Kitchen Lab',
      documents: [
        { text: load('prior-pfg.csv'), filename: 'prior-pfg.csv' },
        { text: load('current-pfg.csv'), filename: 'current-pfg.csv' },
      ],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.result.morningActions.length).toBeGreaterThan(0);
    expect(built.result.morningActions.length).toBeLessThanOrEqual(3);
    expect(built.result.morningActions.every((action) => action.id === 'vendor-drift')).toBe(true);
    expect(built.result.morningActions.every((action) => action.owner)).toBe(true);
    expect(built.result.morningActions.every((action) => action.claimBoundary)).toBe(true);
    expect(built.result.morningActions.every((action) => action.proof.verbalYesCloses === false)).toBe(true);
    expect(built.result.morningActions.every((action) => action.dollarsObserved != null && action.dollarsObserved > 0)).toBe(true);
    expect(built.result.morningActions.every((action) => /not extended impact, savings, or recoverable cash/i.test(action.claimBoundary))).toBe(true);
    expect(built.result.policy.maxMorningActions).toBe(3);
  });

  it('uses native-text invoices the same way as CSV', () => {
    const built = buildVendorDriftActionShift({
      documents: [
        { text: load('prior-pfg-native.txt'), filename: 'SYN-PFG-1001.txt' },
        { text: load('current-pfg-native.txt'), filename: 'SYN-PFG-1002.txt' },
      ],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.compare.flagged.some((row) => row.sku === '401122')).toBe(true);
    expect(built.result.morningActions[0].dollarsObserved).not.toBeNull();
    expect(built.compare.rows.find((row) => row.sku === 'BROKEN')).toEqual(expect.objectContaining({
      dollarsObserved: null,
      evidenceState: 'missing-evidence',
    }));
  });

  it('does not invent dollars when only one period exists', () => {
    const built = buildVendorDriftActionShift({
      documents: [{ text: load('single-period.csv'), filename: 'single-period.csv' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.compare.flagged).toHaveLength(0);
    expect(built.result.morningActions).toHaveLength(1);
    expect(built.result.morningActions[0]).toEqual(expect.objectContaining({
      id: 'vendor-drift',
      dollarsObserved: null,
    }));
    expect(built.result.morningActions[0].evidence).toMatch(/Missing Evidence/);
    expect(built.result.missingEvidence.join(' ')).toMatch(/not \$0/);
  });
});

describe('vendor drift feeds Action Shift desk', () => {
  it('turns two synthetic invoices into a desk Action Shift without a Z report', () => {
    const result = ingestCloseDocuments([
      { channel: 'file', filename: 'prior-pfg.csv', text: load('prior-pfg.csv') },
      { channel: 'file', filename: 'current-pfg.csv', text: load('current-pfg.csv') },
    ], 'Sample Kitchen Lab');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.desk.families).toContain('vendor-invoice');
    expect(result.desk.sales.display).toBe('Missing Evidence');
    expect(result.desk.actionShift?.morningActions.length).toBeLessThanOrEqual(3);
    expect(result.desk.actionShift?.morningActions[0].id).toBe('vendor-drift');
    expect(result.desk.actionShift?.morningActions[0].dollarsObserved).toBeGreaterThan(0);
  });

  it('ranks a two-period vendor flag into yesterday\'s close moves', () => {
    const pos = buildActionShift({ grossSales: 1000, voids: 12 });
    const vendor = buildVendorDriftActionShift({
      documents: [
        { text: load('prior-pfg.csv'), filename: 'prior-pfg.csv' },
        { text: load('current-pfg.csv'), filename: 'current-pfg.csv' },
      ],
    });
    expect(pos.ok && vendor.ok).toBe(true);
    if (!pos.ok || !vendor.ok) return;
    const merged = feedVendorDriftIntoActionShift(pos.result, vendor.result);
    expect(merged?.morningActions.length).toBeLessThanOrEqual(3);
    expect(merged?.morningActions.some((action) => action.id === 'vendor-drift')).toBe(true);
  });
});
