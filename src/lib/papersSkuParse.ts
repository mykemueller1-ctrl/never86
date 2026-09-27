/**
 * SKU / line rows read off restaurant papers.
 * Every number is Verified only when that field is on the paper.
 * Missing stays Missing. Extended price is never qty × price.
 * Photos with no text layer stay empty. This file does not OCR.
 */

import { isHeicUpload } from '@/lib/invoiceFileIntake';
import { extractPdfTokens } from '@/lib/pdfTextTokens';
import {
  missingField,
  textField,
  type PapersLabeledField,
  type PapersLineItem,
} from '@/lib/papersScanTypes';
import type { VendorInvoiceDocument, VendorInvoiceLine } from '@/lib/vendorInvoiceParse';

export type PapersSkuRow = {
  productName: PapersLabeledField;
  itemCode: PapersLabeledField;
  quantity: PapersLabeledField;
  unit: PapersLabeledField;
  unitPrice: PapersLabeledField;
  extendedPrice: PapersLabeledField;
  vendor: PapersLabeledField;
  documentDate: PapersLabeledField;
  documentNumber: PapersLabeledField;
  category: PapersLabeledField;
  isoWeek: string | null;
  documentKey?: string;
};

const PHOTO_NOTE = 'Photo has no text layer. SKU lines Missing. OCR is a later step.';
const EMPTY_NOTE = 'No text layer. SKU lines Missing.';
const NONE_NOTE = 'No SKU lines read. Missing is not $0.';

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

const SUPPLY_RE = /liner|glove|chemical|\btowel\b|\bsoap\b|\bmat\b|\bmop\b|apron|tissue|t-sack|canliner/i;
/** Disposable packaging. A flour bag stays food. A printed pack size is not a unit conversion. */
const PACKAGING_RE = /\blids?\b|souffle|pizza\s*box|box\s*pizza|\bcontainers?\b|\bnapkins?\b|\bstraws?\b|clamshell|\bcartons?\b|\bplacemats?\b/i;
const LIQUOR_RE = /vodka|whiskey|whisky|tequila|\brum\b|\bgin\b|smir|liqueur|carbliss|bourbon|schnapps/i;
const BEER_RE = /\bbeer\b|busch|\bbud\b|lager|\bale\b|\bipa\b|\bbbl\b|\bkeg\b|michelob|seltzer|\bultra\b/i;

/** Same Thursday-based ISO week as tipVarianceCsv. A calendar key, not a dollar formula. */
export function isoWeekKeyFromDate(iso: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) return null;
  const t = new Date(parsed.getTime());
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - start.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Operator-typed date. ISO or month/day/year. Unreadable text has no week. */
export function calendarFromEditedDate(raw: string | null | undefined): { iso: string | null; isoWeek: string | null } {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { iso: null, isoWeek: null };
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? (isoWeekKeyFromDate(trimmed) ? trimmed : null)
    : dateFromMdy(trimmed);
  if (!iso) return { iso: null, isoWeek: null };
  return { iso, isoWeek: isoWeekKeyFromDate(iso) };
}

export function parsePapersSkuLines(input: {
  filename?: string;
  text?: string;
  bytes?: Uint8Array;
}): { lines: PapersSkuRow[]; note: string } {
  const filename = input.filename ?? '';
  if (isPhotoWithoutText(filename, input.bytes)) return { lines: [], note: PHOTO_NOTE };
  const tokens = tokensFrom(filename, input.text, input.bytes);
  if (!tokens.length) return { lines: [], note: EMPTY_NOTE };
  const lines = dispatchSkuTokens(tokens, filename);
  if (!lines.length) return { lines: [], note: NONE_NOTE };
  return {
    lines,
    note: `Read ${lines.length} line${lines.length === 1 ? '' : 's'} from the paper.`,
  };
}

export function skuRowToLineItem(row: PapersSkuRow): PapersLineItem {
  return {
    sku: row.itemCode,
    description: row.productName,
    quantity: row.quantity,
    unit: row.unit,
    unitPrice: row.unitPrice,
    extendedPrice: row.extendedPrice,
    category: row.category,
  };
}

export function vendorDocumentsFromSkuRows(rows: PapersSkuRow[]): VendorInvoiceDocument[] {
  const groups = new Map<string, PapersSkuRow[]>();
  for (const row of rows) {
    const key = [
      row.documentKey || row.documentNumber.value || 'paper',
      row.vendor.value || '',
      row.documentNumber.value || '',
      row.isoWeek || '',
    ].join('::');
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }
  return [...groups.values()].map((group) => {
    const lines = group.map(vendorLineFromSku);
    return {
      vendor: group[0].vendor.value,
      invoiceNumber: group[0].documentNumber.value,
      invoiceDate: group[0].documentDate.value,
      period: group[0].isoWeek,
      filename: group[0].documentKey || group[0].documentNumber.value || 'paper',
      lines,
      unreadableCount: lines.filter((line) => line.status === 'unreadable').length,
      missingFields: lines
        .filter((line) => line.status === 'unreadable')
        .map((line) => line.sku
          ? `Unreadable line for ${line.vendor || 'unknown vendor'} ${line.sku} is Missing Evidence, not $0.`
          : 'Unreadable invoice line is Missing Evidence, not $0.'),
    };
  });
}

function vendorLineFromSku(row: PapersSkuRow): VendorInvoiceLine {
  const sku = row.itemCode.honesty !== 'Missing' && row.itemCode.value
    ? row.itemCode.value
    : (row.productName.value || '');
  const unitPrice = row.unitPrice.honesty === 'Missing' ? null : row.unitPrice.amount;
  const period = row.isoWeek || '';
  const vendor = row.vendor.value || '';
  const readable = Boolean(sku && vendor && period && unitPrice != null);
  return {
    vendor,
    sku,
    description: row.productName.value || '',
    pack: row.unit.honesty === 'Missing' ? null : row.unit.value,
    period,
    unitPrice,
    quantity: row.quantity.honesty === 'Missing' ? null : row.quantity.amount,
    status: readable ? 'readable' : 'unreadable',
    evidenceState: readable
      ? (row.unitPrice.honesty === 'Verified' ? 'verified' : 'unverified')
      : 'missing-evidence',
    sourceLabel: 'paper text',
    raw: [row.productName.value, row.itemCode.value].filter(Boolean).join(' '),
  };
}

function isPhotoWithoutText(filename: string, bytes?: Uint8Array): boolean {
  if (/\.(heic|heif|jpe?g|png|gif|webp)$/i.test(filename)) return true;
  if (bytes && isHeicUpload(bytes, filename)) return true;
  return false;
}

function looksLikePdf(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function tokensFrom(filename: string, text?: string, bytes?: Uint8Array): string[] {
  if (bytes && (looksLikePdf(bytes) || filename.toLowerCase().endsWith('.pdf'))) {
    const fromPdf = extractPdfTokens(bytes);
    if (fromPdf.length) return fromPdf;
  }
  if (!text?.trim()) return [];
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function dispatchSkuTokens(tokens: string[], filename: string): PapersSkuRow[] {
  return parseTimeClock(tokens, filename)
    ?? parsePdqZ(tokens, filename)
    ?? parseDoorDash(tokens, filename)
    ?? parseHumes(tokens, filename)
    ?? parseNorthern(tokens, filename)
    ?? parseVestis(tokens, filename)
    ?? parsePfg(tokens, filename)
    ?? [];
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

function dateFromMdy(raw: string): string | null {
  const match = raw.trim().match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return null;
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  return isoDate(year, Number(match[1]), Number(match[2]));
}

function dateFromMonthName(raw: string): string | null {
  const match = raw.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  return isoDate(Number(match[3]), month, Number(match[2]));
}

function looseDecimal(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const neg = trimmed.startsWith('-') || /^\(.*\)$/.test(trimmed);
  const cleaned = trimmed.replace(/[$,()\s-]/g, '');
  if (!/^\d*\.\d+$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;
  return neg ? -amount : amount;
}

function isDecimalToken(raw: string | undefined): boolean {
  return looseDecimal(raw) != null;
}

function isMoneyToken(raw: string | undefined): boolean {
  if (!raw) return false;
  const cleaned = raw.trim().replace(/[$,()\s-]/g, '');
  return /^\d{1,3}(,\d{3})*\.\d{2}$/.test(raw.trim().replace(/[()$-]/g, '').replace(/^-/, ''))
    || /^\d+\.\d{2}$/.test(cleaned);
}

function qtyToken(raw: string | undefined): number | null {
  if (!raw || !/^-?\d+(?:\.\d+)?$/.test(raw.trim())) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

function verifiedText(value: string, note: string | null = null): PapersLabeledField {
  return textField(value, 'Verified', note);
}

function priceField(amount: number): PapersLabeledField {
  const rounded = Math.round(amount * 10000) / 10000;
  const cents = Math.abs(rounded * 100 - Math.round(rounded * 100)) < 1e-6;
  const abs = Math.abs(rounded);
  const value = cents
    ? `${rounded < 0 ? '-' : ''}$${abs.toFixed(2)}`
    : `${rounded < 0 ? '-' : ''}${abs.toFixed(4).replace(/0+$/, '')}`;
  return { honesty: 'Verified', value, amount: rounded, note: null };
}

function qtyField(amount: number, raw: string): PapersLabeledField {
  return { honesty: 'Verified', value: raw, amount, note: null };
}

function categoryField(id: string): PapersLabeledField {
  return verifiedText(id);
}

function metaDate(iso: string | null): { field: PapersLabeledField; isoWeek: string | null } {
  if (!iso) return { field: missingField(), isoWeek: null };
  return { field: verifiedText(iso), isoWeek: isoWeekKeyFromDate(iso) };
}

function valueAfter(tokens: string[], label: string): string | null {
  const wanted = label.toLowerCase();
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i].toLowerCase();
    if (token === wanted || token === `${wanted}:`) return tokens[i + 1] ?? null;
    if (token.startsWith(`${wanted}:`) || token.startsWith(`${wanted} `)) {
      const rest = tokens[i].slice(label.length).replace(/^[:\s]+/, '').trim();
      if (rest) return rest;
    }
  }
  return null;
}

function foodOrSupply(description: string, sectionFood: boolean): PapersLabeledField {
  if (LIQUOR_RE.test(description)) return categoryField('liquor');
  if (BEER_RE.test(description)) return categoryField('beer');
  if (SUPPLY_RE.test(description) || PACKAGING_RE.test(description)) return categoryField('other');
  if (sectionFood) return categoryField('food');
  return missingField();
}

function beverageCategory(description: string): PapersLabeledField {
  if (LIQUOR_RE.test(description)) return categoryField('liquor');
  if (BEER_RE.test(description)) return categoryField('beer');
  if (/unsorted|empty bottle/i.test(description)) return missingField();
  return textField('beer', 'Estimated', 'No liquor word on this distributor line.');
}

type Header = {
  vendor: PapersLabeledField;
  documentDate: PapersLabeledField;
  documentNumber: PapersLabeledField;
  isoWeek: string | null;
};

function makeRow(header: Header, input: {
  productName: string;
  itemCode?: string | null;
  quantity?: number | null;
  quantityRaw?: string;
  unit?: string | null;
  unitPrice?: number | null;
  extended?: number | null;
  category: PapersLabeledField;
  documentDate?: string | null;
}): PapersSkuRow {
  const dated = input.documentDate ? metaDate(input.documentDate) : {
    field: header.documentDate,
    isoWeek: header.isoWeek,
  };
  return {
    productName: verifiedText(input.productName),
    itemCode: input.itemCode ? verifiedText(input.itemCode) : missingField(),
    quantity: input.quantity == null ? missingField() : qtyField(input.quantity, input.quantityRaw ?? String(input.quantity)),
    unit: input.unit ? verifiedText(input.unit) : missingField(),
    unitPrice: input.unitPrice == null ? missingField() : priceField(input.unitPrice),
    extendedPrice: input.extended == null ? missingField() : priceField(input.extended),
    vendor: header.vendor,
    documentDate: dated.field,
    documentNumber: header.documentNumber,
    category: input.category,
    isoWeek: dated.isoWeek,
  };
}

function isPfgProduct(tokens: string[], index: number): boolean {
  return /^\d+$/.test(tokens[index] || '')
    && /^(CS|EA|BX|BG|CN)$/.test(tokens[index + 1] || '')
    && /\//.test(tokens[index + 2] || '');
}

function isPfgPrice(tokens: string[], index: number): boolean {
  return /^\d+$/.test(tokens[index] || '')
    && /^\d+$/.test(tokens[index + 1] || '')
    && /^(EA|OZ|LB|CS|CN)$/.test(tokens[index + 2] || '')
    && /^\d*\.\d+$/.test(tokens[index + 3] || '');
}

function parsePfg(tokens: string[], filename: string): PapersSkuRow[] | null {
  const named = tokens.some((token) => /performance|foodservice|^pfg$/i.test(token)) || /pfg|performance/i.test(filename);
  const shaped = tokens.includes('Delv') || tokens.includes('Date:');
  if (!named && !shaped) return null;
  if (!tokens.some((_, index) => isPfgProduct(tokens, index))) return null;
  const date = dateFromMdy(valueAfter(tokens, 'Date:') || tokens.find((token) => /^\d{2}\/\d{2}\/\d{2}$/.test(token)) || '');
  let invoice: string | null = null;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(tokens[i]) && /^\d{5,}$/.test(tokens[i + 1]) && tokens[i + 1] !== tokens[i]) {
      invoice = tokens[i + 1];
      break;
    }
  }
  const dated = metaDate(date);
  const header: Header = {
    vendor: named ? verifiedText('Performance Foodservice') : missingField(),
    documentDate: dated.field,
    documentNumber: invoice ? verifiedText(invoice) : missingField(),
    isoWeek: dated.isoWeek,
  };
  const rows: PapersSkuRow[] = [];
  let sectionFood = false;
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i] === 'DRY' || tokens[i] === 'DRYGOODS' || tokens[i] === 'FROZEN') sectionFood = true;
    if (rows.length && /^[A-Z]{2,12}$/.test(tokens[i] || '') && !['DRY', 'FROZEN', 'GOODS'].includes(tokens[i])) {
      const soon = [1, 2, 3].some((step) => isPfgProduct(tokens, i + step));
      if (soon) {
        const previous = rows[rows.length - 1];
        previous.productName = verifiedText(`${previous.productName.value} ${tokens[i]}`);
        i += 1;
        continue;
      }
    }
    if (!isPfgProduct(tokens, i)) {
      i += 1;
      continue;
    }
    const quantityRaw = tokens[i];
    const unit = tokens[i + 1];
    let pack = tokens[i + 2];
    let glued = '';
    const packMatch = pack.match(/^(\d+\/#?\d+|\d+\/\d+(?:\.\d+)?)([A-Z].*)$/);
    if (packMatch) {
      pack = packMatch[1];
      glued = packMatch[2];
    }
    i += 3;
    const desc: string[] = [];
    if (glued) desc.push(glued);
    let itemCode: string | null = null;
    while (i < tokens.length && !isPfgPrice(tokens, i) && !isPfgProduct(tokens, i)) {
      const token = tokens[i];
      if (!itemCode && /^[A-Z]{0,4}\d{2,}[A-Z0-9-]*$/.test(token) && !token.includes('/') && !token.includes('"')) {
        itemCode = token;
      } else {
        desc.push(token);
      }
      i += 1;
      if (desc.length > 24) break;
    }
    let unitPrice: number | null = null;
    let extended: number | null = null;
    if (isPfgPrice(tokens, i)) {
      unitPrice = looseDecimal(tokens[i + 3]);
      i += 4;
      if (tokens[i] === '**') i += 1;
      const inline = isDecimalToken(tokens[i]) ? tokens[i] : null;
      if (inline) i += 1;
      if (isMoneyToken(tokens[i])) {
        extended = looseDecimal(tokens[i]);
        i += 1;
      } else if (inline && isMoneyToken(inline)) {
        extended = looseDecimal(inline);
      }
    }
    const productName = [pack, ...desc].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (!productName && !itemCode) continue;
    rows.push(makeRow(header, {
      productName: productName || itemCode || 'line',
      itemCode,
      quantity: qtyToken(quantityRaw),
      quantityRaw,
      unit,
      unitPrice,
      extended,
      category: foodOrSupply(productName, sectionFood),
    }));
  }
  return rows.length ? rows : null;
}

function parseVestis(tokens: string[], filename: string): PapersSkuRow[] | null {
  const named = tokens.some((token) => /vestis/i.test(token)) || /vestis/i.test(filename);
  if (!named && !tokens.includes('BILL QTY')) return null;
  const start = tokens.findIndex((token, index) => token === 'BILL QTY' || (token === 'ITEM DESCRIPTION' && tokens[index + 1] === 'SIZE'));
  if (start < 0) return null;
  const date = dateFromMdy(valueAfter(tokens, 'INVOICE DATE') || '');
  const invoice = valueAfter(tokens, 'INVOICE NUMBER');
  const dated = metaDate(date);
  const header: Header = {
    vendor: verifiedText('Vestis'),
    documentDate: dated.field,
    documentNumber: invoice ? verifiedText(invoice) : missingField(),
    isoWeek: dated.isoWeek,
  };
  const types = new Set(['Rent', 'Wash', 'Sales']);
  const rows: PapersSkuRow[] = [];
  let i = start + 1;
  while (i < tokens.length) {
    if (/^(SUBTOTAL|FREIGHT|TAX|TOTAL|THANK|PAYMENT|INVOICE|SIGNATURE|DELIVERY)\b/i.test(tokens[i])) {
      i += 1;
      continue;
    }
    const code = tokens[i];
    if (/^[A-Z0-9]{6,}$/.test(code) && /\d/.test(code) && /[A-Z]/.test(code) && types.has(tokens[i + 3] || '')) {
      const qty = qtyToken(tokens[i + 4]);
      const rate = looseDecimal(tokens[i + 5]);
      const total = looseDecimal(tokens[i + 6]);
      if (qty == null || rate == null || total == null || !isMoneyToken(tokens[i + 6])) {
        i += 1;
        continue;
      }
      rows.push(makeRow(header, {
        productName: tokens[i + 1],
        itemCode: code,
        quantity: qty,
        quantityRaw: tokens[i + 4],
        unit: tokens[i + 2],
        unitPrice: rate,
        extended: total,
        category: categoryField('other'),
      }));
      i += 7;
      continue;
    }
    if (/[A-Za-z]/.test(code) && code.length <= 40 && isMoneyToken(tokens[i + 1]) && !types.has(code) && !/invoice|payment|signature|page|customer/i.test(code)) {
      rows.push(makeRow(header, {
        productName: code,
        extended: looseDecimal(tokens[i + 1]),
        category: categoryField('other'),
      }));
      i += 2;
      continue;
    }
    i += 1;
  }
  return rows.length ? rows : null;
}

function parseNorthern(tokens: string[], filename: string): PapersSkuRow[] | null {
  const named = tokens.some((token) => /northern lights/i.test(token)) || /northern/i.test(filename);
  if (!tokens.includes('Item #') || !tokens.includes('Extended')) return null;
  if (!named && !tokens.includes('Pack/Size')) return null;
  const date = dateFromMdy(valueAfter(tokens, 'Invoice Date') || '');
  const invoice = valueAfter(tokens, 'Invoice #');
  const dated = metaDate(date);
  const header: Header = {
    vendor: verifiedText('Northern Lights'),
    documentDate: dated.field,
    documentNumber: invoice ? verifiedText(invoice.replace(/\s+/g, ' ').trim()) : missingField(),
    isoWeek: dated.isoWeek,
  };
  const rows: PapersSkuRow[] = [];
  let sectionFood = false;
  let i = 0;
  while (i < tokens.length) {
    if (/DRY ITEMS|FROZEN ITEMS/i.test(tokens[i])) {
      sectionFood = true;
      i += 1;
      continue;
    }
    if (/sub-total|^total cases|^sales:/i.test(tokens[i])) {
      i += 1;
      continue;
    }
    if (/^\d{3,8}$/.test(tokens[i] || '') && /^\d{6,14}$/.test(tokens[i + 1] || '') && /[A-Za-z]/.test(tokens[i + 2] || '')) {
      const qty = qtyToken(tokens[i + 4]);
      const price = looseDecimal(tokens[i + 5]);
      const extended = looseDecimal(tokens[i + 6]);
      if (qty == null || price == null || extended == null) {
        i += 1;
        continue;
      }
      const description = tokens[i + 2];
      rows.push(makeRow(header, {
        productName: description,
        itemCode: tokens[i],
        quantity: qty,
        quantityRaw: tokens[i + 4],
        unit: tokens[i + 3],
        unitPrice: price,
        extended,
        category: foodOrSupply(description, sectionFood),
      }));
      i += 7;
      continue;
    }
    i += 1;
  }
  return rows.length ? rows : null;
}

function parseHumes(tokens: string[], filename: string): PapersSkuRow[] | null {
  const named = tokens.some((token) => /humes/i.test(token)) || /humes/i.test(filename);
  if (!tokens.includes('ITEM#') || !tokens.some((token) => token.startsWith('U.P.C'))) return null;
  if (!named && !tokens.some((token) => /^Invoice#/i.test(token))) return null;
  const date = dateFromMonthName(tokens.find((token) => /^[A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/.test(token)) || '');
  const invoice = (valueAfter(tokens, 'Invoice#') || '').replace(/:$/, '');
  const dated = metaDate(date);
  const header: Header = {
    vendor: verifiedText('Humes'),
    documentDate: dated.field,
    documentNumber: invoice ? verifiedText(invoice) : missingField(),
    isoWeek: dated.isoWeek,
  };
  const rows: PapersSkuRow[] = [];
  let i = tokens.findIndex((token) => token.startsWith('U.P.C')) + 1;
  while (i < tokens.length) {
    if (tokens[i] === 'Cases:' || tokens[i] === 'Total Sales' || tokens[i] === 'Invoice Total') break;
    if (/^\d{4,6}$/.test(tokens[i] || '') && /^-?\d+$/.test(tokens[i + 1] || '') && /[A-Za-z]/.test(tokens[i + 2] || '') && /^\d{8,14}$/.test(tokens[i + 3] || '')) {
      const qty = qtyToken(tokens[i + 1]);
      const price = looseDecimal(tokens[i + 4]);
      const extended = looseDecimal(tokens[i + 7]);
      if (qty == null || price == null || extended == null) {
        i += 1;
        continue;
      }
      let description = tokens[i + 2];
      const code = tokens[i];
      i += 8;
      while (i < tokens.length && !/^\d{4,6}$/.test(tokens[i]) && tokens[i] !== 'Cases:' && !/^-{5,}$/.test(tokens[i]) && !isDecimalToken(tokens[i]) && tokens[i].length < 24) {
        if (/[A-Za-z]/.test(tokens[i]) || /\d\/\d/.test(tokens[i])) {
          description = `${description} ${tokens[i].trim()}`;
          i += 1;
          continue;
        }
        break;
      }
      rows.push(makeRow(header, {
        productName: description.replace(/\s+/g, ' ').trim(),
        itemCode: code,
        quantity: qty,
        quantityRaw: String(qty),
        unitPrice: price,
        extended,
        category: beverageCategory(description),
      }));
      continue;
    }
    i += 1;
  }
  return rows.length ? rows : null;
}

function parsePdqZ(tokens: string[], filename: string): PapersSkuRow[] | null {
  const start = tokens.findIndex((token, index) => token === 'Menu Category'
    && tokens[index + 1] === 'Category Name'
    && tokens[index + 2] === 'QTY'
    && tokens[index + 3] === 'Total');
  if (start < 0) return null;
  const dateToken = tokens.find((token) => /^Business Date:\s*\d{1,2}\/\d{1,2}\/\d{4}$/.test(token));
  const date = dateFromMdy(dateToken?.replace(/^Business Date:\s*/, '') || '');
  const dated = metaDate(date);
  const pdqInText = tokens.some((token) => /\bpdq\b/i.test(token));
  const vendorNamed = pdqInText || /pdq/i.test(filename);
  const header: Header = {
    vendor: vendorNamed ? textField('PDQ', pdqInText ? 'Verified' : 'Estimated', vendorNamed && !pdqInText ? 'Name taken from the file name.' : null) : missingField(),
    documentDate: dated.field,
    documentNumber: missingField(),
    isoWeek: dated.isoWeek,
  };
  const rows: PapersSkuRow[] = [];
  let i = start + 4;
  while (i + 2 < tokens.length && tokens[i] !== 'Total:' && tokens[i] !== 'Total') {
    const qty = qtyToken(tokens[i + 1]);
    const extended = looseDecimal(tokens[i + 2]);
    if (qty == null || extended == null || !isMoneyToken(tokens[i + 2])) break;
    const name = tokens[i];
    const lowered = name.toLowerCase();
    let category = 'other';
    if (lowered === 'food' || lowered === 'large pizza') category = 'food';
    else if (lowered === 'pop') category = 'pop';
    else if (lowered === 'liquor') category = 'liquor';
    else if (lowered === 'beer') category = 'beer';
    rows.push(makeRow(header, {
      productName: name,
      quantity: qty,
      quantityRaw: tokens[i + 1],
      extended,
      category: categoryField(category),
    }));
    i += 3;
  }
  return rows.length ? rows : null;
}

function readShiftRow(tokens: string[], index: number): {
  advance: number;
  date: string;
  job: string;
  rate: number;
  shift: number;
  shiftRaw: string;
  regPay: number;
} | null {
  if (!isShiftDate(tokens[index]) || !/^\d+$/.test(tokens[index + 1] || '')) return null;
  let cursor = index + 2;
  if (/^\d+$/.test(tokens[cursor] || '')) cursor += 1;
  const job = tokens[cursor];
  const rateRaw = tokens[cursor + 1];
  const timeIn = tokens[cursor + 2] || '';
  const shiftRaw = tokens[cursor + 4];
  const regPayRaw = tokens[cursor + 6];
  const otHours = tokens[cursor + 7];
  const otPay = tokens[cursor + 8];
  if (!job || !/[A-Za-z]/.test(job) || !/\d:\d\d/.test(timeIn)) return null;
  const rate = looseDecimal(rateRaw);
  const shift = qtyToken(shiftRaw);
  const regPay = looseDecimal(regPayRaw);
  if (rate == null || shift == null || regPay == null) return null;
  if (!isMoneyToken(rateRaw) || !isMoneyToken(regPayRaw) || !isDecimalToken(otHours) || !isMoneyToken(otPay)) return null;
  return {
    advance: cursor + 9 - index,
    date: tokens[index],
    job,
    rate,
    shift,
    shiftRaw,
    regPay,
  };
}

function isPersonName(token: string | undefined): boolean {
  return Boolean(token && /^[A-Z][A-Za-z.'-]+, [A-Z]/.test(token));
}

function isShiftDate(token: string | undefined): boolean {
  return Boolean(token && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(token));
}

function parseTimeClock(tokens: string[], filename: string): PapersSkuRow[] | null {
  const header = tokens.findIndex((token, index) => token === 'Emp Name'
    && tokens.slice(index, index + 16).includes('Bus Date')
    && tokens.slice(index, index + 16).includes('Overtime Pay'));
  if (header < 0) return null;
  if (!tokens.some((token) => /time clock/i.test(token)) && !/time[- ]?clock/i.test(filename)) return null;
  const range = tokens.find((token) => /^Business Dates:/i.test(token));
  const headerDate = dateFromMdy(range || '');
  const dated = metaDate(headerDate);
  const headerMeta: Header = {
    vendor: (tokens.some((token) => /\bpdq\b/i.test(token)) || /pdq/i.test(filename))
      ? textField('PDQ', tokens.some((token) => /\bpdq\b/i.test(token)) ? 'Verified' : 'Estimated', tokens.some((token) => /\bpdq\b/i.test(token)) ? null : 'Name taken from the file name.')
      : missingField(),
    documentDate: dated.field,
    documentNumber: missingField(),
    isoWeek: dated.isoWeek,
  };
  const rows: PapersSkuRow[] = [];
  let i = tokens.indexOf('Overtime Pay', header) + 1;
  let lastName: string | null = null;
  while (i < tokens.length) {
    if (tokens[i] === 'Emp Name') {
      const next = tokens.indexOf('Overtime Pay', i);
      if (next < 0) break;
      i = next + 1;
      continue;
    }
    if (isPersonName(tokens[i]) && isShiftDate(tokens[i + 1])) {
      lastName = tokens[i];
      i += 1;
    }
    if (!lastName || !isShiftDate(tokens[i])) {
      i += 1;
      continue;
    }
    const shiftRow = readShiftRow(tokens, i);
    if (!shiftRow) {
      i += 1;
      continue;
    }
    const rowDate = dateFromMdy(shiftRow.date);
    rows.push(makeRow(headerMeta, {
      productName: `${lastName} · ${shiftRow.job}`,
      itemCode: shiftRow.job,
      quantity: shiftRow.shift,
      quantityRaw: shiftRow.shiftRaw,
      unit: 'hours',
      unitPrice: shiftRow.rate,
      extended: shiftRow.regPay,
      category: categoryField('labor'),
      documentDate: rowDate,
    }));
    i += shiftRow.advance;
  }
  return rows.length ? rows : null;
}

const DELIVERY_LABELS = new Set([
  'sales',
  'subtotal',
  'commission',
  'merchant fees',
  'marketing fees',
  'marketing spend',
  'commission & fees',
  'staff tips',
  'customer fees',
  'error charges',
  'adjustments',
  'net total',
  'net payout',
  'customer discounts funded by you',
  'customer discounts funded by doordash',
  'customer discounts funded by third party',
  'marketing credit',
  'third-party contribution',
]);

function deliveryLabel(token: string | undefined): string | null {
  if (!token) return null;
  const label = token.toLowerCase().replace(/\(\d+\)/g, '').replace(/\s+/g, ' ').trim();
  return DELIVERY_LABELS.has(label) ? label : null;
}

function parseDoorDash(tokens: string[], filename: string): PapersSkuRow[] | null {
  const named = tokens.some((token) => /doordash/i.test(token)) || /doordash/i.test(filename);
  if (!named) return null;
  if (!tokens.some((token) => token === 'Subtotal' || token === 'Net total' || token === 'Net payout')) return null;
  const stop = tokens.findIndex((token) => token === 'Payouts');
  const slice = tokens.slice(0, stop < 0 ? tokens.length : stop);
  const statement = slice.find((token) => /Statement #/i.test(token)) || tokens.find((token) => /Statement #/i.test(token));
  const number = statement?.match(/Statement #([A-Za-z0-9]+)/i)?.[1] ?? null;
  const period = statement?.match(/([A-Za-z]{3,9})\s+\d{1,2}\s*-\s*(\d{1,2}),\s*(\d{4})/);
  const endDate = period ? isoDate(Number(period[3]), MONTHS[period[1].toLowerCase()] || 0, Number(period[2])) : null;
  const dated = metaDate(endDate);
  const header: Header = {
    vendor: verifiedText('DoorDash'),
    documentDate: dated.field,
    documentNumber: number ? verifiedText(number) : missingField(),
    isoWeek: dated.isoWeek,
  };
  const seen = new Set<string>();
  const usedMoney = new Set<number>();
  const rows: PapersSkuRow[] = [];
  const pushLine = (label: string, money: string) => {
    if (seen.has(label)) return;
    const amount = looseDecimal(money);
    if (amount == null) return;
    seen.add(label);
    rows.push(makeRow(header, {
      productName: label.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      extended: amount,
      category: categoryField('other'),
    }));
  };
  const columnLabels = new Set(['sales', 'marketing spend', 'commission & fees']);
  for (let i = 0; i < slice.length - 1; i += 1) {
    const label = deliveryLabel(slice[i]);
    if (!label || columnLabels.has(label) || !isMoneyToken(slice[i + 1])) continue;
    if (label === 'net payout') {
      const netAt = slice.findIndex((token) => deliveryLabel(token) === 'net total');
      if (netAt < 0 || Math.abs(i - netAt) > 12) continue;
    }
    usedMoney.add(i + 1);
    pushLine(label, slice[i + 1]);
  }
  for (const label of columnLabels) {
    let at = -1;
    for (let i = 0; i < slice.length; i += 1) {
      if (deliveryLabel(slice[i]) === label) at = i;
    }
    if (at > 0 && isMoneyToken(slice[at - 1]) && !usedMoney.has(at - 1)) {
      pushLine(label, slice[at - 1]);
    }
  }
  return rows.length ? rows : null;
}
