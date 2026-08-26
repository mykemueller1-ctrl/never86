/**
 * Purchase-order and theoretical-usage intake for Action Shift.
 *
 * Invoice ≠ COGS. POS sold qty is not theoretical usage without recipe + yield.
 * Native-text CSV / PDF first. No vendor-portal login. LLM does not compute dollars.
 *
 * Synthetic fixtures only — never live store PO or invoice totals.
 */

import { findColumn, parseCsv } from './csv/core';
import { extractNativePdfText } from './pdqEodParse';
import {
  detectVendorLabel,
  parseInvoiceDateToken,
  periodFromDate,
  type EvidenceState,
} from './vendorInvoiceParse';
import { looksLikeVendorSilence } from './vendorSilenceParse';

export type LineStatus = 'readable' | 'unreadable';

export type PurchaseOrderLine = {
  vendor: string;
  sku: string;
  description: string;
  poNumber: string | null;
  period: string;
  qtyOrdered: number | null;
  unitPrice: number | null;
  status: LineStatus;
  evidenceState: EvidenceState;
  sourceLabel: string;
  raw: string;
};

export type PurchaseOrderDocument = {
  vendor: string | null;
  poNumber: string | null;
  orderDate: string | null;
  period: string | null;
  filename: string;
  lines: PurchaseOrderLine[];
  unreadableCount: number;
  missingFields: string[];
};

export type TheoreticalUsageLine = {
  sku: string;
  description: string;
  period: string;
  unitsSold: number | null;
  recipeQtyPerSold: number | null;
  yieldValue: number | null;
  theoreticalQty: number | null;
  unitCost: number | null;
  status: LineStatus;
  evidenceState: EvidenceState;
  missingEvidence: string | null;
  sourceLabel: string;
  raw: string;
};

export type TheoreticalUsageDocument = {
  period: string | null;
  filename: string;
  lines: TheoreticalUsageLine[];
  unreadableCount: number;
  missingFields: string[];
};

function moneyToken(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function qtyToken(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function decodeSource(bytes: Uint8Array, filename = ''): string {
  const pdf = filename.toLowerCase().endsWith('.pdf') || (bytes[0] === 0x25 && bytes[1] === 0x50);
  if (pdf) return extractNativePdfText(bytes);
  return Buffer.from(bytes).toString('utf8');
}

function looksLikePdq(text: string, filename: string): boolean {
  return /zreport_summary|hourly_sales|void_promo|end of day/.test(`${filename}\n${text}`.toLowerCase());
}

export function looksLikeTheoreticalUsage(text: string, filename = ''): boolean {
  if (looksLikePdq(text, filename)) return false;
  if (looksLikeVendorSilence(text, filename)) return false;
  const hay = `${filename}\n${text}`.toLowerCase();
  if (/\btheoretical\s*usage\b|\brecipe\s*qty\b|\byield\b/.test(hay) && !/\bpurchase\s*order\b/.test(hay)) {
    if (/\btheoretical\b|\brecipe\b|\busage\b/.test(hay)) return true;
  }
  if (/\b(theoretical|usage|recipe|yield)\b/.test(filename.toLowerCase())) return true;
  const { headers } = parseCsv(text);
  if (!headers.length) return false;
  const theoretical = findColumn(headers, ['TheoreticalQty', 'TheoQty', 'TheoreticalUsage']);
  const recipe = findColumn(headers, ['RecipeQtyPerSold', 'RecipeQty', 'QtyPerSold', 'Recipe']);
  const sold = findColumn(headers, ['UnitsSold', 'SoldQty', 'QtySold']);
  if (theoretical >= 0) return true;
  return recipe >= 0 && sold >= 0;
}

export function looksLikePurchaseOrder(text: string, filename = ''): boolean {
  if (looksLikePdq(text, filename)) return false;
  if (looksLikeVendorSilence(text, filename)) return false;
  if (looksLikeTheoreticalUsage(text, filename)) return false;
  const hay = `${filename}\n${text}`.toLowerCase();
  const invoiceTyped = /\binvoice\s*(number|#|no\.?|date)\b/.test(hay) || /\binvoice\b/.test(filename.toLowerCase());
  if (invoiceTyped && !/\bpurchase\s*order\b/.test(hay)) return false;
  if (/\bpurchase\s*order\b/.test(hay)) return true;
  if (/\bpo[-_ ]?(number|no\.?|#)\b/.test(hay) && !/\binvoice\b/.test(hay)) return true;
  if (/\b(purchase[-_ ]?order|\bpo[-_])/.test(filename.toLowerCase())) return true;
  const { headers } = parseCsv(text);
  if (!headers.length) return false;
  const ordered = findColumn(headers, ['QtyOrdered', 'OrderedQty', 'QuantityOrdered']);
  const poNumber = findColumn(headers, ['PONumber', 'PurchaseOrderNumber', 'PurchaseOrder']);
  return ordered >= 0 || (poNumber >= 0 && !/\binvoice\b/.test(hay));
}

function parsePoNumber(text: string): string | null {
  const m = text.match(/(?:PO|Purchase\s*Order)\s*(?:Number|#|No\.?)?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9._-]{2,})/i);
  return m?.[1] ?? null;
}

function parseOrderDate(text: string, filename = ''): string | null {
  const labeled = text.match(/(?:Order|PO)\s*Date\s*[:#]?\s*([0-9]{1,4}[/-][0-9]{1,2}[/-][0-9]{2,4})/i)
    ?? text.match(/Period\s*[:#]?\s*([0-9]{4}-[0-9]{2}(?:-[0-9]{2})?)/i);
  if (labeled) return parseInvoiceDateToken(labeled[1]) ?? labeled[1];
  const base = filename.trim().split(/[/\\]/).pop() || '';
  const fileDate = base.match(/(\d{4}-\d{2}-\d{2})/) ?? base.match(/(\d{1,2}-\d{1,2}-\d{4})/);
  return fileDate ? parseInvoiceDateToken(fileDate[1]) : null;
}

function parseUsagePeriod(text: string, filename = ''): string | null {
  return parseOrderDate(text, filename);
}

function parseCsvPurchaseOrder(text: string, filename: string): PurchaseOrderDocument | null {
  const { headers, rows } = parseCsv(text);
  if (!headers.length) return null;
  const iVendor = findColumn(headers, ['Vendor', 'Supplier', 'VendorName', 'Distributor']);
  const iSku = findColumn(headers, ['SKU', 'ItemCode', 'ProductCode', 'ItemNumber', 'SUPC', 'ProductNumber']);
  const iDesc = findColumn(headers, ['Description', 'ItemName', 'Item']);
  const iPo = findColumn(headers, ['PONumber', 'PurchaseOrderNumber', 'PurchaseOrder']);
  const iDate = findColumn(headers, ['OrderDate', 'PODate', 'Date', 'Period']);
  const iQty = findColumn(headers, ['QtyOrdered', 'OrderedQty', 'QuantityOrdered', 'Qty', 'Quantity']);
  const iPrice = findColumn(headers, ['UnitPrice', 'Price', 'CasePrice', 'ItemPrice']);
  if (iSku < 0 && iDesc < 0) return null;
  if (iQty < 0 && iPrice < 0) return null;

  const headerVendor = detectVendorLabel(text, filename);
  const bodyDate = parseOrderDate(text, filename);
  const missingFields: string[] = [];
  if (iVendor < 0 && !headerVendor) missingFields.push('Vendor / Supplier column or vendor label.');
  if (iDate < 0 && !bodyDate) missingFields.push('Order date / period.');
  if (iQty < 0) missingFields.push('Qty Ordered.');

  const sourceLabel = filename || 'purchase-order CSV';
  const lines: PurchaseOrderLine[] = [];
  for (const row of rows) {
    const vendor = (iVendor >= 0 ? row[iVendor] : '')?.trim() || headerVendor || '';
    const sku = (iSku >= 0 ? row[iSku] : '')?.trim() || '';
    const description = (iDesc >= 0 ? row[iDesc] : '')?.trim() || sku;
    const poNumber = (iPo >= 0 ? row[iPo] : '')?.trim() || parsePoNumber(text);
    const periodRaw = (iDate >= 0 ? row[iDate] : '')?.trim() || bodyDate || '';
    const period = periodFromDate(periodRaw) || periodRaw;
    const qtyOrdered = qtyToken(iQty >= 0 ? row[iQty] : null);
    const unitPrice = moneyToken(iPrice >= 0 ? row[iPrice] : null);
    const unreadable = !vendor || !sku || !period || qtyOrdered == null;
    lines.push({
      vendor,
      sku,
      description,
      poNumber: poNumber || null,
      period,
      qtyOrdered,
      unitPrice,
      status: unreadable ? 'unreadable' : 'readable',
      evidenceState: unreadable ? 'missing-evidence' : 'unverified',
      sourceLabel,
      raw: row.join(','),
    });
  }

  const vendors = [...new Set(lines.map((l) => l.vendor).filter(Boolean))];
  const periods = [...new Set(lines.map((l) => l.period).filter(Boolean))].sort();
  return {
    vendor: headerVendor || vendors[0] || null,
    poNumber: parsePoNumber(text),
    orderDate: bodyDate || (periods.length === 1 ? periods[0] : null),
    period: periods.length === 1 ? periods[0] : periods.join(','),
    filename,
    lines,
    unreadableCount: lines.filter((l) => l.status === 'unreadable').length,
    missingFields,
  };
}

function parseNativePurchaseOrder(text: string, filename: string): PurchaseOrderDocument {
  const vendor = detectVendorLabel(text, filename);
  const orderDate = parseOrderDate(text, filename);
  const period = periodFromDate(orderDate);
  const poNumber = parsePoNumber(text);
  const missingFields: string[] = [];
  if (!vendor) missingFields.push('Vendor label (PFG / Sysco / US Foods or Vendor column).');
  if (!period) missingFields.push('Order date or period.');
  const sourceLabel = filename || 'native-text purchase order';
  const vendorName = vendor || '';
  const lines: PurchaseOrderLine[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(purchase order|vendor|supplier|page|po number|order date)\b/i.test(line)) continue;
    const sku = line.match(/(?:SKU|Item(?:\s*Number)?|SUPC|Product(?:\s*Code|\s*Number)?)\s*[:#]?\s*([A-Za-z0-9._-]+)/i)?.[1]
      ?? line.match(/^([A-Za-z][A-Za-z0-9._-]{2,})\s+/)?.[1];
    const qtyOrdered = qtyToken(line.match(/Qty\s*Ordered\s*[:#]?\s*([\d.]+)/i)?.[1] ?? line.match(/\bQty\s*[:#]?\s*([\d.]+)/i)?.[1]);
    const unitPrice = moneyToken(line.match(/Unit\s*Price\s*[:#]?\s*\$?\s*([\d,]+\.\d{2})/i)?.[1]);
    if (!sku && qtyOrdered == null && unitPrice == null) continue;
    const description = line
      .replace(new RegExp(`^.*?(${sku || ''})\\s*`, 'i'), '')
      .replace(/\s+Qty\b.*$/i, '')
      .replace(/\s+Unit\s*Price\b.*$/i, '')
      .trim();
    const unreadable = !vendorName || !sku || !period || qtyOrdered == null;
    lines.push({
      vendor: vendorName,
      sku: sku || '',
      description,
      poNumber,
      period: period || '',
      qtyOrdered,
      unitPrice,
      status: unreadable ? 'unreadable' : 'readable',
      evidenceState: unreadable ? 'missing-evidence' : 'unverified',
      sourceLabel,
      raw: line,
    });
  }

  return {
    vendor,
    poNumber,
    orderDate,
    period,
    filename,
    lines,
    unreadableCount: lines.filter((l) => l.status === 'unreadable').length,
    missingFields,
  };
}

export function parsePurchaseOrder(text: string, filename = ''): PurchaseOrderDocument {
  const csv = parseCsvPurchaseOrder(text, filename);
  if (csv && csv.lines.length) return csv;
  return parseNativePurchaseOrder(text, filename);
}

export function parsePurchaseOrderSource(source: string | Uint8Array, filename = ''): PurchaseOrderDocument {
  const text = typeof source === 'string' ? source : decodeSource(source, filename);
  return parsePurchaseOrder(text, filename);
}

function recipeTheoretical(unitsSold: number | null, recipeQty: number | null, yieldValue: number | null): number | null {
  if (unitsSold == null || recipeQty == null || yieldValue == null || yieldValue <= 0) return null;
  return unitsSold * recipeQty / yieldValue;
}

function parseCsvUsage(text: string, filename: string): TheoreticalUsageDocument | null {
  const { headers, rows } = parseCsv(text);
  if (!headers.length) return null;
  const iSku = findColumn(headers, ['SKU', 'ItemCode', 'ProductCode', 'ItemNumber']);
  const iDesc = findColumn(headers, ['Description', 'ItemName', 'Item']);
  const iPeriod = findColumn(headers, ['Period', 'Date', 'BusinessDate']);
  const iSold = findColumn(headers, ['UnitsSold', 'SoldQty', 'QtySold']);
  const iRecipe = findColumn(headers, ['RecipeQtyPerSold', 'RecipeQty', 'QtyPerSold']);
  const iYield = findColumn(headers, ['Yield', 'YieldFactor']);
  const iTheo = findColumn(headers, ['TheoreticalQty', 'TheoQty', 'TheoreticalUsage']);
  const iCost = findColumn(headers, ['UnitCost', 'UnitPrice', 'Cost']);
  if (iSku < 0 && iDesc < 0) return null;
  if (iTheo < 0 && iSold < 0 && iRecipe < 0) return null;

  const bodyDate = parseUsagePeriod(text, filename);
  const missingFields: string[] = [];
  if (iPeriod < 0 && !bodyDate) missingFields.push('Period / business date.');
  const sourceLabel = filename || 'theoretical-usage CSV';
  const lines: TheoreticalUsageLine[] = [];

  for (const row of rows) {
    const sku = (iSku >= 0 ? row[iSku] : '')?.trim() || '';
    const description = (iDesc >= 0 ? row[iDesc] : '')?.trim() || sku;
    const periodRaw = (iPeriod >= 0 ? row[iPeriod] : '')?.trim() || bodyDate || '';
    const period = periodFromDate(periodRaw) || periodRaw;
    const unitsSold = qtyToken(iSold >= 0 ? row[iSold] : null);
    const recipeQtyPerSold = qtyToken(iRecipe >= 0 ? row[iRecipe] : null);
    const yieldValue = qtyToken(iYield >= 0 ? row[iYield] : null);
    const explicitTheo = qtyToken(iTheo >= 0 ? row[iTheo] : null);
    const fromRecipe = recipeTheoretical(unitsSold, recipeQtyPerSold, yieldValue);
    const unitCost = moneyToken(iCost >= 0 ? row[iCost] : null);
    const raw = row.join(',');

    if (explicitTheo == null && fromRecipe == null) {
      const need = unitsSold != null
        ? `Recipe qty per sold unit and yield for ${sku || 'this SKU'} are Missing Evidence. POS sold quantity is not theoretical usage.`
        : `Theoretical qty (or units sold + recipe + yield) for ${sku || 'this row'} is Missing Evidence, not $0.`;
      lines.push({
        sku,
        description,
        period,
        unitsSold,
        recipeQtyPerSold,
        yieldValue,
        theoreticalQty: null,
        unitCost,
        status: 'unreadable',
        evidenceState: 'missing-evidence',
        missingEvidence: need,
        sourceLabel,
        raw,
      });
      continue;
    }

    const theoreticalQty = explicitTheo ?? fromRecipe;
    const mismatch = explicitTheo != null && fromRecipe != null && Math.abs(explicitTheo - fromRecipe) >= 0.01;
    const unreadable = !sku || !period || theoreticalQty == null;
    lines.push({
      sku,
      description,
      period,
      unitsSold,
      recipeQtyPerSold,
      yieldValue,
      theoreticalQty: unreadable ? null : theoreticalQty,
      unitCost,
      status: unreadable ? 'unreadable' : 'readable',
      evidenceState: unreadable ? 'missing-evidence' : mismatch ? 'partial' : 'unverified',
      missingEvidence: mismatch
        ? `Explicit theoretical qty and recipe×sold/yield disagree for ${sku}; neither was silently repaired.`
        : unreadable
          ? `Theoretical usage line for ${sku || 'unknown SKU'} is Missing Evidence, not $0.`
          : null,
      sourceLabel,
      raw,
    });
  }

  const periods = [...new Set(lines.map((l) => l.period).filter(Boolean))].sort();
  return {
    period: periods.length === 1 ? periods[0] : periods.join(',') || bodyDate,
    filename,
    lines,
    unreadableCount: lines.filter((l) => l.status === 'unreadable').length,
    missingFields,
  };
}

function parseNativeUsage(text: string, filename: string): TheoreticalUsageDocument {
  const period = periodFromDate(parseUsagePeriod(text, filename));
  const missingFields: string[] = [];
  if (!period) missingFields.push('Period / business date.');
  const sourceLabel = filename || 'native-text theoretical usage';
  const lines: TheoreticalUsageLine[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(theoretical usage|period|page)\b/i.test(line)) continue;
    const sku = line.match(/(?:SKU|Item)\s*[:#]?\s*([A-Za-z0-9._-]+)/i)?.[1]
      ?? line.match(/^([A-Za-z][A-Za-z0-9._-]{2,})\s+/)?.[1];
    const theoreticalQty = qtyToken(line.match(/Theoretical\s*Qty\s*[:#]?\s*([\d.]+)/i)?.[1]);
    const unitsSold = qtyToken(line.match(/Units\s*Sold\s*[:#]?\s*([\d.]+)/i)?.[1]);
    const recipeQtyPerSold = qtyToken(line.match(/Recipe\s*Qty(?:\s*Per\s*Sold)?\s*[:#]?\s*([\d.]+)/i)?.[1]);
    const yieldValue = qtyToken(line.match(/Yield\s*[:#]?\s*([\d.]+)/i)?.[1]);
    const unitCost = moneyToken(line.match(/Unit\s*Cost\s*[:#]?\s*\$?\s*([\d,]+\.\d{2})/i)?.[1]);
    if (!sku && theoreticalQty == null && unitsSold == null) continue;
    const fromRecipe = recipeTheoretical(unitsSold, recipeQtyPerSold, yieldValue);
    const qty = theoreticalQty ?? fromRecipe;
    const description = line
      .replace(new RegExp(`^.*?(${sku || ''})\\s*`, 'i'), '')
      .replace(/\s+Theoretical\s*Qty\b.*$/i, '')
      .trim();
    if (qty == null) {
      lines.push({
        sku: sku || '',
        description,
        period: period || '',
        unitsSold,
        recipeQtyPerSold,
        yieldValue,
        theoreticalQty: null,
        unitCost,
        status: 'unreadable',
        evidenceState: 'missing-evidence',
        missingEvidence: unitsSold != null
          ? `Recipe qty per sold unit and yield for ${sku || 'this SKU'} are Missing Evidence. POS sold quantity is not theoretical usage.`
          : `Theoretical qty for ${sku || 'this row'} is Missing Evidence, not $0.`,
        sourceLabel,
        raw: line,
      });
      continue;
    }
    const unreadable = !sku || !period;
    lines.push({
      sku: sku || '',
      description,
      period: period || '',
      unitsSold,
      recipeQtyPerSold,
      yieldValue,
      theoreticalQty: unreadable ? null : qty,
      unitCost,
      status: unreadable ? 'unreadable' : 'readable',
      evidenceState: unreadable ? 'missing-evidence' : 'unverified',
      missingEvidence: unreadable
        ? `Theoretical usage line for ${sku || 'unknown SKU'} is Missing Evidence, not $0.`
        : null,
      sourceLabel,
      raw: line,
    });
  }

  return {
    period,
    filename,
    lines,
    unreadableCount: lines.filter((l) => l.status === 'unreadable').length,
    missingFields,
  };
}

export function parseTheoreticalUsage(text: string, filename = ''): TheoreticalUsageDocument {
  const csv = parseCsvUsage(text, filename);
  if (csv && csv.lines.length) return csv;
  return parseNativeUsage(text, filename);
}

export function parseTheoreticalUsageSource(source: string | Uint8Array, filename = ''): TheoreticalUsageDocument {
  const text = typeof source === 'string' ? source : decodeSource(source, filename);
  return parseTheoreticalUsage(text, filename);
}
