/**
 * Papers intake helpers for upload, photo, and chat.
 * Adapted to papersInbox: Gmail off elevates photo, upload, and chat.
 * Peel a literal TOTAL/DUE line only. A chat-typed dollar stays that amount.
 * Never invent a dollar. Cap is the existing 8MB invoice upload.
 */

import { MAX_INVOICE_UPLOAD_BYTES } from '@/lib/invoiceFileIntake';
import { papersFileFirstWhenInboxOff } from '@/lib/papersInbox';

export { MAX_INVOICE_UPLOAD_BYTES };

export const PAPERS_INTAKE_MAX_BYTES = MAX_INVOICE_UPLOAD_BYTES;

/** Shown on the intake POSTs when Gmail is off. Readiness keeps photo → pdf → chat. */
export const PAPERS_ELEVATED_LEAD = ['photo', 'upload', 'chat'] as const;

const TOTAL_LINE =
  /((?:total\s+due|amount\s+due|grand\s+total|total\s+amount|balance\s+due)\s*[:\-]?\s*\$?\s*[\d,]+\.\d{2})/gi;

const TYPED_DOLLAR = /\$\s*\d[\d,]*(?:\.\d+)?/g;

export function peelLiteralTotals(text: string): string[] {
  const hits: string[] = [];
  for (const match of text.matchAll(TOTAL_LINE)) {
    if (match[1]) hits.push(match[1]);
  }
  return hits;
}

/** Source slices only. Does not reformat $999 into $999.00 or any other amount. */
export function literalTypedDollars(text: string): string[] {
  return [...text.matchAll(TYPED_DOLLAR)].map((match) => match[0]);
}

export function filesFromForm(form: FormData | null): File[] {
  if (!form) return [];
  const files: File[] = [];
  for (const key of ['file', 'files'] as const) {
    for (const value of form.getAll(key)) {
      if (value instanceof File) files.push(value);
    }
  }
  return files;
}

export function papersIntakeLead(connection?: { gmail?: boolean; drive?: boolean } | null): {
  elevated: boolean;
  honesty: 'Missing';
  lead: readonly ['photo', 'upload', 'chat'] | readonly ['gmail', 'photo', 'upload', 'chat'];
  note: string;
} {
  const fileFirst = papersFileFirstWhenInboxOff(connection);
  if (connection?.gmail !== true) {
    return {
      elevated: true,
      honesty: 'Missing',
      lead: PAPERS_ELEVATED_LEAD,
      note: fileFirst.note,
    };
  }
  return {
    elevated: false,
    honesty: 'Missing',
    lead: ['gmail', 'photo', 'upload', 'chat'],
    note: fileFirst.note,
  };
}
