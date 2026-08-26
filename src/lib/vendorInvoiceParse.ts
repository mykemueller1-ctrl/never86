/**
 * Vendor invoice intake for Action Shift.
 *
 * Native-text CSV / PDF first. OCR is not this path. LLM does not compute dollars.
 *
 * Field map — vendor labels only, never live store totals or customer invoices:
 *   PFG / Performance Food Group:
 *     Item Number | Description | Pack | Qty | Unit Price | Invoice Date
 *   Sysco:
 *     SUPC / Product Code | Description | Pack/Size | Qty | Price | Invoice Date
 *   US Foods:
 *     Product Number | Description | Pack | Qty | Unit Price | Invoice Date
 */

import { findColumn, num, parseCsv } from './csv/core';
import { extractNativePdfText } from './pdqEodParse';

export type EvidenceState =
  | 'verified'
  | 'reconciled'
  | 'partial'
  | 'estimated'
  | 'unverified'
  | 'missing-evidence';

export type InvoiceLineStatus = 'readable' | 'unreadable';

export type VendorInvoiceLine = {
  vendor: string;
  sku: string;
  description: string;
  period: string;
  unitPrice: number | null;
  quantity: number | null;
  status: InvoiceLineStatus;
  evidenceState: EvidenceState;
  sourceLabel: string;
  raw: string;
};

export type VendorInvoiceDocument = {
  vendor: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  period: string | null;
  filename: string;
  lines: VendorInvoiceLine[];
  unreadableCount: number;
  missingFields: string[];
};

const VENDOR_LABELS: Array<{ re: RegExp; label: string }> = [
  { re: /performance\s*food\s*group|\bpfg\b/i, label: 'PFG' },
  { re: /\bsysco\b/i, label: 'Sysco' },
  { re: /\bus\s*foods\b|\busfoods\b/i, label: 'US Foods' },
];

export function decodeInvoiceSource(bytes: Uint8Array, filename = ''): string {
  const pdf = filename.toLowerCase().endsWith('.pdf') || (bytes[0] === 0x25 && bytes[1] === 0x50);
  if (pdf) return extractNativePdfText(bytes);
  return Buffer.from(bytes).toString('utf8');
}

export function looksLikeVendorInvoice(text: string, filename = ''): boolean {
  const hay = `${filename}\n${text}`.toLowerCase();
  if (/zreport_summary|hourly_sales|void_promo|end of day/.test(hay)) return false;
  if (/\binvoice\b/.test(hay)) return true;
  if (VENDOR_LABELS.some((v) => v.re.test(hay))) return true;
  const { headers } = parseCsv(text);
  if (!headers.length) return false;
  const sku = findColumn(headers, ['SKU', 'ItemCode', 'ProductCode', 'ItemNumber', 'SUPC', 'ProductNumber']);
  const price = findColumn(headers, ['UnitPrice', 'Price', 'CasePrice', 'ItemPrice']);
  return sku >= 0 && price >= 0;
}

export function detectVendorLabel(text: string, filename = ''): string | null {
  const hay = `${filename}\n${text}`;
  for (const vendor of VENDOR_LABELS) {
    if (vendor.re.test(hay)) return vendor.label;
  }
  return null;
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

export function parseInvoiceDateToken(raw: string): string | null {
  const t = raw.trim();
  const ymd = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return isoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
  const ym = t.match(/^(\d{4})-(\d{2})$/);
  if (ym) return `${ym[1]}-${ym[2]}`;
  const mdy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdy) return isoDate(Number(mdy[3]), Number(mdy[1]), Number(mdy[2]));
  return null;
}

export function periodFromDate(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return parseInvoiceDateToken(value);
}

function parseInvoiceDateFromBody(text: string, filename = ''): string | null {
  const labeled = text.match(/Invoice\s*Date\s*[:#]?\s*([0-9]{1,4}[/-][0-9]{1,2}[/-][0-9]{2,4})/i)
    ?? text.match(/Period\s*[:#]?\s*([0-9]{4}-[0-9]{2}(?:-[0-9]{2})?)/i);
  if (labeled) return parseInvoiceDateToken(labeled[1]) ?? labeled[1];
  const base = filename.trim().split(/[/\\]/).pop() || '';
  const fileDate = base.match(/(\d{4}-\d{2}-\d{2})/) ?? base.match(/(\d{1,2}-\d{1,2}-\d{4})/);
  return fileDate ? parseInvoiceDateToken(fileDate[1]) : null;
}

function parseInvoiceNumber(text: string): string | null {
  const m = text.match(/Invoice\s*(?:Number|#|No\.?)\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9._-]{2,})/i);
  return m?.[1] ?? null;
}

function moneyToken(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function looksLikeItemStart(line: string): boolean {
  return /^(?:item\s+)?[A-Za-z0-9][A-Za-z0-9._-]{1,}\b/i.test(line.trim())
    && !/^(invoice|vendor|supplier|page|total|subtotal|tax|pack|sku|item number|description|unit price|qty)\b/i.test(line.trim());
}

function parseLabeledItemLine(line: string, vendor: string, period: string, sourceLabel: string): VendorInvoiceLine | null {
  const sku = line.match(/(?:SKU|Item(?:\s*Number)?|SUPC|Product(?:\s*Code|\s*Number)?)\s*[:#]?\s*([A-Za-z0-9._-]+)/i)?.[1];
  const price = moneyToken(line.match(/Unit\s*Price\s*[:#]?\s*\$?\s*([\d,]+\.\d{2})/i)?.[1]);
  if (!sku && price == null) return null;
  const labeledDesc = line.match(/Desc(?:ription)?\s*[:#]?\s*(.+?)(?:\s+Qty\b|\s+Pack\b|\s+Unit Price\b|$)/i)?.[1]?.trim();
  const between = sku
    ? line.replace(new RegExp(`^.*?${sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '')
      .replace(/\s+Qty\b.*$/i, '')
      .replace(/\s+Pack\b.*$/i, '')
      .replace(/\s+Unit\s*Price\b.*$/i, '')
      .trim()
    : '';
  const description = labeledDesc || between;
  const qtyRaw = line.match(/Qty\s*[:#]?\s*([\d.]+)/i)?.[1];
  const quantity = qtyRaw != null && Number.isFinite(Number(qtyRaw)) ? Number(qtyRaw) : null;
  if (!sku || price == null || !period) {
    return {
      vendor,
      sku: sku || '',
      description,
      period,
      unitPrice: price,
      quantity,
      status: 'unreadable',
      evidenceState: 'missing-evidence',
      sourceLabel,
      raw: line,
    };
  }
  return {
    vendor,
    sku,
    description,
    period,
    unitPrice: price,
    quantity,
    status: 'readable',
    evidenceState: 'unverified',
    sourceLabel,
    raw: line,
  };
}

function parseColumnarItemLine(line: string, vendor: string, period: string, sourceLabel: string): VendorInvoiceLine | null {
  const trimmed = line.trim();
  const money = [...trimmed.matchAll(/\$?\s*([\d,]+\.\d{2})/g)].map((m) => m[1]);
  if (!money.length) return null;
  const unitPrice = moneyToken(money.length >= 2 ? money[money.length - 2] : money[0]);
  const skuMatch = trimmed.match(/^([A-Za-z0-9][A-Za-z0-9._-]{1,})\s+(.+)$/);
  if (!skuMatch) return null;
  const sku = skuMatch[1];
  const rest = skuMatch[2];
  const desc = rest
    .replace(/\$?\s*[\d,]+\.\d{2}/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\b/g, ' ')
    .replace(/\b(?:CS|EA|LB|GAL|CN|DZ|CASE|EACH)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const qtyMatch = rest.match(/\s(\d+(?:\.\d+)?)\s+(?:CS|EA|LB|GAL|CN|DZ|CASE|EACH)\b/i)
    ?? rest.match(/\s(\d+(?:\.\d+)?)\s+\$?[\d,]+\.\d{2}/);
  const quantity = qtyMatch && Number.isFinite(Number(qtyMatch[1])) ? Number(qtyMatch[1]) : null;
  if (unitPrice == null || !period) {
    return {
      vendor,
      sku,
      description: desc,
      period,
      unitPrice,
      quantity,
      status: 'unreadable',
      evidenceState: 'missing-evidence',
      sourceLabel,
      raw: line,
    };
  }
  return {
    vendor,
    sku,
    description: desc,
    period,
    unitPrice,
    quantity,
    status: 'readable',
    evidenceState: 'unverified',
    sourceLabel,
    raw: line,
  };
}

function parseNativeTextInvoice(text: string, filename: string): VendorInvoiceDocument {
  const vendor = detectVendorLabel(text, filename);
  const invoiceDate = parseInvoiceDateFromBody(text, filename);
  const period = periodFromDate(invoiceDate);
  const invoiceNumber = parseInvoiceNumber(text);
  const missingFields: string[] = [];
  if (!vendor) missingFields.push('Vendor label (PFG / Sysco / US Foods or Vendor column).');
  if (!period) missingFields.push('Invoice date or period.');

  const sourceLabel = filename || 'native-text invoice';
  const lines: VendorInvoiceLine[] = [];
  const vendorName = vendor || '';

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(invoice|page|subtotal|grand total|tax|amount due|vendor|supplier)\b/i.test(line)) continue;

    const labeled = parseLabeledItemLine(line, vendorName, period || '', sourceLabel);
    if (labeled) {
      lines.push(labeled);
      continue;
    }
    if (!looksLikeItemStart(line)) continue;
    if (/unit price|item number|description/i.test(line) && !/\d+\.\d{2}/.test(line)) continue;
    const columnar = parseColumnarItemLine(line, vendorName, period || '', sourceLabel);
    if (columnar) {
      lines.push(columnar);
      continue;
    }
    if (/\d/.test(line)) {
      lines.push({
        vendor: vendorName,
        sku: '',
        description: '',
        period: period || '',
        unitPrice: null,
        quantity: null,
        status: 'unreadable',
        evidenceState: 'missing-evidence',
        sourceLabel,
        raw: line,
      });
    }
  }

  return {
    vendor,
    invoiceNumber,
    invoiceDate,
    period,
    filename,
    lines,
    unreadableCount: lines.filter((l) => l.status === 'unreadable').length,
    missingFields,
  };
}

function parseCsvInvoice(text: string, filename: string): VendorInvoiceDocument | null {
  const { headers, rows } = parseCsv(text);
  if (!headers.length) return null;
  const iVendor = findColumn(headers, ['Vendor', 'Supplier', 'VendorName', 'Distributor']);
  const iSku = findColumn(headers, ['SKU', 'ItemCode', 'ProductCode', 'ItemNumber', 'SUPC', 'ProductNumber']);
  const iDesc = findColumn(headers, ['Description', 'ItemName', 'Item', 'SKUDescription']);
  const iPeriod = findColumn(headers, ['Period', 'Month', 'InvoiceDate', 'Date', 'BusinessDate']);
  const iPrice = findColumn(headers, ['UnitPrice', 'Price', 'CasePrice', 'ItemPrice']);
  const iQty = findColumn(headers, ['Qty', 'Quantity', 'Cases', 'Units']);

  if (iSku < 0 && iDesc < 0) return null;
  if (iPrice < 0) return null;

  const headerVendor = detectVendorLabel(text, filename);
  const bodyDate = parseInvoiceDateFromBody(text, filename);
  const missingFields: string[] = [];
  if (iVendor < 0 && !headerVendor) missingFields.push('Vendor / Supplier column or vendor label.');
  if (iPeriod < 0 && !bodyDate) missingFields.push('Period / Invoice Date.');

  const sourceLabel = filename || 'invoice CSV';
  const lines: VendorInvoiceLine[] = [];

  for (const row of rows) {
    const vendor = (iVendor >= 0 ? row[iVendor] : '')?.trim() || headerVendor || '';
    const sku = (iSku >= 0 ? row[iSku] : '')?.trim() || (iDesc >= 0 ? row[iDesc] : '')?.trim() || '';
    const description = (iDesc >= 0 ? row[iDesc] : '')?.trim() || sku;
    const periodRaw = (iPeriod >= 0 ? row[iPeriod] : '')?.trim() || bodyDate || '';
    const period = periodFromDate(periodRaw) || periodRaw;
    const priceCell = iPrice >= 0 ? row[iPrice] : '';
    const parsedPrice = num(priceCell);
    const unitPrice = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : null;
    const qtyCell = iQty >= 0 ? num(row[iQty]) : NaN;
    const quantity = Number.isFinite(qtyCell) && qtyCell > 0 ? qtyCell : null;
    const raw = row.join(',');
    const unreadable = !vendor || !sku || !period || unitPrice == null;
    lines.push({
      vendor,
      sku,
      description,
      period,
      unitPrice,
      quantity,
      status: unreadable ? 'unreadable' : 'readable',
      evidenceState: unreadable ? 'missing-evidence' : 'unverified',
      sourceLabel,
      raw,
    });
  }

  const vendors = [...new Set(lines.map((l) => l.vendor).filter(Boolean))];
  const periods = [...new Set(lines.map((l) => l.period).filter(Boolean))].sort();

  return {
    vendor: headerVendor || vendors[0] || null,
    invoiceNumber: parseInvoiceNumber(text),
    invoiceDate: bodyDate || (periods.length === 1 ? periods[0] : null),
    period: periods.length === 1 ? periods[0] : periods.join(','),
    filename,
    lines,
    unreadableCount: lines.filter((l) => l.status === 'unreadable').length,
    missingFields,
  };
}

export function parseVendorInvoice(text: string, filename = ''): VendorInvoiceDocument {
  const csv = parseCsvInvoice(text, filename);
  if (csv && csv.lines.length) return csv;
  return parseNativeTextInvoice(text, filename);
}

export function parseVendorInvoiceSource(
  source: string | Uint8Array,
  filename = '',
): VendorInvoiceDocument {
  const text = typeof source === 'string' ? source : decodeInvoiceSource(source, filename);
  return parseVendorInvoice(text, filename);
}
