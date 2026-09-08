/**
 * Toast report parse for the free-seat desk.
 *
 * Families: SalesSummary, LaborBreakDown, TimeEntries, ItemSelectionDetails.
 * Numbers come from the file only. Missing stays Missing. Derived day
 * totals from item rows are Estimated with the math shown.
 * Taco Bomba / related-not-nag sheets are training shapes only — off NAG Qs.
 * Never invent $. Never name staff. Never write a theft narrative.
 */

import { bool, findColumn, parseCsv } from '@/lib/csv/core';
import { isToastTrainingCorpusOnly } from '@/lib/reportAdapters/trainingCorpus';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';

export const TOAST_PARSE_PREFIX = 'toast-parse:v1:';

export type ToastFamily =
  | 'sales-summary'
  | 'labor-breakdown'
  | 'time-entries'
  | 'item-selection';

export type ToastVoidItem = {
  item: string;
  count: number;
};

export type ToastFactPack = {
  pos: 'toast';
  family: ToastFamily;
  filename: string;
  location?: string | null;
  corpus?: 'nag-seat' | 'training';
  businessDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  netSales: number | null;
  grossSales: number | null;
  laborCost: number | null;
  laborPctNet: number | null;
  laborPctGross: number | null;
  dayNetSales: Record<string, number>;
  voidLineCount: number | null;
  voidItems: ToastVoidItem[];
  itemDayNet: Record<string, number>;
  hours: number | null;
};

export type ToastSeatFacts = {
  packs: ToastFactPack[];
  hasToast: boolean;
  heldOffTraining: boolean;
  labor: ToastFactPack | null;
  salesDay: ToastFactPack | null;
  salesWeek: ToastFactPack | null;
  items: ToastFactPack | null;
  time: ToastFactPack | null;
};

export type ToastDeskKind = 'labor' | 'sales' | 'voids' | 'payables';

export type ToastDeskAnswer = {
  kind: ToastDeskKind;
  slug: string;
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  sourceTags: SourceTag[];
  verifiedClose: boolean;
  sampleDollars: 'none-verified' | 'toast-verified' | 'toast-estimated';
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function detectToastFamily(filename: string, text = ''): ToastFamily | null {
  if (/zreport_summary|hourly_sales_report|void_promo_report|\bpdq\b/i.test(filename)) {
    return null;
  }
  const hay = `${filename}\n${text.slice(0, 800)}`.toLowerCase();
  if (/sales[\s_-]*summary/.test(hay)) return 'sales-summary';
  if (/labor[\s_-]*break[\s_-]*down/.test(hay)) return 'labor-breakdown';
  if (/time[\s_-]*entries/.test(hay)) return 'time-entries';
  if (/item[\s_-]*selection[\s_-]*details/.test(hay)) return 'item-selection';
  if (/\bvoid\s*\?/.test(hay) && /sent\s*date/.test(hay) && /menu\s*item/.test(hay)) {
    return 'item-selection';
  }
  if (/labor\s*%/.test(hay) && /labor\s*cost/.test(hay) && /net\s*sales/.test(hay)) {
    return 'labor-breakdown';
  }
  return null;
}

export function datesFromFilename(filename: string): { start: string | null; end: string | null } {
  const base = filename.trim().split(/[/\\]/).pop() || filename;
  const matches = [...base.matchAll(/(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
  if (matches.length >= 2) return { start: matches[0], end: matches[1] };
  if (matches.length === 1) return { start: matches[0], end: matches[0] };
  return { start: null, end: null };
}

export function toIsoDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const us = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!us) return null;
  const month = Number(us[1]);
  const day = Number(us[2]);
  let year = Number(us[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseMoneyCell(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '').replace(/%$/, '');
  if (!cleaned || cleaned === '-' || cleaned === '—') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? round2(n) : null;
}

export function parsePercentCell(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const hadPct = /%/.test(text);
  const n = parseMoneyCell(text);
  if (n == null) return null;
  if (hadPct || n > 1) return round2(n);
  return round2(n * 100);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function usd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function decodeToastText(bytes: Uint8Array): string | null {
  if (bytes.byteLength === 0) return null;
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return null; // xlsx zip
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return null;
  const text = new TextDecoder('utf-8').decode(bytes);
  if (!text.trim()) return null;
  return text;
}

function emptyPack(family: ToastFamily, filename: string): ToastFactPack {
  const dates = datesFromFilename(filename);
  return {
    pos: 'toast',
    family,
    filename,
    location: null,
    corpus: 'nag-seat',
    businessDate: dates.start && dates.end && dates.start === dates.end ? dates.start : null,
    periodStart: dates.start,
    periodEnd: dates.end,
    netSales: null,
    grossSales: null,
    laborCost: null,
    laborPctNet: null,
    laborPctGross: null,
    dayNetSales: {},
    voidLineCount: null,
    voidItems: [],
    itemDayNet: {},
    hours: null,
  };
}

function sliceFromHeader(text: string): string {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const idx = lines.findIndex((line) => {
    const n = line.toLowerCase();
    return (
      n.includes('net sales')
      || n.includes('labor cost')
      || n.includes('sent date')
      || n.includes('menu item')
      || n.includes('void?')
      || n.includes('total hours')
      || n.includes('gross sales')
    );
  });
  if (idx <= 0) return text;
  return lines.slice(idx).join('\n');
}

function look(headers: string[], aliases: string[], negative: string[] = []): number {
  return findColumn(headers, aliases, negative);
}

const NOT_A_RATE = ['labor', 'percent', 'pct', 'rate'];

function labelValueMap(rows: string[][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.length < 2) continue;
    const key = row[0]?.trim().toLowerCase();
    const value = row[1]?.trim();
    if (key && value) map.set(key, value);
  }
  return map;
}

function pickLabel(map: Map<string, string>, ...needles: string[]): string | undefined {
  for (const needle of needles) {
    for (const [key, value] of map) {
      if (key === needle) return value;
    }
  }
  for (const needle of needles) {
    for (const [key, value] of map) {
      if (!key.includes(needle)) continue;
      if (needle === 'net sales' && (key.includes('%') || key.includes('labor'))) continue;
      if (needle === 'gross sales' && (key.includes('%') || key.includes('labor'))) continue;
      return value;
    }
  }
  return undefined;
}

function parseTable(text: string): { headers: string[]; rows: string[][] } {
  return parseCsv(sliceFromHeader(text));
}

function fillLaborFromMap(pack: ToastFactPack, map: Map<string, string>): void {
  pack.laborCost = parseMoneyCell(pickLabel(map, 'labor cost', 'total labor'));
  pack.netSales = parseMoneyCell(pickLabel(map, 'net sales'));
  pack.grossSales = parseMoneyCell(pickLabel(map, 'gross sales', 'total sales'));
  pack.laborPctNet = parsePercentCell(pickLabel(map, 'labor % of net', 'labor % net', 'labor percent net'));
  pack.laborPctGross = parsePercentCell(pickLabel(map, 'labor % of gross', 'labor % gross'));
  if (pack.laborPctNet == null && pack.laborCost != null && pack.netSales && pack.netSales > 0) {
    pack.laborPctNet = round2((pack.laborCost / pack.netSales) * 100);
  }
  if (pack.laborPctGross == null && pack.laborCost != null && pack.grossSales && pack.grossSales > 0) {
    pack.laborPctGross = round2((pack.laborCost / pack.grossSales) * 100);
  }
}

function parseLaborBreakdown(text: string, filename: string): ToastFactPack {
  const pack = emptyPack('labor-breakdown', filename);
  const { headers, rows } = parseTable(text);
  const dateIdx = look(headers, ['date', 'business date']);
  const netIdx = look(headers, ['net sales'], NOT_A_RATE);
  const grossIdx = look(headers, ['gross sales', 'total sales'], NOT_A_RATE);
  const laborIdx = look(headers, ['labor cost', 'total labor'], ['percent', 'pct']);
  const pctNetIdx = look(headers, ['labor % of net sales', 'labor % net', 'labor percent of net']);
  const pctGrossIdx = look(headers, ['labor % of gross sales', 'labor % gross']);

  if (laborIdx >= 0 || (netIdx >= 0 && headers.some((h) => /labor/i.test(h)))) {
    for (const row of rows) {
      const date = toIsoDate(dateIdx >= 0 ? row[dateIdx] : null) || pack.businessDate;
      const net = netIdx >= 0 ? parseMoneyCell(row[netIdx]) : null;
      const gross = grossIdx >= 0 ? parseMoneyCell(row[grossIdx]) : null;
      const labor = laborIdx >= 0 ? parseMoneyCell(row[laborIdx]) : null;
      if (date && net != null) pack.dayNetSales[date] = round2((pack.dayNetSales[date] ?? 0) + net);
      if (labor != null) pack.laborCost = round2((pack.laborCost ?? 0) + labor);
      if (net != null) pack.netSales = round2((pack.netSales ?? 0) + net);
      if (gross != null) pack.grossSales = round2((pack.grossSales ?? 0) + gross);
      if (pctNetIdx >= 0 && pack.laborPctNet == null) pack.laborPctNet = parsePercentCell(row[pctNetIdx]);
      if (pctGrossIdx >= 0 && pack.laborPctGross == null) pack.laborPctGross = parsePercentCell(row[pctGrossIdx]);
    }
  } else {
    fillLaborFromMap(pack, labelValueMap([[...headers], ...rows]));
    if (pack.laborCost == null) fillLaborFromMap(pack, labelValueMap(parseCsv(text).rows));
  }

  if (pack.laborPctNet == null && pack.laborCost != null && pack.netSales && pack.netSales > 0) {
    pack.laborPctNet = round2((pack.laborCost / pack.netSales) * 100);
  }
  if (pack.laborPctGross == null && pack.laborCost != null && pack.grossSales && pack.grossSales > 0) {
    pack.laborPctGross = round2((pack.laborCost / pack.grossSales) * 100);
  }
  const days = Object.keys(pack.dayNetSales).sort();
  if (!pack.businessDate && days.length === 1) pack.businessDate = days[0];
  if (!pack.periodStart && days.length) pack.periodStart = days[0];
  if (!pack.periodEnd && days.length) pack.periodEnd = days[days.length - 1];
  return pack;
}

function parseSalesSummary(text: string, filename: string): ToastFactPack {
  const pack = emptyPack('sales-summary', filename);
  const { headers, rows } = parseTable(text);
  const dateIdx = look(headers, ['date', 'business date'], ['start', 'end', 'period']);
  const startIdx = look(headers, ['start date', 'period start']);
  const endIdx = look(headers, ['end date', 'period end']);
  const netIdx = look(headers, ['net sales'], NOT_A_RATE);
  const grossIdx = look(headers, ['gross sales', 'total sales'], NOT_A_RATE);

  if (netIdx >= 0) {
    for (const row of rows) {
      const day = toIsoDate(dateIdx >= 0 ? row[dateIdx] : null);
      const start = toIsoDate(startIdx >= 0 ? row[startIdx] : null);
      const end = toIsoDate(endIdx >= 0 ? row[endIdx] : null);
      const net = parseMoneyCell(row[netIdx]);
      const gross = grossIdx >= 0 ? parseMoneyCell(row[grossIdx]) : null;
      if (net == null) continue;
      pack.netSales = round2((pack.netSales ?? 0) + net);
      if (gross != null) pack.grossSales = round2((pack.grossSales ?? 0) + gross);
      if (day) pack.dayNetSales[day] = round2((pack.dayNetSales[day] ?? 0) + net);
      if (start && (!pack.periodStart || start < pack.periodStart)) pack.periodStart = start;
      if (end && (!pack.periodEnd || end > pack.periodEnd)) pack.periodEnd = end;
    }
  } else {
    const map = labelValueMap([[...headers], ...rows]);
    pack.netSales = parseMoneyCell(pickLabel(map, 'net sales'));
    pack.grossSales = parseMoneyCell(pickLabel(map, 'gross sales', 'total sales'));
  }

  const days = Object.keys(pack.dayNetSales).sort();
  if (days.length === 1) {
    pack.businessDate = days[0];
    pack.periodStart = pack.periodStart ?? days[0];
    pack.periodEnd = pack.periodEnd ?? days[0];
  } else if (days.length > 1) {
    pack.periodStart = pack.periodStart ?? days[0];
    pack.periodEnd = pack.periodEnd ?? days[days.length - 1];
    pack.businessDate = null;
  } else if (pack.periodStart && pack.periodEnd && pack.periodStart === pack.periodEnd) {
    pack.businessDate = pack.periodStart;
  }
  return pack;
}

function parseTimeEntries(text: string, filename: string): ToastFactPack {
  const pack = emptyPack('time-entries', filename);
  const { headers, rows } = parseTable(text);
  const hoursIdx = look(headers, ['total hours', 'payable hours', 'hours']);
  const inIdx = look(headers, ['in date', 'clock in', 'time in']);
  if (hoursIdx < 0) return pack;
  let hours = 0;
  for (const row of rows) {
    const h = parseMoneyCell(row[hoursIdx]);
    if (h != null) hours += h;
    const day = toIsoDate(inIdx >= 0 ? row[inIdx] : null);
    if (day) {
      pack.periodStart = pack.periodStart && pack.periodStart < day ? pack.periodStart : day;
      pack.periodEnd = pack.periodEnd && pack.periodEnd > day ? pack.periodEnd : day;
    }
  }
  pack.hours = round2(hours);
  if (pack.periodStart && pack.periodEnd && pack.periodStart === pack.periodEnd) {
    pack.businessDate = pack.periodStart;
  }
  return pack;
}

function parseItemSelection(text: string, filename: string): ToastFactPack {
  const pack = emptyPack('item-selection', filename);
  const { headers, rows } = parseTable(text);
  const sentIdx = look(headers, ['sent date', 'order date']);
  const itemIdx = look(headers, ['menu item', 'item name', 'item'], ['id', 'selection']);
  const netIdx = look(headers, ['net price', 'item net', 'net sales']);
  const voidIdx = look(headers, ['void?', 'void'], ['reason']);
  if (itemIdx < 0 && voidIdx < 0) return pack;

  const voidCounts = new Map<string, number>();
  let voidLines = 0;
  for (const row of rows) {
    if (row.every((cell) => !cell?.trim())) continue;
    const voided = voidIdx >= 0 ? bool(row[voidIdx]) : false;
    const day = toIsoDate(sentIdx >= 0 ? row[sentIdx] : null);
    const item = (itemIdx >= 0 ? row[itemIdx] : '')?.trim() || 'Unnamed item';
    const net = netIdx >= 0 ? parseMoneyCell(row[netIdx]) : null;
    if (voided) {
      voidLines += 1;
      voidCounts.set(item, (voidCounts.get(item) ?? 0) + 1);
      continue;
    }
    if (day && net != null) {
      pack.itemDayNet[day] = round2((pack.itemDayNet[day] ?? 0) + net);
    }
  }
  pack.voidLineCount = voidLines;
  pack.voidItems = [...voidCounts.entries()]
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item));
  const days = Object.keys(pack.itemDayNet).sort();
  if (days.length) {
    pack.periodStart = pack.periodStart ?? days[0];
    pack.periodEnd = pack.periodEnd ?? days[days.length - 1];
  }
  return pack;
}

function locationFromPreamble(text: string): string | null {
  const head = text.slice(0, 2500);
  if (/(?:--\s*)?(?:the\s+)?new american grill|max grill/i.test(head)) {
    return 'New American Grill';
  }
  return null;
}

function stampTrainingCorpus(pack: ToastFactPack, text: string, filename: string): ToastFactPack {
  const { headers, rows } = parseTable(text);
  const locIdx = look(headers, ['location', 'restaurant name', 'restaurant'], ['id', 'guid']);
  if (locIdx >= 0) {
    for (const row of rows) {
      const loc = row[locIdx]?.trim();
      if (loc) {
        pack.location = loc;
        break;
      }
    }
  }
  if (!pack.location) {
    const map = labelValueMap([[...headers], ...rows]);
    pack.location = pickLabel(map, 'location', 'restaurant') ?? null;
  }
  if (!pack.location || /^(unit|store|location)\s*[a-z0-9-]*$/i.test(pack.location)) {
    pack.location = locationFromPreamble(`${filename}\n${text}`) ?? pack.location;
  }
  const hay = `${filename}\n${pack.filename}\n${pack.location ?? ''}\n${text.slice(0, 2500)}`;
  pack.corpus = isToastTrainingCorpusOnly(hay) ? 'training' : 'nag-seat';
  return pack;
}

export function parseToastReport(text: string, filename: string): ToastFactPack | null {
  const family = detectToastFamily(filename, text);
  if (!family) return null;
  const pack =
    family === 'labor-breakdown'
      ? parseLaborBreakdown(text, filename)
      : family === 'sales-summary'
        ? parseSalesSummary(text, filename)
        : family === 'time-entries'
          ? parseTimeEntries(text, filename)
          : parseItemSelection(text, filename);
  return stampTrainingCorpus(pack, text, filename);
}

function isHeldOffTrainingPack(
  pack: ToastFactPack,
  uploadFilename: string,
): boolean {
  if (pack.corpus === 'training') return true;
  return isToastTrainingCorpusOnly(`${uploadFilename}\n${pack.filename}\n${pack.location ?? ''}`);
}

export function toastSourceTags(filename: string, bytes: Uint8Array): SourceTag[] {
  const family = detectToastFamily(filename);
  if (!family) return [];
  const short: SourceTag = {
    tag: 'unverified',
    source: `toast:${family}:${filename.trim() || 'upload'}`,
  };
  const text = decodeToastText(bytes);
  if (!text) {
    return [short, { tag: 'unverified', source: `toast-parse:unreadable:${family}` }];
  }
  const pack = parseToastReport(text, filename);
  if (!pack) return [short];
  const hasNumber =
    pack.netSales != null
    || pack.laborCost != null
    || pack.voidLineCount != null
    || pack.hours != null
    || Object.keys(pack.itemDayNet).length > 0
    || Object.keys(pack.dayNetSales).length > 0;
  return [
    { tag: hasNumber ? 'verified' : 'unverified', source: `toast:${family}:${pack.businessDate || pack.periodStart || filename}` },
    { tag: hasNumber ? 'verified' : 'unverified', source: `${TOAST_PARSE_PREFIX}${JSON.stringify(pack)}` },
  ];
}

export function packFromSourceTag(tag: SourceTag): ToastFactPack | null {
  if (!tag.source.startsWith(TOAST_PARSE_PREFIX)) return null;
  try {
    return JSON.parse(tag.source.slice(TOAST_PARSE_PREFIX.length)) as ToastFactPack;
  } catch {
    return null;
  }
}

export function collectToastFacts(
  uploads: readonly { filename: string; sourceTags?: readonly SourceTag[] }[],
): ToastSeatFacts {
  const packs: ToastFactPack[] = [];
  let hasToast = false;
  let heldOffTraining = false;
  for (const upload of uploads) {
    const nameHeld = isToastTrainingCorpusOnly(upload.filename);
    const confidence = (upload.sourceTags ?? []).some((tag) => (
      (tag.tag === 'verified' || tag.tag === 'estimated')
      && (tag.source.startsWith('toast:') || tag.source.startsWith(TOAST_PARSE_PREFIX))
    ));
    if (detectToastFamily(upload.filename) || confidence) {
      if (nameHeld) heldOffTraining = true;
      else hasToast = true;
    } else if (nameHeld) {
      heldOffTraining = true;
    }
    for (const tag of upload.sourceTags ?? []) {
      const pack = packFromSourceTag(tag);
      if (!pack) continue;
      if (isHeldOffTrainingPack(pack, upload.filename)) {
        heldOffTraining = true;
        continue;
      }
      packs.push(pack);
      hasToast = true;
    }
  }
  if (heldOffTraining && !hasToast) hasToast = true;
  const labor = packs.find((p) => p.family === 'labor-breakdown' && p.laborCost != null) ?? null;
  const salesPacks = packs.filter((p) => p.family === 'sales-summary' && p.netSales != null);
  const salesDay =
    salesPacks.find((p) => p.businessDate && Object.keys(p.dayNetSales).length <= 1)
    ?? salesPacks.find((p) => Object.keys(p.dayNetSales).length === 1)
    ?? null;
  const salesWeek =
    salesPacks.find((p) => {
      const start = p.periodStart;
      const end = p.periodEnd;
      return Boolean(start && end && start !== end);
    })
    ?? salesPacks.find((p) => Object.keys(p.dayNetSales).length > 1)
    ?? null;
  const items = packs.find((p) => p.family === 'item-selection') ?? null;
  const time = packs.find((p) => p.family === 'time-entries') ?? null;
  return { packs, hasToast, heldOffTraining, labor, salesDay, salesWeek, items, time };
}

export function routeToastDeskQuestion(question: string): ToastDeskKind | null {
  const q = question.toLowerCase().replace(/[^a-z0-9\s/%-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return null;
  if (/\b(payables?|accounts payable|\bap\b|30\s*\/?\s*60\s*\/?\s*90|aging)\b/.test(q)) return 'payables';
  if (/\bvoids?\b|\bvoided\b/.test(q)) return 'voids';
  if (/\blabor\b|\blabor\s*%|\blabor percent|\blabor cost/.test(q)) return 'labor';
  if (
    /\bnet sales\b|\btotal net\b|\bsales\b|\bstrongest day\b|\bbusiest day\b|\bweek\b|\bweekly\b/.test(q)
  ) {
    return 'sales';
  }
  return null;
}

function strongestDay(
  map: Record<string, number>,
): { date: string; amount: number } | null {
  let best: { date: string; amount: number } | null = null;
  for (const [date, amount] of Object.entries(map)) {
    if (!best || amount > best.amount) best = { date, amount };
  }
  return best;
}

function formatDay(iso: string): string {
  if (!ISO.test(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function answerToastDeskQuestion(
  question: string,
  facts: ToastSeatFacts,
): ToastDeskAnswer | null {
  const kind = routeToastDeskQuestion(question);
  if (!kind) return null;
  if (kind === 'payables') return payablesMissing(facts);
  if (kind === 'labor') return laborAnswer(facts);
  if (kind === 'sales') return salesAnswer(facts);
  return voidsAnswer(facts);
}

function trainingHoldOffLine(facts: ToastSeatFacts): string | null {
  if (!facts.heldOffTraining) return null;
  return 'A Toast-shaped training-corpus file is on this seat and is not used for NAG answers.';
}

function payablesMissing(facts: ToastSeatFacts): ToastDeskAnswer {
  return {
    kind: 'payables',
    slug: 'boh-invoice',
    headline: 'Missing — no AP / payables file on this seat.',
    facts: [
      '30 / 60 / 90 payables stay Missing Evidence. No accounts-payable aging, bill, or Ottimate/xtraCHEF AP export is on this seat.',
      'A Toast sales or labor file is not an AP file. Invoice ≠ COGS. Payables ≠ POS.',
      facts.hasToast
        ? 'Toast reports on this seat do not unlock payables.'
        : 'No payable paper is stored for this seat.',
    ],
    coachTomorrow: 'Drop an AP aging or unpaid-bills export if you want 30 / 60 / 90. Do not invent a balance.',
    needs: 'Missing: AP aging or unpaid bills (30/60/90). Not a Toast SalesSummary or LaborBreakDown.',
    sourceTags: [{ tag: 'unverified', source: 'toast-desk:payables:missing' }],
    verifiedClose: false,
    sampleDollars: 'none-verified',
  };
}

function laborAnswer(facts: ToastSeatFacts): ToastDeskAnswer {
  const labor = facts.labor;
  if (!labor || labor.laborCost == null || labor.netSales == null || labor.laborPctNet == null) {
    return {
      kind: 'labor',
      slug: 'schedule-labor',
      headline: 'Missing — LaborBreakDown is not on this seat (or did not parse).',
      facts: [
        'Labor $ and labor % stay Missing Evidence until a Toast LaborBreakDown for the asked day lands.',
        facts.time?.hours != null
          ? `TimeEntries hours are on the seat (${laborHoursLine(facts.time)}). Hours are not labor cost. No wage invented.`
          : 'TimeEntries is not a substitute for LaborBreakDown labor cost.',
        'No dollar invented.',
        ...(trainingHoldOffLine(facts) ? [trainingHoldOffLine(facts)!] : []),
      ],
      coachTomorrow: 'Upload LaborBreakDown for the same store and business date. I will cite the report totals only.',
      needs: 'Toast LaborBreakDown (labor cost, labor % of net, net sales) for the asked day.',
      sourceTags: [{ tag: 'unverified', source: 'toast-desk:labor:missing' }],
      verifiedClose: false,
      sampleDollars: 'none-verified',
    };
  }

  const day = labor.businessDate || labor.periodStart;
  const factsOut = [
    `Verified · ${labor.filename}${day ? ` · ${formatDay(day)}` : ''}`,
    `Labor cost ${usd(labor.laborCost)}`,
    `Labor % of net ${labor.laborPctNet}`,
    `Net sales ${usd(labor.netSales)}`,
  ];
  if (labor.grossSales != null) factsOut.push(`Gross sales ${usd(labor.grossSales)} (optional)`);
  if (labor.laborPctGross != null) factsOut.push(`Labor % of gross ${labor.laborPctGross} (optional)`);
  factsOut.push(`Source tag: toast:labor-breakdown:${day || labor.filename}`);
  if (labor.laborCost != null && labor.netSales > 0) {
    factsOut.push(
      `Math check: ${usd(labor.laborCost)} ÷ ${usd(labor.netSales)} × 100 = ${round2((labor.laborCost / labor.netSales) * 100)}`,
    );
  }

  return {
    kind: 'labor',
    slug: 'schedule-labor',
    headline: `Verified labor ${usd(labor.laborCost)} · ${labor.laborPctNet}% of net`,
    facts: factsOut,
    coachTomorrow: 'Keep the matching SalesSummary if you want the same-day sales rail next to labor.',
    needs: 'LaborBreakDown is on this seat. No extra paper for this ask.',
    sourceTags: [
      { tag: 'verified', source: `toast:labor-breakdown:${day || labor.filename}` },
    ],
    verifiedClose: true,
    sampleDollars: 'toast-verified',
  };
}

function laborHoursLine(time: ToastFactPack): string {
  return `${time.hours} hours from ${time.filename}`;
}

function salesAnswer(facts: ToastSeatFacts): ToastDeskAnswer {
  const dayPack = facts.salesDay;
  const weekPack = facts.salesWeek;
  const laborNet = facts.labor?.netSales != null && facts.labor.businessDate
    ? facts.labor
    : null;
  const dayNet = dayPack?.netSales ?? (dayPack && dayPack.businessDate
    ? dayPack.dayNetSales[dayPack.businessDate]
    : null) ?? laborNet?.netSales ?? null;
  const dayDate = dayPack?.businessDate ?? laborNet?.businessDate ?? null;
  const daySource = dayPack
    ? dayPack.filename
    : laborNet
      ? laborNet.filename
      : null;

  const weekNet = weekPack?.netSales ?? null;
  const weekLabel = weekPack?.periodStart && weekPack.periodEnd
    ? `${formatDay(weekPack.periodStart)}–${formatDay(weekPack.periodEnd)}`
    : null;

  const weekDays = weekPack?.dayNetSales ?? {};
  const verifiedStrongest = strongestDay(weekDays);
  const itemDays = facts.items?.itemDayNet ?? {};
  const filteredItemDays = weekPack?.periodStart && weekPack.periodEnd
    ? Object.fromEntries(
        Object.entries(itemDays).filter(([date]) => inRange(date, weekPack.periodStart!, weekPack.periodEnd!)),
      )
    : itemDays;
  const estimatedStrongest = strongestDay(filteredItemDays);

  const factsOut: string[] = [];
  let verifiedClose = false;
  let sampleDollars: ToastDeskAnswer['sampleDollars'] = 'none-verified';

  if (dayNet != null && dayDate && daySource) {
    factsOut.push(`Verified · ${daySource} · ${formatDay(dayDate)} net sales ${usd(dayNet)}`);
    verifiedClose = true;
    sampleDollars = 'toast-verified';
  } else {
    factsOut.push('Day net sales stay Missing until a SalesSummary day row (or LaborBreakDown net sales for that day) is on this seat.');
  }

  if (weekNet != null && weekPack && weekLabel) {
    factsOut.push(`Verified · ${weekPack.filename} · ${weekLabel} net sales ${usd(weekNet)}`);
    verifiedClose = true;
    sampleDollars = 'toast-verified';
  } else {
    factsOut.push('Week net sales stay Missing until a SalesSummary covering the asked week lands.');
  }

  if (verifiedStrongest) {
    factsOut.push(
      `Verified strongest day · SalesSummary day rows · ${formatDay(verifiedStrongest.date)} ${usd(verifiedStrongest.amount)}`,
    );
    verifiedClose = true;
    sampleDollars = 'toast-verified';
  } else if (estimatedStrongest && facts.items) {
    const parts = Object.entries(filteredItemDays)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => `${formatDay(date)} ${usd(amount)}`);
    factsOut.push(
      `Estimated strongest day · ${facts.items.filename} · sum(Net Price) where Void?=false by Sent Date. Highest ${formatDay(estimatedStrongest.date)} ${usd(estimatedStrongest.amount)}.`,
    );
    factsOut.push(`Math: ${parts.join('; ') || 'no non-void item nets in range'}.`);
    if (sampleDollars === 'none-verified') sampleDollars = 'toast-estimated';
  } else {
    factsOut.push(
      'Strongest day stays Missing. Desk needs SalesSummary day rows, or ItemSelectionDetails Sent Date nets to estimate. No day total invented.',
    );
  }

  if (!factsOut.some((line) => /Verified|Estimated/.test(line))) {
    const hold = trainingHoldOffLine(facts);
    return {
      kind: 'sales',
      slug: 'foh-voids',
      headline: 'Missing — no SalesSummary (and no item-day estimate) on this seat.',
      facts: hold ? [...factsOut, hold] : factsOut,
      coachTomorrow: 'Drop SalesSummary for the day and the week. ItemSelectionDetails can only Estimate a strongest day.',
      needs: 'Toast SalesSummary day and/or week. Optional ItemSelectionDetails for an Estimated strongest day.',
      sourceTags: [{ tag: 'unverified', source: 'toast-desk:sales:missing' }],
      verifiedClose: false,
      sampleDollars: 'none-verified',
    };
  }

  const headline = dayNet != null && dayDate
    ? `Verified net sales ${formatDay(dayDate)} ${usd(dayNet)}`
    : weekNet != null
      ? `Verified week net sales ${usd(weekNet)}`
      : estimatedStrongest
        ? `Estimated strongest day ${formatDay(estimatedStrongest.date)} ${usd(estimatedStrongest.amount)}`
        : 'Sales ask stored. Missing Evidence stays open.';

  return {
    kind: 'sales',
    slug: 'foh-voids',
    headline,
    facts: factsOut,
    coachTomorrow: 'Keep day and week SalesSummary together so strongest day can move from Estimated to Verified.',
    needs: weekNet != null && dayNet != null
      ? 'SalesSummary day + week are on this seat.'
      : 'Still NEED the missing SalesSummary period. ItemSelectionDetails is not a Verified day total.',
    sourceTags: [
      ...(daySource && dayDate ? [{ tag: 'verified' as const, source: `toast:sales-summary:${dayDate}` }] : []),
      ...(weekPack ? [{ tag: 'verified' as const, source: `toast:sales-summary:${weekPack.periodStart}-${weekPack.periodEnd}` }] : []),
      ...(!verifiedStrongest && estimatedStrongest
        ? [{ tag: 'estimated' as const, source: `toast:item-selection:sent-date-sum:${estimatedStrongest.date}` }]
        : []),
    ],
    verifiedClose,
    sampleDollars,
  };
}

function voidsAnswer(facts: ToastSeatFacts): ToastDeskAnswer {
  const items = facts.items;
  if (!items || items.voidLineCount == null) {
    return {
      kind: 'voids',
      slug: 'foh-voids',
      headline: 'Missing — ItemSelectionDetails with Void? is not on this seat.',
      facts: [
        'Void lines stay Missing Evidence.',
        facts.hasToast
          ? 'A Toast file is on this seat, but it is not ItemSelectionDetails. Do not invent a void count. Do not ask for a different POS void report when ItemSelectionDetails is the matching paper.'
          : 'No void report is stored. Toast ItemSelectionDetails (Void?=true) is the paper for a Toast seat.',
        'Line count only. No motive named.',
        ...(trainingHoldOffLine(facts) ? [trainingHoldOffLine(facts)!] : []),
      ],
      coachTomorrow: 'Upload ItemSelectionDetails for the asked dates. I will count Void?=true lines and list items only.',
      needs: 'Toast ItemSelectionDetails with a Void? column.',
      sourceTags: [{ tag: 'unverified', source: 'toast-desk:voids:missing' }],
      verifiedClose: false,
      sampleDollars: 'none-verified',
    };
  }

  const list = items.voidItems.length
    ? items.voidItems.map((row) => `${row.item} × ${row.count}`).join('; ')
    : 'no item names on the void rows';
  return {
    kind: 'voids',
    slug: 'foh-voids',
    headline: `Verified · ${items.voidLineCount} void lines`,
    facts: [
      `Verified · ${items.filename} · Void?=true → ${items.voidLineCount} lines`,
      `Items / counts: ${list}`,
      'This is a line count from the report. It does not name a person or a motive.',
    ],
    coachTomorrow: 'Review the void reasons on the same export if you want the next cut. Patterns are not verdicts.',
    needs: 'ItemSelectionDetails Void? is on this seat.',
    sourceTags: [{ tag: 'verified', source: `toast:item-selection:void:${items.voidLineCount}` }],
    verifiedClose: true,
    sampleDollars: 'toast-verified',
  };
}

export function isToastParseDisplayTag(tag: SourceTag): boolean {
  return tag.source.startsWith(TOAST_PARSE_PREFIX);
}
