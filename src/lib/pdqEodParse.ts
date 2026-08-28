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
 * Fixtures stay synthetic unless an operator-supplied yesterday-close field map
 * is wired through the owner/staff path. Do not commit phones, PINs, or roster names.
 */

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

export type PdqZSummary = {
  family: 'z-summary';
  businessDate: string | null;
  store: string | null;
  netSales: MoneyEvidence;
  grandTotal: MoneyEvidence;
  mix: {
    food: MoneyEvidence;
    beer: MoneyEvidence;
    liquor: MoneyEvidence;
    pop: MoneyEvidence;
    wine: MoneyEvidence;
  };
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
  /** PDQ Sales Summary Delivery — in-house, not DoorDash / marketplace 3P. */
  inHouseDeliveryCount: number | null;
  inHouseDeliverySales: MoneyEvidence;
  deliveryChannel: 'in_house' | null;
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
};

export type PdqParseResult = PdqZSummary | PdqHourly | PdqVoidPromo | {
  family: 'unknown';
  error: string;
};

const MONEY = String.raw`\$?\s*([\d,]+\.\d{2})`;
const MONEY_FLEX = String.raw`\$?\s*([\d,]+(?:\.\d{1,2})?)`;

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

export function detectPdqFamily(filename: string, text = ''): PdqReportFamily {
  const hay = `${filename}\n${text}`.toLowerCase();
  if (hay.includes('zreport_summary') || hay.includes('z report') || hay.includes('end of day')) {
    return 'z-summary';
  }
  if (hay.includes('hourly_sales') || hay.includes('hourly sales')) return 'hourly';
  if (hay.includes('void_promo') || hay.includes('void promo') || hay.includes('# voids')) {
    return 'void-promo';
  }
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
    const patterns = [
      new RegExp(`${label}\\s*[:\\-]?\\s*(?:\\d+\\s+)?${MONEY}`, 'i'),
      new RegExp(`${label}\\s*[:\\-]?\\s*(?:\\d+\\s+)?${MONEY_FLEX}\\b`, 'i'),
    ];
    for (const re of patterns) {
      const token = firstMatch(text, re);
      const value = parseMoneyToken(token);
      if (value != null) return presentMoney(value, sourceLabel);
    }
  }
  return missingMoney(sourceLabel);
}

function categoryMoney(text: string, category: string): MoneyEvidence {
  const label = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`(?:^|\\n)\\s*${label}\\s+\\d+\\s+${MONEY}`, 'im'),
    new RegExp(`(?:^|\\n)\\s*${label}\\s+${MONEY}`, 'im'),
    // Operator shorthand: "Food 2776" (no qty, optional cents). Do not steal the qty from "Food 40 $600.00".
    new RegExp(`(?:^|\\n)\\s*${label}\\s+(?!\\d+\\s+\\$)${MONEY_FLEX}\\b`, 'im'),
  ];
  for (const re of patterns) {
    const token = firstMatch(text, re);
    const value = parseMoneyToken(token);
    if (value != null) return presentMoney(value, `Menu Category · ${category}`);
  }
  return missingMoney(`Menu Category · ${category}`);
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
  const m = text.match(/Late\s+Deliverys?\s+(\d+)/i)
    ?? text.match(/\bLate\s+(\d+)\s*\/\s*[\d,.]+/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function lateDeliverySales(text: string): MoneyEvidence {
  const slash = firstMatch(text, /\bLate\s+\d+\s*\/\s*([\d,]+(?:\.\d{1,2})?)/i);
  const slashValue = parseMoneyToken(slash);
  if (slashValue != null) return presentMoney(slashValue, 'Late Deliverys');
  return labeledMoney(text, ['Late Deliverys', 'Late Deliveries'], 'Late Deliverys');
}

function inHouseDelivery(text: string): { count: number | null; sales: MoneyEvidence } {
  const missing = missingMoney('Sales Summary · Delivery (in-house)');
  const slash = text.match(/\bDelivery\s+(\d+)\s*\/\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (slash) {
    const count = Number(slash[1]);
    const sales = parseMoneyToken(slash[2]);
    return {
      count: Number.isFinite(count) ? count : null,
      sales: sales != null ? presentMoney(sales, 'Sales Summary · Delivery (in-house)') : missing,
    };
  }
  const section = sliceSection(text, /Sales Summary/i, [
    /Taxable:/i,
    /Menu Category/i,
    /Labor Summary/i,
    /Misc Summary/i,
    /Discount Summary/i,
  ]) || text;
  const line = new RegExp(`(?:^|\\n)\\s*Delivery\\s+(\\d+)\\s+${MONEY}`, 'im').exec(section)
    ?? new RegExp(`(?:^|\\n)\\s*Delivery\\s+(\\d+)\\s+${MONEY_FLEX}`, 'im').exec(section);
  if (!line) return { count: null, sales: missing };
  const count = Number(line[1]);
  const sales = parseMoneyToken(line[2]);
  return {
    count: Number.isFinite(count) ? count : null,
    sales: sales != null ? presentMoney(sales, 'Sales Summary · Delivery (in-house)') : missing,
  };
}

function firstPresent(fields: MoneyEvidence[]): MoneyEvidence {
  return fields.find((field) => field.value != null) ?? fields[0];
}

function averageDeliveryMinutes(text: string): number | null {
  const m = text.match(/Average\s+Del(?:ivery)?\s+Time\s+\d+\s+(\d+)\s*min/i)
    ?? text.match(/Average\s+Del(?:ivery)?\s+Time[^\d]{0,20}(\d+)\s*min/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function parsePdqZSummary(text: string, filename = ''): PdqZSummary {
  const expectedCash = firstPresent([
    labeledMoney(text, ['Expected Cash'], 'Expected Cash'),
    labeledMoney(text, ['Cash'], 'Expected Cash'),
  ]);
  const actualDeposit = labeledMoney(text, ['Actual Deposit'], 'Shift Deposit · Actual Deposit');
  const inHouse = inHouseDelivery(text);
  const labor = firstPresent([
    laborTotal(text),
    labeledMoney(text, ['Labor Summary', 'Labor'], 'Labor Summary · Total'),
  ]);
  return {
    family: 'z-summary',
    businessDate: parseFilenameBusinessDate(filename) || parseBusinessDateFromBody(text),
    store: parseStore(text),
    netSales: labeledMoney(text, ['Subtotal'], 'Subtotal'),
    grandTotal: firstPresent([
      labeledMoney(text, ['Grand Total'], 'Grand Total'),
      labeledMoney(text, ['Grand'], 'Grand Total'),
    ]),
    mix: {
      food: categoryMoney(text, 'Food'),
      beer: categoryMoney(text, 'Beer'),
      liquor: categoryMoney(text, 'Liquor'),
      pop: categoryMoney(text, 'Pop'),
      wine: categoryMoney(text, 'Wine'),
    },
    laborDollars: labor,
    expectedCash,
    actualDeposit,
    cashStatus: cashStatus(expectedCash, actualDeposit),
    payouts: labeledMoney(text, ['Pay Outs'], 'Pay Outs'),
    voids: labeledMoney(text, ['# Voids', 'Voids'], '# Voids'),
    promotions: labeledMoney(text, ['Promo'], 'Promo'),
    lateDeliveryCount: lateDeliveryCount(text),
    lateDeliverySales: lateDeliverySales(text),
    averageDeliveryMinutes: averageDeliveryMinutes(text),
    inHouseDeliveryCount: inHouse.count,
    inHouseDeliverySales: inHouse.sales,
    deliveryChannel: inHouse.count != null || inHouse.sales.value != null ? 'in_house' : null,
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
  return {
    family: 'void-promo',
    businessDate: parseFilenameBusinessDate(filename) || parseBusinessDateFromBody(text),
    voids: labeledMoney(text, ['# Voids', 'Voids'], '# Voids'),
    promotions: labeledMoney(text, ['Promo'], 'Promo'),
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
