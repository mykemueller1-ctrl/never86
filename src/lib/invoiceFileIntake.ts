/**
 * Public invoice file intake for /check/invoices.
 * Native-text PDF, CSV, and TXT use the existing parser.
 * HEIC and empty scans stay Missing. No OCR. No invented $.
 */

import { parseSeatInvoiceBytes } from './papersInvoicePath';
import type { HonestyLabel } from './oneSeatPublicWin';

export const MAX_INVOICE_UPLOAD_BYTES = 8 * 1024 * 1024;

export const INVOICE_UPLOAD_ACCEPT =
  '.pdf,.csv,.txt,.heic,.heif,application/pdf,text/csv,text/plain,image/heic,image/heif';

const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'heif', 'mif1', 'msf1']);

export type InvoiceUploadRead = {
  success: true;
  honesty: Extract<HonestyLabel, 'Estimated' | 'Missing'>;
  filename: string;
  text: string;
  note: string;
};

export function isHeicUpload(bytes: Uint8Array, filename = '', contentType = ''): boolean {
  const name = filename.toLowerCase();
  const type = contentType.toLowerCase();
  if (name.endsWith('.heic') || name.endsWith('.heif')) return true;
  if (type.includes('heic') || type.includes('heif')) return true;
  if (bytes.length < 12) return false;
  const box = Buffer.from(bytes.subarray(4, 8)).toString('ascii');
  if (box !== 'ftyp') return false;
  const brand = Buffer.from(bytes.subarray(8, 12)).toString('ascii').toLowerCase();
  return HEIF_BRANDS.has(brand);
}

export function invoiceUploadTooLarge(size: number): boolean {
  return size > MAX_INVOICE_UPLOAD_BYTES;
}

function allowedText(filename: string, contentType: string, bytes: Uint8Array): boolean {
  const name = filename.toLowerCase();
  const type = contentType.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) return true;
  if (type.includes('csv') || type.startsWith('text/plain')) return true;
  if (name.endsWith('.pdf') || type.includes('pdf')) return true;
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

export function readPublicInvoiceUpload(
  bytes: Uint8Array,
  filename = 'invoice',
  contentType = '',
): InvoiceUploadRead {
  const safeName = filename.trim().split(/[/\\]/).pop() || 'invoice';
  if (bytes.byteLength === 0) {
    return {
      success: true,
      honesty: 'Missing',
      filename: safeName,
      text: '',
      note: 'Empty file. Invoice text is Missing — not $0.',
    };
  }
  if (isHeicUpload(bytes, safeName, contentType)) {
    return {
      success: true,
      honesty: 'Missing',
      filename: safeName,
      text: '',
      note: 'HEIC photo landed. Native invoice text is Missing — no OCR on this seat. Paste the lines or drop a PDF or CSV. No invented $.',
    };
  }
  if (!allowedText(safeName, contentType, bytes)) {
    return {
      success: true,
      honesty: 'Missing',
      filename: safeName,
      text: '',
      note: 'This file has no native invoice text on this seat. Drop a PDF, CSV, or TXT. HEIC stays Missing. No invented $.',
    };
  }
  const parsed = parseSeatInvoiceBytes(bytes, safeName);
  if (parsed.honesty === 'Missing' || !parsed.text.trim()) {
    return {
      success: true,
      honesty: 'Missing',
      filename: safeName,
      text: '',
      note: parsed.note,
    };
  }
  return {
    success: true,
    honesty: 'Estimated',
    filename: safeName,
    text: parsed.text,
    note: parsed.note,
  };
}
