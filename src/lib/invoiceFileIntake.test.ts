import { describe, expect, it } from 'vitest';
import { GOLD_CURRENT_INVOICE_CSV } from './oneSeatPublicWin';
import { isHeicUpload, readPublicInvoiceUpload } from './invoiceFileIntake';

describe('public invoice file intake', () => {
  it('reads native PDF text and does not invent a blank price', () => {
    const body = [
      'US Foods',
      'Invoice Date: 05/12/2026',
      'Item US401 Fries Straight Cut Qty 1 Pack CS Unit Price 37.07',
    ];
    const pdf = new Uint8Array(Buffer.from(`%PDF-1.1\n${body.map((line) => `(${line})`).join('\n')}\n`));
    const read = readPublicInvoiceUpload(pdf, 'synthetic-usfoods.pdf', 'application/pdf');
    expect(read.honesty).toBe('Estimated');
    expect(read.text).toMatch(/37\.07/);
    expect(read.text).not.toMatch(/,\s*0\.00/);
  });

  it('keeps an empty PDF and a HEIC photo Missing', () => {
    const empty = readPublicInvoiceUpload(new Uint8Array(Buffer.from('%PDF-1.1\n')), 'scan.pdf', 'application/pdf');
    expect(empty.honesty).toBe('Missing');
    expect(empty.text).toBe('');
    expect(empty.note).toMatch(/Missing/);
    expect(empty.note).not.toMatch(/\$\d/);

    const heic = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    expect(isHeicUpload(heic, 'photo.heic', 'image/heic')).toBe(true);
    const photo = readPublicInvoiceUpload(heic, 'photo.heic', 'image/heic');
    expect(photo.honesty).toBe('Missing');
    expect(photo.text).toBe('');
    expect(photo.note).toMatch(/HEIC/);
    expect(photo.note).not.toMatch(/\$\d/);
  });

  it('parses CSV text and leaves a blank unit price empty', () => {
    const csv = `${GOLD_CURRENT_INVOICE_CSV}Sample Dairy,BLANK-1,No price line,2026-09-08,,1\n`;
    const read = readPublicInvoiceUpload(new TextEncoder().encode(csv), 'current.csv', 'text/csv');
    expect(read.honesty).toBe('Estimated');
    expect(read.text).toMatch(/MZ-452/);
    expect(read.text).not.toMatch(/BLANK-1,.*,0(?:\.00)?/);
  });
});
