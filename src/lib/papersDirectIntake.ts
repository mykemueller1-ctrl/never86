/**
 * Photo, PDF upload, and chat intake. These paths do not open Gmail.
 * A typed dollar amount is not a SKU price. Native text from a file can be Estimated.
 */

import { invoiceUploadTooLarge, isHeicUpload, MAX_INVOICE_UPLOAD_BYTES } from '@/lib/invoiceFileIntake';
import { classifyPapersFolder, type PapersHonesty } from '@/lib/papersInbox';
import { chatIntakeMap, chatReplyForLine, readChatIntakeLine } from '@/lib/papersChatIntake';
import { literalTypedDollars, peelLiteralTotals } from '@/lib/papersIntakeHelpers';
import { matchStagedVendorPaper } from '@/lib/stagedVendorFixtures';
import { extractPaperFacts } from '@/lib/ownerPaperFacts';
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

function draftFromNativeText(kind: 'upload' | 'photo', bytes: Uint8Array, filename: string): PapersDirectDraft {
  const staged = stagedDraft(kind, bytes, filename);
  if (staged) return staged;
  const name = safeName(filename, kind);
  let raw = '';
  try {
    raw = decodeInvoiceSource(bytes, name);
  } catch {
    raw = '';
  }
  const facts = extractPaperFacts(name, raw);
  const sales = facts.filter((fact) => fact.kind === 'sales' && fact.amount != null);
  if (sales.length) {
    return {
      kind,
      filename: name,
      folder: 'z-eod',
      honesty: 'Verified',
      note: 'Verified from the sales rows on this file. Not a closed week by itself. No invented $.',
      text: sales.map((fact) => `${fact.date ?? ''} ${fact.amount?.toFixed(2) ?? ''}`.trim()).join('\n'),
    };
  }
  const zed = facts.find((fact) => fact.kind === 'z' && fact.amount != null);
  if (zed?.amount != null) {
    return {
      kind,
      filename: name,
      folder: 'z-eod',
      honesty: 'Verified',
      note: `Verified grand total $${zed.amount.toFixed(2)} from this file. Not recovered cash. We will not guess a dollar.`,
      text: `Grand Total ${zed.amount.toFixed(2)}`,
    };
  }
  const labor = facts.find((fact) => fact.kind === 'labor' && fact.amount != null);
  if (labor?.amount != null) {
    const pct = labor.laborPct != null ? ` (${labor.laborPct}%)` : '';
    return {
      kind,
      filename: name,
      folder: 'labor',
      honesty: 'Verified',
      note: `Verified labor $${labor.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${pct} from this time clock. Hours are not a second labor dollar.`,
      text: `Total Labor ${labor.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }
  const totals = peelLiteralTotals(raw);
  const folder = classifyPapersFolder(name);
  if (totals.length > 0) {
    return {
      kind,
      filename: name,
      folder,
      honesty: 'Verified',
      note: 'Verified from a printed total on this file. Not recovered cash. No invented $.',
      text: totals.join('\n'),
    };
  }
  return {
    kind,
    filename: name,
    folder,
    honesty: 'Missing',
    note: 'No literal TOTAL/DUE line on this file. The paper stays Missing — not $0. No invented $.',
    text: '',
  };
}

export function paperFromUpload(bytes: Uint8Array, filename = 'invoice', _contentType = ''): PapersDirectDraft {
  return draftFromNativeText('upload', bytes, filename);
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
  return draftFromNativeText('photo', bytes, name);
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
  const typed = literalTypedDollars(text.trim().slice(0, 8000));
  if (typed.length > 0) {
    const amounts = typed.join(', ');
    return {
      kind: 'chat',
      filename: read.slot && read.slot !== 'google' ? read.slot : 'chat',
      folder,
      honesty: 'Estimated',
      note: `Estimated. Typed in chat: ${amounts}. Not Verified. Not a SKU price. No invented $.`,
      text: typed.join('\n'),
    };
  }
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
