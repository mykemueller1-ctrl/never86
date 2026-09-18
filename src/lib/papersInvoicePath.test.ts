import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GOLD_CURRENT_INVOICE_CSV, GOLD_PRIOR_INVOICE_CSV } from './oneSeatPublicWin';
import {
  invoiceDocumentToCompareText,
  papersInvoiceCompare,
  parseSeatInvoiceBytes,
  pickTwoInvoicesForCompare,
  skuLinesFromDocument,
} from './papersInvoicePath';
import { parseVendorInvoice } from './vendorInvoiceParse';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/vendor-invoices');

describe('papers invoice / SKU path', () => {
  it('parses vendor, SKU, desc, pack, unit $, qty without inventing a missing price', () => {
    const bytes = readFileSync(join(fixtureDir, 'current-pfg.csv'));
    const parsed = parseSeatInvoiceBytes(new Uint8Array(bytes), 'current-pfg.csv');
    expect(parsed.honesty).toBe('Estimated');
    const oil = parsed.lines.find((line) => line.sku === '401122');
    expect(oil).toEqual(expect.objectContaining({
      vendor: 'PFG',
      sku: '401122',
      description: 'Olive Oil Pure 4/1 GAL',
      unitPrice: 79.2,
      quantity: 2,
      honesty: 'Estimated',
    }));
    expect(oil?.pack).toMatch(/4\/1|GAL/i);
    const blank = parsed.lines.find((line) => line.sku === 'US-BLANK');
    expect(blank?.unitPrice).toBeNull();
    expect(blank?.honesty).toBe('Missing');
    expect(blank?.unitPrice).not.toBe(0);
  });

  it('keeps a scanned empty PDF Missing and does not invent SKU dollars', () => {
    const emptyPdf = new TextEncoder().encode('%PDF-1.1\n');
    const parsed = parseSeatInvoiceBytes(emptyPdf, 'scan-invoice.pdf');
    expect(parsed.honesty).toBe('Missing');
    expect(parsed.note).toMatch(/Missing/);
    expect(parsed.lines.every((line) => line.unitPrice == null)).toBe(true);
  });

  it('feeds two invoices into the /try compare formulas', () => {
    const prior = parseSeatInvoiceBytes(new TextEncoder().encode(GOLD_PRIOR_INVOICE_CSV), 'prior.csv');
    const current = parseSeatInvoiceBytes(new TextEncoder().encode(GOLD_CURRENT_INVOICE_CSV), 'current.csv');
    const picked = pickTwoInvoicesForCompare([prior, current]);
    expect(picked.honesty).toBe('Estimated');
    expect(picked.prior?.filename).toBe('prior.csv');
    const compared = papersInvoiceCompare([prior, current]);
    expect(compared.documents).toHaveLength(2);
    const mozzarella = compared.compare?.rows.find((row) => row.sku === 'MZ-452');
    expect(mozzarella).toEqual(expect.objectContaining({
      priorPrice: 48,
      currentPrice: 56,
      honesty: 'Verified',
    }));
    const one = papersInvoiceCompare([current]);
    expect(one.honesty).toBe('Missing');
    expect(one.missing).toMatch(/two invoices/i);
    const csv = invoiceDocumentToCompareText(parseVendorInvoice(GOLD_CURRENT_INVOICE_CSV, 'current.csv'));
    expect(csv).toMatch(/Vendor,SKU,Description,Pack,Period,Unit Price,Qty/);
    expect(skuLinesFromDocument(current.document)[0].sku).toBe('MZ-452');
  });
});
