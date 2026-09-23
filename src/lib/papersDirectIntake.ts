/**
 * Photo, PDF upload, and chat intake. These paths do not open Gmail.
 * A typed dollar amount is not a SKU price. Native text from a file can be Estimated.
 */

import { invoiceUploadTooLarge, isHeicUpload, MAX_INVOICE_UPLOAD_BYTES, readPublicInvoiceUpload } from '@/lib/invoiceFileIntake';
import { classifyPapersFolder, type PapersHonesty } from '@/lib/papersInbox';
import { chatIntakeMap, chatReplyForLine, readChatIntakeLine } from '@/lib/papersChatIntake';
import { matchStagedVendorPaper } from '@/lib/stagedVendorFixtures';
import { decodeInvoiceSource } from '@/lib/vendorInvoiceParse';

export const PAPERS_DIRECT_KINDS = ['upload', 'photo', 'chat'] as const;
export type PapersDirectKind = (typeof PAPERS_DIRECT_KINDS)[number];

export type PapersDirectDraft = {
  kind: PapersDirectKind;
  filename: string;
  folder: string;
  honesty: PapersHonesty;
  note: string;
  text: string;
};

export function redactTypedDollars(text: string): string {
  return text.replace(/\$\s*\d[\d,]*(?:\.\d+)?/g, '[amount omitted]');
}

function safeName(filename: string, fallback: string): string {
  return filename.trim().split(/[/\\]/).pop() || fallback;
}

function stagedDraft(kind: 'upload' | 'photo', bytes: Uint8Array, filename: string): PapersDirectDraft | null {
  const name = safeName(filename, kind);
  const raw = decodeInvoiceSource(bytes, name);
  const staged = matchStagedVendorPaper(`${raw}\n${name}`, name);
  if (!staged) return null;
  return {
    kind,
    filename: name,
    folder: staged.folder,
    honesty: 'Estimated',
    note: staged.note,
    text: staged.line,
  };
}

export function paperFromUpload(bytes: Uint8Array, filename = 'invoice', contentType = ''): PapersDirectDraft {
  const staged = stagedDraft('upload', bytes, filename);
  if (staged) return staged;
  const read = readPublicInvoiceUpload(bytes, filename, contentType);
  const folder = classifyPapersFolder(read.filename);
  return {
    kind: 'upload',
    filename: read.filename,
    folder,
    honesty: read.honesty,
    note: read.note,
    text: read.honesty === 'Estimated' ? read.text : '',
  };
}

export function paperFromPhoto(bytes: Uint8Array, filename = 'photo', contentType = ''): PapersDirectDraft {
  const name = safeName(filename, 'photo');
  const lower = `${name} ${contentType}`.toLowerCase();
  const image = isHeicUpload(bytes, name, contentType)
    || /\.(jpe?g|png|gif|webp|heic|heif)$/.test(name.toLowerCase())
    || lower.includes('image/');
  if (image || bytes.byteLength === 0) {
    return {
      kind: 'photo',
      filename: name,
      folder: classifyPapersFolder(name),
      honesty: 'Missing',
      note: bytes.byteLength === 0
        ? 'Empty photo. The paper is Missing — not $0. No invented $.'
        : 'Photo landed. Native invoice text is Missing — no OCR on this seat. No invented $.',
      text: '',
    };
  }
  const staged = stagedDraft('photo', bytes, name);
  if (staged) return staged;
  const read = readPublicInvoiceUpload(bytes, name, contentType);
  return {
    kind: 'photo',
    filename: read.filename,
    folder: classifyPapersFolder(read.filename),
    honesty: read.honesty,
    note: read.note,
    text: read.honesty === 'Estimated' ? read.text : '',
  };
}

export function paperFromChat(text: string): PapersDirectDraft {
  const trimmed = text.trim().slice(0, 240);
  const read = readChatIntakeLine(trimmed);
  const map = chatIntakeMap({ googleReady: false, marks: read.slot && read.slot !== 'google' ? { [read.slot]: 'named' } : {} });
  const reply = chatReplyForLine(trimmed, map);
  const folder = read.slot === 'labor'
    ? 'labor'
    : read.slot === 'z-eod'
      ? 'z-eod'
      : read.slot === 'invoices'
        ? 'invoices'
        : read.slot === 'photo'
          ? 'photo'
          : 'chat';
  return {
    kind: 'chat',
    filename: read.slot && read.slot !== 'google' ? read.slot : 'chat',
    folder,
    honesty: 'Missing',
    note: reply,
    text: '',
  };
}

export function intakeFileTooLarge(size: number): boolean {
  return invoiceUploadTooLarge(size);
}

export { MAX_INVOICE_UPLOAD_BYTES };
