/**
 * PDQ end-of-day native-text parser for Monday gate (#118).
 *
 * Contract (issue #118):
 * - Filename `M-D-YYYY ...` is the business date.
 * - ZReport_Summary → net sales + food / beer / liquor / pop (wine extra if present).
 * - Hourly_Sales_Report → hour + sales + guests.
 * - Void_Promo_Report → void dollars.
 * - Missing category = Missing Evidence, not $0.
 * - $0 cash field = unentered POS, not a shortage.
 *
 * Fixtures are synthetic. Do not commit live restaurant totals or staff names.
 * CoS lock: Large Pizzas ≠ Food even if Pulse rolls them together.
 * POS payouts stay untrusted until a receipt match. Primary ingest is
 * the fuller EOD inbox.
 */

import { detectPdqIngestLane } from '@/lib/pdqIngest';

export type EvidenceState =
  | 'verified'
  | 'reconciled'
  | 'partial'
  | 'estimated'
  | 'unverified'
  | 'missing-evidence';

export type PdqReportFamily = 'z-summary' | 'hourly' | 'void-promo' | 'unknown';

export type MoneyEvidence = {
  value: number | null;
  state: EvidenceState;
  sourceLabel: string;
};

export type HourlyRow = {
  hour: string;
  sales: number;
  guests: number | null;
};

export type PdqMenuMix = {
  food: MoneyEvidence;
  largePizzas: MoneyEvidence;
  beer: MoneyEvidence;
  liquor: MoneyEvidence;
  pop: MoneyEvidence;
  wine: MoneyEvidence;
};

export type PdqChannelMix = {
  pickup: MoneyEvidence;
  delivery: MoneyEvidence;
  bar: MoneyEvidence;
  table: MoneyEvidence;
};

export type PdqNegatives = {
  specInstruction: MoneyEvidence;
  negMenu: MoneyEvidence;
  negSpecialInstruction: MoneyEvidence;
  promo: MoneyEvidence;
  unknown: MoneyEvidence;
};

export type PdqZSummary = {
  family: 'z-summary';
  businessDate: string | null;
  store: string | null;
  netSales: MoneyEvidence;
  grandTotal: MoneyEvidence;
  mix: PdqMenuMix;
  channels: PdqChannelMix;
  negatives: PdqNegatives;
  laborDollars: MoneyEvidence;
  expectedCash: MoneyEvidence;
  actualDeposit: MoneyEvidence;
  cashStatus: 'unentered' | 'entered' | 'missing-evidence';
  payouts: MoneyEvidence;
  voids: MoneyEvidence;
  promotions: MoneyEvidence;
  lateDeliveryCount: number | null;
  lateDeliverySales: MoneyEvidence;
  averageDeliveryMinutes: number | null;
};

export type PdqHourly = {
  family: 'hourly';
  businessDate: string | null;
  rows: HourlyRow[];
  peak: HourlyRow | null;
};

export type PdqVoidPromo = {
  family: 'void-promo';
  businessDate: string | null;
  voids: MoneyEvidence;
  promotions: MoneyEvidence;
  negatives: PdqNegatives;
};

export type PdqParseResult = PdqZSummary | PdqHourly | PdqVoidPromo | {
  family: 'unknown';
  error: string;
};

const MONEY = String.raw`\$?\s*([\d,]+\.\d{2})`;

export function parseFilenameBusinessDate(filename: string): string | null {
  const base = filename.trim().split(/[/\\]/).pop() || filename;
  const m = base.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\b/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function familyHits(hay: string): PdqReportFamily[] {
  const hits: PdqReportFamily[] = [];
  if (hay.includes('zreport_summary') || hay.includes('z report')) hits.push('z-summary');
  if (hay.includes('hourly_sales') || hay.includes('hourly sales')) hits.push('hourly');
  if (hay.includes('void_promo') || hay.includes('void promo')) hits.push('void-promo');
  return hits;
}

export function detectPdqFamily(filename: string, text = ''): PdqReportFamily {
  const fromFile = familyHits(filename.toLowerCase());
  if (fromFile.length === 1) return fromFile[0];
  if (fromFile.length > 1) return 'unknown';

  const fromText = familyHits(text.toLowerCase());
  if (fromText.length === 1) return fromText[0];
  if (fromText.length > 1) return 'unknown';

  const textHay = text.toLowerCase();
  if (/\bz report\b/.test(textHay) || (/\bend of day\b/.test(textHay) && /subtotal|menu category/i.test(text))) {
    return 'z-summary';
  }
  if (/# voids/i.test(text) && !/hourly sales|z report/i.test(textHay)) return 'void-promo';
  return 'unknown';
}

export function parseMoneyToken(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function presentMoney(value: number, sourceLabel: string): MoneyEvidence {
  return { value, state: 'unverified', sourceLabel };
}

function missingMoney(sourceLabel: string): MoneyEvidence {
  return { value: null, state: 'missing-evidence', sourceLabel };
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m?.[1] ?? null;
}

function labeledMoney(text: string, labels: string[], sourceLabel: string): MoneyEvidence {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:\\-]?\\s*(?:\\d+\\s+)?${MONEY}`, 'i');
    const token = firstMatch(text, re);
    const value = parseMoneyToken(token);
    if (value != null) return presentMoney(value, sourceLabel);
  }
  return missingMoney(sourceLabel);
}

function categoryMoney(text: string, category: string): MoneyEvidence {
  const label = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`(?:^|\\n)\\s*${label}\\s+\\d+\\s+${MONEY}`, 'im'),
    new RegExp(`(?:^|\\n)\\s*${label}\\s+${MONEY}`, 'im'),
  ];
  for (const re of patterns) {
    const token = firstMatch(text, re);
    const value = parseMoneyToken(token);
    if (value != null) return presentMoney(value, `Menu Category · ${category}`);
  }
  return missingMoney(`Menu Category · ${category}`);
}

function channelMoney(text: string, channel: string): MoneyEvidence {
  const label = channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const section = sliceSection(text, /Sales Summary/i, [
    /Taxable/i,
    /Grand Total/i,
    /Labor Summary/i,
    /Menu Category/i,
    /Discount Summary/i,
  ]);
  const hay = section || text;
  const patterns = [
    new RegExp(`(?:^|\\n)\\s*${label}\\s+\\d+\\s+${MONEY}`, 'im'),
    new RegExp(`(?:^|\\n)\\s*${label}\\s+${MONEY}`, 'im'),
  ];
  for (const re of patterns) {
    const token = firstMatch(hay, re);
    const value = parseMoneyToken(token);
    if (value != null) return presentMoney(value, `Channel · ${channel}`);
  }
  return missingMoney(`Channel · ${channel}`);
}

function negativeMoney(text: string, labels: string[], sourceLabel: string): MoneyEvidence {
  const section = sliceSection(text, /Discount Summary|Void Promo|Discount\b/i, [
    /Menu Category/i,
    /Labor Summary/i,
    /Payout Summary/i,
    /Cashier Summary/i,
    /Report Generated/i,
  ]);
  const hay = section || text;
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`${escaped}\\s+\\d+\\s+${MONEY}`, 'i'),
      new RegExp(`${escaped}\\s*[:\\-]?\\s*${MONEY}`, 'i'),
    ];
    for (const re of patterns) {
      const token = firstMatch(hay, re);
      const value = parseMoneyToken(token);
      if (value != null) return presentMoney(value, sourceLabel);
    }
  }
  return missingMoney(sourceLabel);
}

export function parsePdqNegatives(text: string): PdqNegatives {
  return {
    specInstruction: negativeMoney(text, ['Spec Instruction', 'Special Instruction'], 'Discount · Spec Instruction'),
    negMenu: negativeMoney(text, ['Neg Menu', 'Neg. Menu', 'Negative Menu'], 'Discount · Neg Menu'),
    negSpecialInstruction: negativeMoney(
      text,
      ['Neg Special Instruction', 'Neg. Special Instruction', 'Neg Special'],
      'Discount · Neg Special Instruction',
    ),
    promo: negativeMoney(text, ['Promo'], 'Discount · Promo'),
    unknown: negativeMoney(text, ['UKNOWN', 'UNKNOWN'], 'Discount · UKNOWN'),
  };
}

export function parsePdqMenuMix(text: string): PdqMenuMix {
  return {
    food: categoryMoney(text, 'Food'),
    largePizzas: categoryMoney(text, 'Large Pizzas'),
    beer: categoryMoney(text, 'Beer'),
    liquor: categoryMoney(text, 'Liquor'),
    pop: categoryMoney(text, 'Pop'),
    wine: categoryMoney(text, 'Wine'),
  };
}

export function parsePdqChannels(text: string): PdqChannelMix {
  return {
    pickup: channelMoney(text, 'Pickup'),
    delivery: channelMoney(text, 'Delivery'),
    bar: channelMoney(text, 'Bar'),
    table: channelMoney(text, 'Table'),
  };
}

function parseBusinessDateFromBody(text: string): string | null {
  const m = text.match(/Business Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseStore(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const dateLine = lines.findIndex((l) => /business date:/i.test(l));
  if (dateLine > 0) {
    const prior = lines[dateLine - 1];
    if (prior && !/z report|end of day|hourly|void/i.test(prior)) return prior.slice(0, 120);
  }
  return null;
}

function laborTotal(text: string): MoneyEvidence {
  const section = sliceSection(text, /Labor Summary/i, [
    /Discount Summary/i,
    /Misc Summary/i,
    /Menu Category/i,
    /Payout Summary/i,
    /Cashier Summary/i,
  ]);
  const hay = section || text;
  const total = firstMatch(hay, new RegExp(`Labor Summary[\\s\\S]{0,800}?Total:\\s*\\d+\\s+${MONEY}`, 'i'))
    ?? firstMatch(hay, new RegExp(`(?:^|\\n)\\s*Total:\\s*\\d+\\s+${MONEY}`, 'im'));
  const value = parseMoneyToken(total);
  return value != null ? presentMoney(value, 'Labor Summary · Total') : missingMoney('Labor Summary · Total');
}

function sliceSection(text: string, start: RegExp, stops: RegExp[]): string | null {
  const startMatch = start.exec(text);
  if (!startMatch || startMatch.index == null) return null;
  const from = startMatch.index;
  let end = text.length;
  for (const stop of stops) {
    const m = stop.exec(text.slice(from + startMatch[0].length));
    if (m && m.index != null) end = Math.min(end, from + startMatch[0].length + m.index);
  }
  return text.slice(from, end);
}

function cashStatus(expected: MoneyEvidence, actual: MoneyEvidence): PdqZSummary['cashStatus'] {
  const expectedZero = expected.value === 0;
  const actualZero = actual.value === 0;
  const expectedMissing = expected.state === 'missing-evidence';
  const actualMissing = actual.state === 'missing-evidence';
  if ((expectedMissing && actualMissing) || expectedZero || actualZero) return 'unentered';
  if (expected.value != null && expected.value > 0 && actual.value != null && actual.value > 0) return 'entered';
  return 'missing-evidence';
}

function lateDeliveryCount(text: string): number | null {
  const m = text.match(/Late\s+Deliverys?\s+(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function averageDeliveryMinutes(text: string): number | null {
  const m = text.match(/Average\s+Del(?:ivery)?\s+Time\s+\d+\s+(\d+)\s*min/i)
    ?? text.match(/Average\s+Del(?:ivery)?\s+Time[^\d]{0,20}(\d+)\s*min/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function parsePdqZSummary(text: string, filename = ''): PdqZSummary {
  const expectedCash = labeledMoney(text, ['Expected Cash'], 'Expected Cash');
  const actualDeposit = labeledMoney(text, ['Actual Deposit'], 'Shift Deposit · Actual Deposit');
  return {
    family: 'z-summary',
    businessDate: parseFilenameBusinessDate(filename) || parseBusinessDateFromBody(text),
    store: parseStore(text),
    netSales: labeledMoney(text, ['Subtotal'], 'Subtotal'),
    grandTotal: labeledMoney(text, ['Grand Total'], 'Grand Total'),
    mix: parsePdqMenuMix(text),
    channels: parsePdqChannels(text),
    negatives: parsePdqNegatives(text),
    laborDollars: laborTotal(text),
    expectedCash,
    actualDeposit,
    cashStatus: cashStatus(expectedCash, actualDeposit),
    payouts: labeledMoney(text, ['Pay Outs'], 'Pay Outs'),
    voids: labeledMoney(text, ['# Voids', 'Voids'], '# Voids'),
    promotions: labeledMoney(text, ['Promo'], 'Promo'),
    lateDeliveryCount: lateDeliveryCount(text),
    lateDeliverySales: labeledMoney(text, ['Late Deliverys', 'Late Deliveries'], 'Late Deliverys'),
    averageDeliveryMinutes: averageDeliveryMinutes(text),
  };
}

export function parsePdqHourly(text: string, filename = ''): PdqHourly {
  const rows: HourlyRow[] = [];
  const re = /(?:^|\n)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s+\$?\s*([\d,]+\.\d{2})\s+(\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const sales = parseMoneyToken(m[2]);
    const guests = Number(m[3]);
    if (sales == null) continue;
    rows.push({
      hour: m[1].replace(/\s+/g, ' ').trim(),
      sales,
      guests: Number.isFinite(guests) ? guests : null,
    });
  }
  const peak = rows.reduce<HourlyRow | null>((best, row) => {
    if (!best || row.sales > best.sales) return row;
    return best;
  }, null);
  return {
    family: 'hourly',
    businessDate: parseFilenameBusinessDate(filename) || parseBusinessDateFromBody(text),
    rows,
    peak,
  };
}

export function parsePdqVoidPromo(text: string, filename = ''): PdqVoidPromo {
  const negatives = parsePdqNegatives(text);
  const promotions = labeledMoney(text, ['Promo'], 'Promo');
  return {
    family: 'void-promo',
    businessDate: parseFilenameBusinessDate(filename) || parseBusinessDateFromBody(text),
    voids: labeledMoney(text, ['# Voids', 'Voids'], '# Voids'),
    promotions: promotions.value != null ? promotions : negatives.promo,
    negatives,
  };
}

export function parsePdqNativeText(text: string, filename = ''): PdqParseResult {
  const family = detectPdqFamily(filename, text);
  if (family === 'z-summary') return parsePdqZSummary(text, filename);
  if (family === 'hourly') return parsePdqHourly(text, filename);
  if (family === 'void-promo') return parsePdqVoidPromo(text, filename);
  return { family: 'unknown', error: 'Could not detect a PDQ Z, Hourly, or Void/Promo report.' };
}

/** Best-effort uncompressed PDF string dump. Native text / paste remains the contract. */
export function extractNativePdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString('latin1');
  if (!raw.startsWith('%PDF')) return Buffer.from(bytes).toString('utf8');
  const chunks: string[] = [];
  const re = /\((?:\\.|[^\\)]){2,}\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const inner = m[0].slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\n')
      .replace(/\\t/g, ' ')
      .replace(/\\(.)/g, '$1');
    if (/[A-Za-z]/.test(inner)) chunks.push(inner);
  }
  return chunks.join('\n');
}

export function decodePdqText(bytes: Uint8Array): string | null {
  if (bytes.byteLength === 0) return null;
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    const pdf = extractNativePdfText(bytes);
    return pdf.trim() ? pdf : null;
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return null;
  const text = new TextDecoder('utf-8').decode(bytes);
  return text.trim() ? text : null;
}

export const PDQ_PARSE_PREFIX = 'pdq-parse:v1:';

export type PdqFactPack = {
  pos: 'pdq';
  family: 'z-summary' | 'hourly' | 'void-promo';
  filename: string;
  ingestLane?: 'primary' | 'secondary' | 'unknown';
  businessDate: string | null;
  store: string | null;
  netSales: number | null;
  grandTotal: number | null;
  mix: {
    food: number | null;
    largePizzas: number | null;
    beer: number | null;
    liquor: number | null;
    pop: number | null;
    wine: number | null;
  };
  channels: {
    pickup: number | null;
    delivery: number | null;
    bar: number | null;
    table: number | null;
  };
  hourlyPeak: HourlyRow | null;
  hourlyRowCount: number;
  voids: number | null;
  promotions: number | null;
  negatives: {
    specInstruction: number | null;
    negMenu: number | null;
    negSpecialInstruction: number | null;
    promo: number | null;
    unknown: number | null;
  };
};

function moneyValue(row: MoneyEvidence | undefined): number | null {
  return row?.value ?? null;
}

function emptyNegatives() {
  return {
    specInstruction: null,
    negMenu: null,
    negSpecialInstruction: null,
    promo: null,
    unknown: null,
  };
}

function emptyMix() {
  return {
    food: null,
    largePizzas: null,
    beer: null,
    liquor: null,
    pop: null,
    wine: null,
  };
}

function emptyChannels() {
  return {
    pickup: null,
    delivery: null,
    bar: null,
    table: null,
  };
}

export function toPdqFactPack(parsed: PdqParseResult, filename: string, text = ''): PdqFactPack | null {
  if (parsed.family === 'unknown') return null;
  const ingestLane = detectPdqIngestLane(text, filename);
  if (parsed.family === 'z-summary') {
    return {
      pos: 'pdq',
      family: 'z-summary',
      filename,
      ingestLane,
      businessDate: parsed.businessDate,
      store: parsed.store,
      netSales: moneyValue(parsed.netSales),
      grandTotal: moneyValue(parsed.grandTotal),
      mix: {
        food: moneyValue(parsed.mix.food),
        largePizzas: moneyValue(parsed.mix.largePizzas),
        beer: moneyValue(parsed.mix.beer),
        liquor: moneyValue(parsed.mix.liquor),
        pop: moneyValue(parsed.mix.pop),
        wine: moneyValue(parsed.mix.wine),
      },
      channels: {
        pickup: moneyValue(parsed.channels.pickup),
        delivery: moneyValue(parsed.channels.delivery),
        bar: moneyValue(parsed.channels.bar),
        table: moneyValue(parsed.channels.table),
      },
      hourlyPeak: null,
      hourlyRowCount: 0,
      voids: moneyValue(parsed.voids),
      promotions: moneyValue(parsed.promotions),
      negatives: {
        specInstruction: moneyValue(parsed.negatives.specInstruction),
        negMenu: moneyValue(parsed.negatives.negMenu),
        negSpecialInstruction: moneyValue(parsed.negatives.negSpecialInstruction),
        promo: moneyValue(parsed.negatives.promo),
        unknown: moneyValue(parsed.negatives.unknown),
      },
    };
  }
  if (parsed.family === 'hourly') {
    return {
      pos: 'pdq',
      family: 'hourly',
      filename,
      ingestLane,
      businessDate: parsed.businessDate,
      store: null,
      netSales: null,
      grandTotal: null,
      mix: emptyMix(),
      channels: emptyChannels(),
      hourlyPeak: parsed.peak,
      hourlyRowCount: parsed.rows.length,
      voids: null,
      promotions: null,
      negatives: emptyNegatives(),
    };
  }
  return {
    pos: 'pdq',
    family: 'void-promo',
    filename,
    ingestLane,
    businessDate: parsed.businessDate,
    store: null,
    netSales: null,
    grandTotal: null,
    mix: emptyMix(),
    channels: emptyChannels(),
    hourlyPeak: null,
    hourlyRowCount: 0,
    voids: moneyValue(parsed.voids),
    promotions: moneyValue(parsed.promotions),
    negatives: {
      specInstruction: moneyValue(parsed.negatives.specInstruction),
      negMenu: moneyValue(parsed.negatives.negMenu),
      negSpecialInstruction: moneyValue(parsed.negatives.negSpecialInstruction),
      promo: moneyValue(parsed.negatives.promo),
      unknown: moneyValue(parsed.negatives.unknown),
    },
  };
}

export function parsePdqReport(text: string, filename: string): PdqFactPack | null {
  if (detectPdqFamily(filename, text) === 'unknown') return null;
  return toPdqFactPack(parsePdqNativeText(text, filename), filename, text);
}

export function pdqPackHasNumber(pack: PdqFactPack): boolean {
  return (
    pack.netSales != null
    || pack.grandTotal != null
    || pack.voids != null
    || pack.promotions != null
    || pack.hourlyRowCount > 0
    || pack.mix.food != null
    || pack.mix.largePizzas != null
    || pack.mix.beer != null
    || pack.mix.liquor != null
    || pack.mix.pop != null
    || pack.negatives.specInstruction != null
    || pack.negatives.negMenu != null
    || pack.negatives.negSpecialInstruction != null
    || pack.negatives.promo != null
    || pack.negatives.unknown != null
  );
}

export function packFromPdqSourceTag(source: string): PdqFactPack | null {
  if (!source.startsWith(PDQ_PARSE_PREFIX)) return null;
  try {
    const pack = JSON.parse(source.slice(PDQ_PARSE_PREFIX.length)) as PdqFactPack;
    return pack?.pos === 'pdq' ? pack : null;
  } catch {
    return null;
  }
}
