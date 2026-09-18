/**
 * Operator invoice / SKU papers path.
 * Native PDF text + CSV first. Formulas decide $. Scanned/empty stays Missing.
 */

import { attachPublicHonesty, type HonestyLabel } from '@/lib/oneSeatPublicWin';
import { compareVendorInvoiceDocuments } from '@/lib/vendorDriftActionShift';
import {
  decodeInvoiceSource,
  looksLikeVendorInvoice,
  parseVendorInvoice,
  type VendorInvoiceDocument,
  type VendorInvoiceLine,
} from '@/lib/vendorInvoiceParse';
import { looksLikeInvoicePaper, type PapersHonesty } from '@/lib/papersInbox';

export type PapersSkuLine = {
  vendor: string;
  sku: string;
  description: string;
  pack: string | null;
  unitPrice: number | null;
  quantity: number | null;
  honesty: HonestyLabel;
};

export type PapersInvoiceRecord = {
  filename: string;
  text: string;
  honesty: PapersHonesty;
  note: string;
  document: VendorInvoiceDocument;
  lines: PapersSkuLine[];
};

export function skuHonesty(line: Pick<VendorInvoiceLine, 'status' | 'unitPrice' | 'sku' | 'vendor'>): HonestyLabel {
  if (line.status === 'unreadable' || line.unitPrice == null || !line.sku || !line.vendor) return 'Missing';
  return 'Estimated';
}

export function skuLinesFromDocument(doc: VendorInvoiceDocument): PapersSkuLine[] {
  return doc.lines.map((line) => ({
    vendor: line.vendor,
    sku: line.sku,
    description: line.description,
    pack: line.pack ?? null,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    honesty: skuHonesty(line),
  }));
}

export function invoiceDocumentToCompareText(doc: VendorInvoiceDocument): string {
  const header = 'Vendor,SKU,Description,Pack,Period,Unit Price,Qty';
  const rows = doc.lines.map((line) =>
    [
      csvCell(line.vendor),
      csvCell(line.sku),
      csvCell(line.description),
      csvCell(line.pack ?? ''),
      csvCell(line.period),
      line.unitPrice == null ? '' : line.unitPrice.toFixed(2),
      line.quantity == null ? '' : String(line.quantity),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

function csvCell(value: string): string {
  const v = value.replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}

export function parseSeatInvoiceBytes(bytes: Uint8Array, filename: string): PapersInvoiceRecord {
  const text = decodeInvoiceSource(bytes, filename);
  const document = parseVendorInvoice(text, filename);
  const readable = document.lines.some((line) => line.status === 'readable' && line.unitPrice != null);
  const nativeMissing = !text.trim();
  let honesty: PapersHonesty = 'Missing';
  let note = 'No invoice SKU lines landed. Missing is not $0.';
  if (nativeMissing) {
    note = 'Scanned or empty PDF — native text Missing. No invented SKU $. Snap a clearer paper or drop CSV.';
  } else if (readable) {
    honesty = 'Estimated';
    note = 'SKU lines parsed from the paper. Unit $ stay Estimated until two matching invoices compare.';
  } else if (looksLikeVendorInvoice(text, filename) || looksLikeInvoicePaper(filename)) {
    note = 'Invoice file landed. SKU / pack / unit $ are Missing on unreadable lines — not $0.';
  }
  return {
    filename,
    text: readable ? invoiceDocumentToCompareText(document) : text,
    honesty,
    note,
    document,
    lines: skuLinesFromDocument(document),
  };
}

export function pickTwoInvoicesForCompare(records: PapersInvoiceRecord[]): {
  prior: PapersInvoiceRecord | null;
  current: PapersInvoiceRecord | null;
  honesty: PapersHonesty;
  missing: string | null;
} {
  const usable = records.filter((row) => row.lines.some((line) => line.honesty !== 'Missing' && line.unitPrice != null));
  if (usable.length < 2) {
    return {
      prior: usable[0] ?? null,
      current: null,
      honesty: 'Missing',
      missing: 'Need two invoices from the same vendor before a compare. One paper stays Missing — not $0.',
    };
  }
  const sorted = [...usable].sort((a, b) => {
    const ap = a.document.period || '';
    const bp = b.document.period || '';
    return ap.localeCompare(bp);
  });
  return {
    prior: sorted[0],
    current: sorted[sorted.length - 1],
    honesty: 'Estimated',
    missing: null,
  };
}

export function papersInvoiceCompare(records: PapersInvoiceRecord[]): {
  documents: Array<{ text: string; filename: string }>;
  compare: ReturnType<typeof compareVendorInvoiceDocuments> & {
    rows: ReturnType<typeof attachPublicHonesty>;
  } | null;
  honesty: PapersHonesty;
  missing: string | null;
} {
  const picked = pickTwoInvoicesForCompare(records);
  if (!picked.prior || !picked.current || picked.prior.filename === picked.current.filename) {
    return {
      documents: picked.prior ? [{ text: picked.prior.text, filename: picked.prior.filename }] : [],
      compare: null,
      honesty: 'Missing',
      missing: picked.missing,
    };
  }
  const documents = [
    { text: picked.prior.text, filename: picked.prior.filename },
    { text: picked.current.text, filename: picked.current.filename },
  ];
  const compare = compareVendorInvoiceDocuments([picked.prior.document, picked.current.document]);
  const verified = compare.rows.some(
    (row) => row.priorPrice != null && row.currentPrice != null && row.evidenceState !== 'missing-evidence',
  );
  return {
    documents,
    compare: {
      ...compare,
      rows: attachPublicHonesty(compare.rows, false),
    },
    honesty: verified ? 'Verified' : 'Estimated',
    missing: compare.missingEvidence[0] ?? null,
  };
}
