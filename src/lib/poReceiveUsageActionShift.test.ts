import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ingestCloseDocuments } from './deskClose';
import {
  looksLikePurchaseOrder,
  looksLikeTheoreticalUsage,
  parsePurchaseOrder,
  parseTheoreticalUsage,
} from './poReceiveParse';
import {
  buildPoReceiveUsageActionShift,
  comparePoInvoiceUsage,
  feedPoReceiveUsageIntoActionShift,
} from './poReceiveUsageActionShift';
import { parseVendorInvoice, looksLikeVendorInvoice } from './vendorInvoiceParse';
import { buildActionShift } from './actionShift';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/po-usage');
const load = (name: string) => readFileSync(join(fixtureDir, name), 'utf8');

describe('PO / usage classification', () => {
  it('does not treat a purchase order as a vendor invoice', () => {
    const po = load('syn-po.csv');
    expect(looksLikePurchaseOrder(po, 'syn-po.csv')).toBe(true);
    expect(looksLikeTheoreticalUsage(po, 'syn-po.csv')).toBe(false);
  });

  it('classifies theoretical usage before invoice', () => {
    const usage = load('syn-usage.csv');
    expect(looksLikeTheoreticalUsage(usage, 'syn-usage.csv')).toBe(true);
    expect(looksLikePurchaseOrder(usage, 'syn-usage.csv')).toBe(false);
  });

  it('still recognizes the synthetic invoice as an invoice', () => {
    const invoice = load('syn-invoice.csv');
    expect(looksLikePurchaseOrder(invoice, 'syn-invoice.csv')).toBe(false);
    expect(looksLikeTheoreticalUsage(invoice, 'syn-invoice.csv')).toBe(false);
    expect(looksLikeVendorInvoice(invoice, 'syn-invoice.csv')).toBe(true);
  });
});

describe('PO vs invoice vs theoretical usage', () => {
  const compare = comparePoInvoiceUsage({
    purchaseOrders: [parsePurchaseOrder(load('syn-po.csv'), 'syn-po.csv')],
    invoices: [parseVendorInvoice(load('syn-invoice.csv'), 'syn-invoice.csv')],
    usage: [parseTheoreticalUsage(load('syn-usage.csv'), 'syn-usage.csv')],
  });

  it('computes a three-leg gap when PO, invoice, and theoretical usage exist', () => {
    const oil = compare.rows.find((row) => row.sku === 'SYN-OIL-01');
    expect(oil).toEqual(expect.objectContaining({
      legsPresent: 3,
      orderedQty: 4,
      invoicedQty: 3,
      theoreticalQty: 2.5,
      evidenceState: 'unverified',
      flagged: true,
      dollarsObserved: 68.4,
    }));
    expect(oil!.receiveQtyGap).toBeCloseTo(-1, 5);
    expect(oil!.usageQtyGap).toBeCloseTo(0.5, 5);

    const pasta = compare.rows.find((row) => row.sku === 'SYN-PASTA-02');
    expect(pasta).toEqual(expect.objectContaining({
      legsPresent: 3,
      flagged: false,
      orderedQty: 10,
      invoicedQty: 10,
      theoreticalQty: 10,
    }));
  });

  it('marks two legs Partial and keeps the two-leg dollars', () => {
    const tomato = compare.rows.find((row) => row.sku === 'SYN-TOMATO-03');
    expect(tomato).toEqual(expect.objectContaining({
      legsPresent: 2,
      evidenceState: 'partial',
      flagged: true,
      orderedQty: 6,
      invoicedQty: 8,
      theoreticalQty: null,
      dollarsObserved: 200,
    }));
    expect(tomato?.missingEvidence).toMatch(/Partial/);
  });

  it('marks one leg Missing Evidence with dollarsObserved null', () => {
    const honey = compare.rows.find((row) => row.sku === 'SYN-HONEY-04');
    expect(honey).toEqual(expect.objectContaining({
      legsPresent: 1,
      evidenceState: 'missing-evidence',
      flagged: false,
      dollarsObserved: null,
      invoicedQty: null,
      theoreticalQty: null,
    }));
    expect(honey?.missingEvidence).toMatch(/Missing Evidence/);
  });
});

describe('PO / receive / usage Action Shift', () => {
  it('emits ≤3 moves with owner, claim boundary, and proof object', () => {
    const built = buildPoReceiveUsageActionShift({
      store: 'Sample Kitchen Lab',
      purchaseOrders: [{ text: load('syn-po.csv'), filename: 'syn-po.csv' }],
      invoices: [{ text: load('syn-invoice.csv'), filename: 'syn-invoice.csv' }],
      usage: [{ text: load('syn-usage.csv'), filename: 'syn-usage.csv' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.result.morningActions.length).toBeGreaterThan(0);
    expect(built.result.morningActions.length).toBeLessThanOrEqual(3);
    expect(built.result.morningActions.every((action) => action.id === 'po-receive-usage')).toBe(true);
    expect(built.result.morningActions.every((action) => action.owner)).toBe(true);
    expect(built.result.morningActions.every((action) => /not COGS|not actual food cost|not theft/i.test(action.claimBoundary))).toBe(true);
    expect(built.result.morningActions.every((action) => action.proof.verbalYesCloses === false)).toBe(true);
    expect(built.result.morningActions.every((action) => action.proof.object)).toBe(true);
    expect(built.result.policy.maxMorningActions).toBe(3);
    expect(built.result.morningActions.some((action) => action.dollarsObserved != null)).toBe(true);
  });

  it('uses native-text PO and usage the same way as CSV', () => {
    const built = buildPoReceiveUsageActionShift({
      purchaseOrders: [{ text: load('syn-po-native.txt'), filename: 'syn-po-native.txt' }],
      invoices: [{ text: load('syn-invoice.csv'), filename: 'syn-invoice.csv' }],
      usage: [{ text: load('syn-usage-native.txt'), filename: 'syn-usage-native.txt' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const oil = built.compare.rows.find((row) => row.sku === 'SYN-OIL-01');
    expect(oil).toEqual(expect.objectContaining({
      legsPresent: 3,
      flagged: true,
      dollarsObserved: 68.4,
    }));
  });

  it('does not invent dollars when only one leg exists', () => {
    const built = buildPoReceiveUsageActionShift({
      purchaseOrders: [{ text: load('syn-po.csv'), filename: 'syn-po.csv' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.compare.flagged).toHaveLength(0);
    expect(built.result.morningActions).toHaveLength(1);
    expect(built.result.morningActions[0]).toEqual(expect.objectContaining({
      id: 'po-receive-usage',
      dollarsObserved: null,
    }));
    expect(built.result.morningActions[0].evidence).toMatch(/Missing Evidence/);
    expect(built.compare.rows.every((row) => row.dollarsObserved == null && row.evidenceState === 'missing-evidence')).toBe(true);
  });

  it('treats POS sold without recipe/yield as Missing Evidence, not theoretical usage', () => {
    const parsed = parseTheoreticalUsage(load('syn-usage-sold-only.csv'), 'syn-usage-sold-only.csv');
    expect(parsed.lines[0]).toEqual(expect.objectContaining({
      theoreticalQty: null,
      status: 'unreadable',
      evidenceState: 'missing-evidence',
    }));
    expect(parsed.lines[0].missingEvidence).toMatch(/POS sold quantity is not theoretical usage/);

    const built = buildPoReceiveUsageActionShift({
      usage: [{ text: load('syn-usage-sold-only.csv'), filename: 'syn-usage-sold-only.csv' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.result.morningActions[0].dollarsObserved).toBeNull();
    expect(built.result.missingEvidence.join(' ')).toMatch(/not theoretical usage|Missing Evidence/);
  });
});

describe('PO / receive / usage feeds Action Shift desk', () => {
  it('turns synthetic PO + invoice + usage into a desk Action Shift without a Z', () => {
    const result = ingestCloseDocuments([
      { channel: 'file', filename: 'syn-po.csv', text: load('syn-po.csv') },
      { channel: 'file', filename: 'syn-invoice.csv', text: load('syn-invoice.csv') },
      { channel: 'file', filename: 'syn-usage.csv', text: load('syn-usage.csv') },
    ], 'Sample Kitchen Lab');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.desk.families).toEqual(expect.arrayContaining([
      'purchase-order',
      'vendor-invoice',
      'theoretical-usage',
    ]));
    expect(result.desk.sales.display).toBe('Missing Evidence');
    expect(result.desk.actionShift?.morningActions.length).toBeLessThanOrEqual(3);
    expect(result.desk.actionShift?.morningActions.some((action) => action.id === 'po-receive-usage')).toBe(true);
    expect(result.desk.actionShift?.morningActions.filter((action) => action.id === 'po-receive-usage').every((action) => action.proof.object)).toBe(true);
    expect(result.desk.actionShift?.morningActions.filter((action) => action.id === 'po-receive-usage').some((action) => action.dollarsObserved != null)).toBe(true);
  });

  it('keeps two-leg Partial dollars and one-leg null on the desk packet', () => {
    const twoLeg = ingestCloseDocuments([
      { channel: 'file', filename: 'syn-po.csv', text: load('syn-po.csv') },
      { channel: 'file', filename: 'syn-invoice.csv', text: load('syn-invoice.csv') },
    ], 'Sample Kitchen Lab');
    expect(twoLeg.ok).toBe(true);
    if (!twoLeg.ok) return;
    expect(twoLeg.desk.actionShift?.morningActions.length).toBeLessThanOrEqual(3);
    expect(twoLeg.desk.actionShift?.morningActions.some((action) => /Partial/i.test(action.evidence))).toBe(true);
    expect(twoLeg.desk.actionShift?.morningActions.some((action) => action.dollarsObserved != null)).toBe(true);

    const oneLeg = ingestCloseDocuments([
      { channel: 'file', filename: 'syn-po.csv', text: load('syn-po.csv') },
    ]);
    expect(oneLeg.ok).toBe(true);
    if (!oneLeg.ok) return;
    expect(oneLeg.desk.actionShift?.morningActions[0].dollarsObserved).toBeNull();
    expect(oneLeg.desk.families).toContain('purchase-order');
  });

  it('ranks a PO/usage gap into yesterday\'s close moves', () => {
    const pos = buildActionShift({ grossSales: 1000, voids: 12 });
    const po = buildPoReceiveUsageActionShift({
      purchaseOrders: [{ text: load('syn-po.csv'), filename: 'syn-po.csv' }],
      invoices: [{ text: load('syn-invoice.csv'), filename: 'syn-invoice.csv' }],
      usage: [{ text: load('syn-usage.csv'), filename: 'syn-usage.csv' }],
    });
    expect(pos.ok && po.ok).toBe(true);
    if (!pos.ok || !po.ok) return;
    const merged = feedPoReceiveUsageIntoActionShift(pos.result, po.result);
    expect(merged?.morningActions.length).toBeLessThanOrEqual(3);
    expect(merged?.morningActions.some((action) => action.id === 'po-receive-usage')).toBe(true);
  });
});
