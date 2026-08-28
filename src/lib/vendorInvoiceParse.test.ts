import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  decodeInvoiceSource,
  detectVendorLabel,
  looksLikeVendorInvoice,
  parseVendorInvoice,
} from './vendorInvoiceParse';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/vendor-invoices');
const load = (name: string) => readFileSync(join(fixtureDir, name), 'utf8');

describe('vendor invoice parse', () => {
  it('reads CSV vendor, SKU, unit price, and period', () => {
    const parsed = parseVendorInvoice(load('current-pfg.csv'), 'current-pfg.csv');
    expect(detectVendorLabel(load('current-pfg.csv'), 'current-pfg.csv')).toBe('PFG');
    const oil = parsed.lines.find((line) => line.sku === '401122');
    expect(oil).toEqual(expect.objectContaining({
      vendor: 'PFG',
      sku: '401122',
      unitPrice: 79.2,
      period: '2026-05-12',
      status: 'readable',
      evidenceState: 'unverified',
    }));
  });

  it('reads native-text PFG invoices without OCR', () => {
    const parsed = parseVendorInvoice(load('current-pfg-native.txt'), 'SYN-PFG-1002.txt');
    expect(parsed.vendor).toBe('PFG');
    expect(parsed.invoiceDate).toBe('2026-05-12');
    expect(parsed.lines.find((line) => line.sku === '188210')).toEqual(expect.objectContaining({
      unitPrice: 21.45,
      status: 'readable',
    }));
  });

  it('marks an unreadable line as Missing Evidence, not $0', () => {
    const parsed = parseVendorInvoice(load('current-pfg-native.txt'), 'SYN-PFG-1002.txt');
    const broken = parsed.lines.find((line) => line.sku === 'BROKEN' || /BROKEN/i.test(line.raw));
    expect(broken).toEqual(expect.objectContaining({
      unitPrice: null,
      status: 'unreadable',
      evidenceState: 'missing-evidence',
    }));
    expect(broken?.unitPrice).not.toBe(0);
  });

  it('extracts native PDF text objects for invoice lines', () => {
    const body = [
      'US Foods',
      'Invoice Date: 05/12/2026',
      'Item US401 Fries Straight Cut Qty 1 Pack CS Unit Price 37.07',
    ];
    const pdf = Buffer.from(`%PDF-1.1\n${body.map((line) => `(${line})`).join('\n')}\n`);
    const text = decodeInvoiceSource(pdf, 'synthetic-usfoods.pdf');
    expect(looksLikeVendorInvoice(text, 'synthetic-usfoods.pdf')).toBe(true);
    const parsed = parseVendorInvoice(text, 'synthetic-usfoods.pdf');
    expect(parsed.vendor).toBe('US Foods');
    expect(parsed.lines[0]).toEqual(expect.objectContaining({
      sku: 'US401',
      unitPrice: 37.07,
      period: '2026-05-12',
      status: 'readable',
    }));
  });
});
