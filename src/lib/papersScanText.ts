/**
 * Turn downloaded bytes into text. Binary and scans stay empty so extractors
 * cannot treat compressed bytes as dollar amounts.
 */

import { decodeInvoiceSource } from '@/lib/vendorInvoiceParse';

const BINARY_EXT = /\.(xlsx|xls|png|jpe?g|gif|webp|heic|zip)$/i;

export function paperTextFromBytes(filename: string, bytes: Uint8Array): string {
  if (!bytes.byteLength) return '';
  if (BINARY_EXT.test(filename)) return '';
  const pdf = filename.toLowerCase().endsWith('.pdf')
    || (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46);
  if (pdf) return decodeInvoiceSource(bytes, filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`);
  const text = Buffer.from(bytes).toString('utf8');
  if (text.includes('\u0000')) return '';
  return text.slice(0, 200_000);
}
