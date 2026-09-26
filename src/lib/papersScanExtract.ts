/**
 * Pull structured fields off restaurant papers.
 * A number is Verified only when a label on that line names it.
 * A ~ / approx / [low] / (ocr) mark on that line is Estimated.
 * Anything else is Missing. Unlabeled dollars are ignored.
 */

import { classifyRestaurantPaper } from '@/lib/papersScanClassify';
import {
  amountField,
  emptyDelivery,
  formatPapersMoney,
  missingField,
  parsePapersMoney,
  textField,
  type PapersDeliveryFields,
  type PapersFieldHonesty,
  type PapersLabeledField,
  type PapersLineItem,
  type PapersScanCategory,
  type PapersScanRow,
  type PapersShift,
} from '@/lib/papersScanTypes';

const LOW_RE = /~|≈|approx|est\.|\[low\]|\(ocr\)|low\s*confidence/i;
const MONEY_SRC = String.raw`(~|≈|approx\.?|est\.?)?\s*(\(?\$?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?|\$?\s*-?\d+\.\d{2})`;

const BRANDS: Array<{ re: RegExp; label: string }> = [
  { re: /\bdoor\s*dash\b|\bdoordash\b/i, label: 'DoorDash' },
  { re: /\buber\s*eats\b|\bubereats\b/i, label: 'Uber Eats' },
  { re: /\bgrub\s*hub\b|\bgrubhub\b/i, label: 'Grubhub' },
  { re: /\bsysco\b/i, label: 'Sysco' },
  { re: /\bus\s*foods\b/i, label: 'US Foods' },
  { re: /\bperformance\s+food\b|\bpfg\b/i, label: 'PFG' },
];

export type PapersExtractDraft = Omit<
  PapersScanRow,
  'id' | 'dedupeKey' | 'source' | 'externalId' | 'contentHash' | 'confirmed' | 'fixture'
>;

function fieldAmount(
  amount: number,
  honesty: 'Verified' | 'Estimated',
  note: string | null,
): PapersLabeledField {
  return amountField(amount, honesty, note);
}

function findLabeledMoney(text: string, labels: RegExp[]): PapersLabeledField {
  const lines = text.split(/\r?\n/);
  for (const label of labels) {
    const re = new RegExp(`${label.source}\\s*[:#]?\\s*${MONEY_SRC}`, 'i');
    for (const line of lines) {
      if (/hours|qty|quantity|unit\s*price/i.test(line) && !/pay|sales|total|due|fee|gross|payout/i.test(line)) {
        continue;
      }
      const match = line.match(re);
      if (!match?.[2]) continue;
      const amount = parsePapersMoney(match[2]);
      if (amount == null) continue;
      const low = Boolean(match[1]) || LOW_RE.test(line);
      return fieldAmount(
        amount,
        low ? 'Estimated' : 'Verified',
        low ? 'Low-confidence read on the labeled line.' : null,
      );
    }
  }
  return missingField();
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

function parseDateToken(raw: string): string | null {
  const t = raw.trim();
  const ymd = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return isoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
  const mdy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdy) return isoDate(Number(mdy[3]), Number(mdy[1]), Number(mdy[2]));
  return null;
}

function extractDates(text: string, filename: string): PapersLabeledField {
  const labels = [
    /invoice\s*date/i,
    /business\s*date/i,
    /statement\s*period/i,
    /period/i,
    /week\s+of/i,
    /\bdate\b/i,
  ];
  const found: string[] = [];
  let low = false;
  for (const line of text.split(/\r?\n/)) {
    for (const label of labels) {
      const re = new RegExp(
        `${label.source}\\s*[:#]?\\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})(?:\\s*(?:to|-)\\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}))?`,
        'i',
      );
      const match = line.match(re);
      if (!match) continue;
      const start = parseDateToken(match[1]);
      const end = match[2] ? parseDateToken(match[2]) : null;
      if (!start) continue;
      if (LOW_RE.test(line)) low = true;
      found.push(end ? `${start} to ${end}` : start);
      break;
    }
  }
  if (found.length) {
    return textField([...new Set(found)].join(', '), low ? 'Estimated' : 'Verified', low ? 'Low-confidence date line.' : null);
  }
  const file = filename.match(/(\d{4}-\d{2}-\d{2})/) ?? filename.match(/(\d{1,2}-\d{1,2}-\d{4})/);
  const fromName = file ? parseDateToken(file[1]) : null;
  if (fromName) {
    return textField(fromName, 'Estimated', 'Date taken from the file name, not a date line.');
  }
  return missingField();
}

function cleanLabelValue(raw: string): string | null {
  const value = raw.replace(/\s{2,}/g, ' ').trim().replace(/[.,;]+$/, '');
  if (!value || value.length > 80 || value.includes('@') || /\$\d/.test(value)) return null;
  return value;
}

function extractVendor(text: string, filename: string, subject: string): PapersLabeledField {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:vendor|supplier|from)\s*[:#]\s*(.+)$/i);
    if (!match) continue;
    const value = cleanLabelValue(match[1]);
    if (!value) continue;
    const low = LOW_RE.test(line);
    return textField(value, low ? 'Estimated' : 'Verified', low ? 'Low-confidence vendor line.' : null);
  }
  const inText = text.trim() ? BRANDS.find((brand) => brand.re.test(`${text}\n${subject}`)) : undefined;
  if (inText) return textField(inText.label, 'Verified', null);
  const inName = BRANDS.find((brand) => brand.re.test(`${filename}\n${subject}`));
  if (inName) return textField(inName.label, 'Estimated', 'Name taken from the file name, not a vendor line.');
  return missingField();
}

function extractInvoiceNumber(text: string): PapersLabeledField {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:invoice\s*(?:number|#|no\.?)|inv\s*no\.?)\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9._-]{1,})/i);
    if (!match) continue;
    const low = LOW_RE.test(line);
    return textField(match[1], low ? 'Estimated' : 'Verified', low ? 'Low-confidence invoice number.' : null);
  }
  return missingField();
}

function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (ch === ',' && !quoted) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function headerIndex(headers: string[], names: string[]): number {
  const lowered = headers.map((cell) => cell.toLowerCase().replace(/[^a-z0-9]+/g, ''));
  for (const name of names) {
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const idx = lowered.indexOf(key);
    if (idx >= 0) return idx;
  }
  return -1;
}

function cellText(raw: string | undefined): PapersLabeledField {
  const value = raw?.trim() ?? '';
  if (!value) return missingField();
  return textField(value, 'Verified', null);
}

function cellNumber(raw: string | undefined): PapersLabeledField {
  const value = raw?.trim() ?? '';
  if (!value) return missingField();
  const low = LOW_RE.test(value);
  const cleaned = value.replace(/[~≈]/g, '').replace(/approx\.?|est\.?/gi, '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return missingField();
  return {
    honesty: low ? 'Estimated' : 'Verified',
    value: cleaned,
    amount: Number(cleaned),
    note: low ? 'Low-confidence quantity.' : null,
  };
}

function cellMoney(raw: string | undefined): PapersLabeledField {
  const value = raw?.trim() ?? '';
  if (!value) return missingField();
  const amount = parsePapersMoney(value.replace(/[~≈]/g, ' '));
  if (amount == null) return missingField();
  const low = LOW_RE.test(value);
  return fieldAmount(amount, low ? 'Estimated' : 'Verified', low ? 'Low-confidence unit price.' : null);
}

function extractLineItems(text: string): PapersLineItem[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headerAt = lines.findIndex((line) => /sku/i.test(line) && /price|qty|quantity|description/i.test(line));
  if (headerAt < 0) return [];
  const headers = splitCsv(lines[headerAt]);
  const skuIdx = headerIndex(headers, ['sku', 'item', 'itemcode', 'supc']);
  const descIdx = headerIndex(headers, ['description', 'desc', 'itemname']);
  const qtyIdx = headerIndex(headers, ['qty', 'quantity']);
  const priceIdx = headerIndex(headers, ['unitprice', 'price', 'caseprice']);
  if (skuIdx < 0 && priceIdx < 0) return [];
  const items: PapersLineItem[] = [];
  for (const line of lines.slice(headerAt + 1)) {
    if (/^(invoice|vendor|total|subtotal|amount)\b/i.test(line)) break;
    const cells = splitCsv(line);
    if (cells.every((cell) => !cell.trim())) continue;
    const item: PapersLineItem = {
      sku: skuIdx >= 0 ? cellText(cells[skuIdx]) : missingField(),
      description: descIdx >= 0 ? cellText(cells[descIdx]) : missingField(),
      quantity: qtyIdx >= 0 ? cellNumber(cells[qtyIdx]) : missingField(),
      unit: missingField(),
      unitPrice: priceIdx >= 0 ? cellMoney(cells[priceIdx]) : missingField(),
      extendedPrice: missingField(),
      category: missingField(),
    };
    if (item.sku.honesty === 'Missing' && item.unitPrice.honesty === 'Missing') continue;
    items.push(item);
  }
  return items;
}

function extractShifts(text: string): PapersShift[] {
  const shifts: PapersShift[] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/employee\s*[:#]\s*(.+?)\s+hours\s*[:#]?\s*(~|≈|approx\.?)?\s*(\d+(?:\.\d+)?)/i);
    if (!match) continue;
    const name = cleanLabelValue(match[1]);
    if (!name) continue;
    const low = Boolean(match[2]) || LOW_RE.test(line);
    const hours = Number(match[3]);
    if (!Number.isFinite(hours)) continue;
    shifts.push({
      employee: textField(name, 'Verified', null),
      hours: {
        honesty: low ? 'Estimated' : 'Verified',
        value: match[3],
        amount: hours,
        note: low ? 'Low-confidence hours line.' : null,
      },
    });
  }
  if (shifts.length) return shifts;

  const table = lines.map((line) => line.trim()).filter(Boolean);
  const headerAt = table.findIndex((line) => /(employee|name)/i.test(line) && /hours/i.test(line));
  if (headerAt < 0) return [];
  const headers = splitCsv(table[headerAt]);
  const nameIdx = headerIndex(headers, ['employee', 'name']);
  const hoursIdx = headerIndex(headers, ['hours']);
  if (nameIdx < 0 || hoursIdx < 0) return [];
  for (const line of table.slice(headerAt + 1)) {
    if (/^total\b/i.test(line)) break;
    const cells = splitCsv(line);
    const name = cleanLabelValue(cells[nameIdx] ?? '');
    if (!name) continue;
    const hoursRaw = cells[hoursIdx] ?? '';
    const low = LOW_RE.test(hoursRaw);
    const cleaned = hoursRaw.replace(/[~≈]/g, '').replace(/approx\.?|est\.?/gi, '').trim();
    const hours = /^\d+(?:\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
    shifts.push({
      employee: textField(name, 'Verified', null),
      hours: hours == null
        ? missingField()
        : {
          honesty: low ? 'Estimated' : 'Verified',
          value: cleaned,
          amount: hours,
          note: low ? 'Low-confidence hours cell.' : null,
        },
    });
  }
  return shifts;
}

function brandField(text: string, filename: string, subject: string): PapersLabeledField {
  if (text.trim()) {
    const inText = BRANDS.find((brand) => brand.re.test(text));
    if (inText) return textField(inText.label, 'Verified', null);
  }
  const inName = BRANDS.find((brand) => brand.re.test(`${filename}\n${subject}`));
  if (inName) return textField(inName.label, 'Estimated', 'Platform taken from the file name.');
  return missingField();
}

function extractDelivery(text: string, filename: string, subject: string): PapersDeliveryFields {
  const gross = findLabeledMoney(text, [/\bgross\s+sales\b/i, /\bgross\s+payout\b/i, /\bgross\b/i]);
  const fees = findLabeledMoney(text, [/\bmarketplace\s+fees?\b/i, /\bcommission\b/i, /\bfees?\b/i]);
  let net = findLabeledMoney(text, [/\bnet\s+payout\b/i, /\bnet\s+sales\b/i, /\bnet\b/i]);
  if (
    net.honesty === 'Missing'
    && gross.honesty === 'Verified'
    && fees.honesty === 'Verified'
    && gross.amount != null
    && fees.amount != null
  ) {
    const amount = Math.round((gross.amount - fees.amount) * 100) / 100;
    net = fieldAmount(
      amount,
      'Estimated',
      'Estimated from labeled gross minus labeled fees. The paper has no net line.',
    );
  }
  return {
    platform: brandField(text, filename, subject),
    gross,
    fees,
    net,
  };
}

function extractTotal(category: PapersScanCategory, text: string, delivery: PapersDeliveryFields): PapersLabeledField {
  if (category === 'delivery-app') {
    if (delivery.net.honesty === 'Missing') return missingField();
    return { ...delivery.net, note: delivery.net.note ?? 'Same figure as net payout.' };
  }
  if (category === 'menu-recipe') {
    return findLabeledMoney(text, [/\bplate\s*cost\b/i, /\bmenu\s*price\b/i]);
  }
  if (category === 'labor') {
    return findLabeledMoney(text, [/\bgross\s+pay\b/i, /\btotal\s+pay\b/i]);
  }
  return findLabeledMoney(text, [
    /\binvoice\s+total\b/i,
    /\bamount\s+due\b/i,
    /\bgrand\s+total\b/i,
    /\btotal\s+due\b/i,
    /\bnet\s+sales\b/i,
    /\btotal\s+sales\b/i,
    /^\s*total\b/i,
  ]);
}

export function extractRestaurantPaper(input: {
  filename: string;
  subject?: string;
  text: string;
  category: PapersScanCategory;
  categoryHonesty: PapersFieldHonesty;
}): PapersExtractDraft {
  const subject = input.subject ?? '';
  const delivery = input.category === 'delivery-app'
    ? extractDelivery(input.text, input.filename, subject)
    : emptyDelivery();
  const lineItems = input.category === 'vendor-invoice' || input.category === 'liquor-beer'
    ? extractLineItems(input.text)
    : [];
  const shifts = input.category === 'labor' ? extractShifts(input.text) : [];
  return {
    filename: input.filename,
    subject,
    category: input.category,
    categoryHonesty: input.categoryHonesty,
    vendorName: extractVendor(input.text, input.filename, subject),
    invoiceNumber: extractInvoiceNumber(input.text),
    dates: extractDates(input.text, input.filename),
    total: extractTotal(input.category, input.text, delivery),
    lineItems,
    isoWeek: null,
    shifts,
    delivery,
    note: 'Read from the paper text. Unlabeled numbers stay Missing.',
  };
}

export function draftFromCandidateText(input: {
  filename: string;
  subject?: string;
  text: string;
}): PapersExtractDraft | null {
  const classified = classifyRestaurantPaper(input);
  if (!classified.category) return null;
  return extractRestaurantPaper({
    filename: input.filename,
    subject: input.subject,
    text: input.text,
    category: classified.category,
    categoryHonesty: classified.honesty,
  });
}

export function papersMoneyOrMissing(field: PapersLabeledField): string {
  if (field.honesty === 'Missing' || field.amount == null) return 'Missing';
  return formatPapersMoney(field.amount);
}
