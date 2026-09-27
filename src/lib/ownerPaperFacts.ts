/**
 * Numbers printed on an owner's own papers.
 * A figure is Verified only when that figure is on the file.
 * A sum of several days is Estimated. Missing stays Missing.
 */

import type { EvidenceKind, SimpleOwnerUploadRecord, SourceTag } from '@/lib/simpleOwnerDemo/types';

export const PAPER_FACT_PREFIX = 'paper-fact:v1:';

export type PaperFactKind = 'z' | 'labor' | 'sales' | 'invoice';

export type PaperFact = {
  kind: PaperFactKind;
  filename: string;
  date: string | null;
  amount: number | null;
  netSales: number | null;
  laborPct: number | null;
  hours: number | null;
  salesBasis: number | null;
  tax: number | null;
  vendor: string | null;
  invoiceNumber: string | null;
};

export type PaperFactAnswer = {
  slug: 'action-shift';
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  verifiedClose: boolean;
  sampleDollars: 'none-verified' | 'prime-verified' | 'prime-estimated';
  sourceTags: SourceTag[];
};

const EMPTY_FACT = {
  netSales: null,
  laborPct: null,
  hours: null,
  salesBasis: null,
  tax: null,
  vendor: null,
  invoiceNumber: null,
} as const;

function moneyAmount(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function usd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

function dateFromToken(raw: string): string | null {
  const iso = raw.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const mdy = raw.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (!mdy) return null;
  let year = Number(mdy[3]);
  if (year < 100) year += 2000;
  return isoDate(year, Number(mdy[1]), Number(mdy[2]));
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function findPrintedDate(text: string, filename: string): string | null {
  const labeled = text.match(
    /(?:business date|invoice date|date)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|20\d{2}-\d{2}-\d{2})/i,
  );
  if (labeled) return dateFromToken(labeled[1]);
  return dateFromToken(text) ?? dateFromToken(filename);
}

function baseFact(kind: PaperFactKind, filename: string, date: string | null, amount: number | null): PaperFact {
  return { kind, filename, date, amount, ...EMPTY_FACT };
}

function extractSales(filename: string, text: string): PaperFact[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].toLowerCase();
  if (/\bsku\b|unit price|item code|invoice/.test(header) && !/sales/.test(filename.toLowerCase())) return [];
  const facts: PaperFact[] = [];
  for (const line of lines) {
    const match = line.match(
      /^(20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\s*,\s*\$?\s*([\d,]+\.\d{2})\s*$/,
    );
    if (!match) continue;
    const amount = moneyAmount(match[2]);
    const date = dateFromToken(match[1]);
    if (amount == null || !date) continue;
    facts.push(baseFact('sales', filename, date, amount));
  }
  return facts;
}

function extractZ(filename: string, text: string): PaperFact | null {
  const hay = `${filename}\n${text}`;
  const namedZ = /z\s*-?\s*report|zreport|\beod\b|end of day/i.test(hay);
  if (!namedZ && !(/grand\s*total/i.test(text) && !/\binvoice\b/i.test(hay))) return null;
  const grand = text.match(/grand\s*total\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/i);
  if (!grand) return null;
  const amount = moneyAmount(grand[1]);
  if (amount == null) return null;
  const net = text.match(/(?:net sales|subtotal)\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/i);
  const fact = baseFact('z', filename, findPrintedDate(text, filename), amount);
  fact.netSales = net ? moneyAmount(net[1]) : null;
  return fact;
}

function extractLabor(filename: string, text: string): PaperFact | null {
  const hay = `${filename}\n${text}`;
  if (!/time\s*clock|timesheet|total\s*labor|labor\s*%/i.test(hay)) return null;
  const dollars = text.match(/total\s*labor(?:\s*cost)?\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/i)
    ?? text.match(/labor\s*(?:cost|\$)\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/i);
  if (!dollars) return null;
  const amount = moneyAmount(dollars[1]);
  if (amount == null) return null;
  const pct = text.match(/labor\s*%\s*[:\-]?\s*([\d.]+)/i);
  const hours = text.match(/total\s*hours\s*[:\-]?\s*([\d,]+\.\d+)/i);
  const sales = text.match(/(?:sales|net sales)\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/i);
  const fact = baseFact('labor', filename, findPrintedDate(text, filename), amount);
  fact.laborPct = pct && Number.isFinite(Number(pct[1])) ? Number(pct[1]) : null;
  fact.hours = hours ? Number(hours[1].replace(/,/g, '')) : null;
  fact.salesBasis = sales ? moneyAmount(sales[1]) : null;
  return fact;
}

const INVOICE_NUMBER_STOP = new Set([
  'invoice', 'number', 'date', 'total', 'page', 'customer', 'amount', 'due', 'no', 'num',
]);

export function readPrintedInvoiceNumber(text: string): string | null {
  const labeled = text.match(/Invoice\s*(?:Number|#|No\.?)\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9._-]{1,})/i);
  const labeledValue = labeled?.[1] ?? '';
  if (labeledValue && !INVOICE_NUMBER_STOP.has(labeledValue.toLowerCase()) && /\d/.test(labeledValue)) {
    return labeledValue;
  }
  const digits = text.match(/\b(\d{5,})\b/g) ?? [];
  const pick = digits.find((value) => !/^20\d{6}$/.test(value));
  return pick ?? null;
}

function vendorName(filename: string, text: string): string | null {
  const hay = `${filename}\n${text}`;
  if (/performance food|pfg/i.test(hay)) return 'Performance Foodservice';
  if (/central iowa/i.test(hay)) return 'Central Iowa';
  if (/vestis/i.test(hay)) return 'Vestis';
  if (/sysco/i.test(hay)) return 'Sysco';
  if (/us foods/i.test(hay)) return 'US Foods';
  return null;
}

function extractInvoice(filename: string, text: string): PaperFact | null {
  const hay = `${filename}\n${text}`;
  if (!/invoice|pfg|performance food|vestis|central iowa/i.test(hay)) return null;
  const labeled = text.match(
    /(?:invoice\s*total|amount\s*due|total\s*due|balance\s*due)\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/i,
  );
  const standalone = [...text.matchAll(/(?:^|\n)\s*total\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/gi)];
  const raw = labeled?.[1] ?? standalone.at(-1)?.[1];
  const amount = moneyAmount(raw);
  if (amount == null) return null;
  const tax = text.match(/\btax\s*[:\-]?\s*\$?\s*([\d,]+\.\d{2})/i);
  const fact = baseFact('invoice', filename, findPrintedDate(text, filename), amount);
  fact.tax = tax ? moneyAmount(tax[1]) : null;
  fact.vendor = vendorName(filename, text);
  fact.invoiceNumber = readPrintedInvoiceNumber(text);
  return fact;
}

export function extractPaperFacts(filename: string, text: string): PaperFact[] {
  const clean = text.replace(/\u0000/g, ' ');
  if (!/[A-Za-z]{3,}/.test(`${filename}\n${clean}`) && !extractSales(filename, clean).length) return [];
  const sales = extractSales(filename, clean);
  if (sales.length) return sales;
  const facts: PaperFact[] = [];
  const z = extractZ(filename, clean);
  if (z) facts.push(z);
  const labor = extractLabor(filename, clean);
  if (labor && !(z && !/time\s*clock|timesheet|labor\s*%|total\s*labor/i.test(`${filename}\n${clean}`))) {
    facts.push(labor);
  }
  if (!z) {
    const invoice = extractInvoice(filename, clean);
    if (invoice) facts.push(invoice);
  }
  return facts;
}

export function encodePaperFact(fact: PaperFact): string {
  const params = new URLSearchParams();
  params.set('kind', fact.kind);
  if (fact.date) params.set('date', fact.date);
  if (fact.amount != null) params.set('amount', String(fact.amount));
  if (fact.netSales != null) params.set('net', String(fact.netSales));
  if (fact.laborPct != null) params.set('pct', String(fact.laborPct));
  if (fact.hours != null) params.set('hours', String(fact.hours));
  if (fact.salesBasis != null) params.set('sales', String(fact.salesBasis));
  if (fact.tax != null) params.set('tax', String(fact.tax));
  if (fact.vendor) params.set('vendor', fact.vendor);
  if (fact.invoiceNumber) params.set('num', fact.invoiceNumber);
  params.set('file', fact.filename);
  return `${PAPER_FACT_PREFIX}${params.toString()}`;
}

export function paperFactTags(filename: string, text: string): SourceTag[] {
  return extractPaperFacts(filename, text).map((fact) => ({
    tag: 'verified' as const,
    source: encodePaperFact(fact),
  }));
}

export function decodePaperFact(source: string): PaperFact | null {
  if (!source.startsWith(PAPER_FACT_PREFIX)) return null;
  const params = new URLSearchParams(source.slice(PAPER_FACT_PREFIX.length));
  const kind = params.get('kind');
  if (kind !== 'z' && kind !== 'labor' && kind !== 'sales' && kind !== 'invoice') return null;
  const amountRaw = params.get('amount');
  const amount = amountRaw == null ? null : Number(amountRaw);
  const fact = baseFact(kind, params.get('file') || 'paper', params.get('date'), Number.isFinite(amount) ? amount : null);
  const num = (key: string): number | null => {
    const value = params.get(key);
    if (value == null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  fact.netSales = num('net');
  fact.laborPct = num('pct');
  fact.hours = num('hours');
  fact.salesBasis = num('sales');
  fact.tax = num('tax');
  fact.vendor = params.get('vendor');
  fact.invoiceNumber = params.get('num');
  return fact;
}

export function factsFromTags(tags: readonly SourceTag[]): PaperFact[] {
  return tags.flatMap((tag) => {
    const fact = decodePaperFact(tag.source);
    return fact ? [fact] : [];
  });
}

export function factsFromUploads(
  uploads: readonly { filename: string; sourceTags?: readonly SourceTag[] }[],
): PaperFact[] {
  return uploads.flatMap((row) => factsFromTags(row.sourceTags ?? []).map((fact) => (
    fact.filename ? fact : { ...fact, filename: row.filename }
  )));
}

export function evidenceKindForPaperFacts(
  facts: readonly PaperFact[],
  filename: string,
  fallback: EvidenceKind,
): EvidenceKind {
  if (!facts.length) return fallback;
  if (/time\s*clock|timesheet/i.test(filename) && facts.some((fact) => fact.kind === 'labor')) return 'timeclock';
  if (facts.some((fact) => fact.kind === 'invoice')) return 'invoice';
  if (facts.some((fact) => fact.kind === 'labor') && !facts.some((fact) => fact.kind === 'z' || fact.kind === 'sales')) {
    return 'timeclock';
  }
  if (facts.some((fact) => fact.kind === 'z' || fact.kind === 'sales')) return 'z';
  return fallback;
}

export function summaryForFacts(facts: readonly PaperFact[]): string {
  return facts.flatMap((fact) => {
    if (fact.amount == null) return [];
    if (fact.kind === 'z') return [`Verified sales ${usd(fact.amount)}${fact.date ? ` on ${fact.date}` : ''}`];
    if (fact.kind === 'sales') return [`Verified sales ${usd(fact.amount)}${fact.date ? ` on ${fact.date}` : ''}`];
    if (fact.kind === 'labor') {
      const pct = fact.laborPct != null ? ` (${fact.laborPct}%)` : '';
      return [`Verified labor ${usd(fact.amount)}${pct}`];
    }
    const who = fact.vendor ? `${fact.vendor} ` : '';
    const num = fact.invoiceNumber ? `#${fact.invoiceNumber} ` : '';
    return [`${who}invoice ${num}total ${usd(fact.amount)}`.replace(/\s+/g, ' ')];
  }).join(' · ');
}

export function weekSalesFromFacts(facts: readonly PaperFact[]): {
  amount: number;
  honesty: 'Verified' | 'Estimated';
  paper: string;
} | null {
  const daily = facts.filter((fact) => (fact.kind === 'z' || fact.kind === 'sales') && fact.amount != null);
  const rows = daily.some((fact) => fact.kind === 'z')
    ? daily.filter((fact) => fact.kind === 'z')
    : daily.filter((fact) => fact.kind === 'sales');
  if (!rows.length) return null;
  if (rows.length === 1 && rows[0].amount != null) {
    return {
      amount: rows[0].amount,
      honesty: 'Verified',
      paper: 'Verified from one paper. One day, not a full week.',
    };
  }
  const sum = Math.round(rows.reduce((total, fact) => total + (fact.amount ?? 0), 0) * 100) / 100;
  return {
    amount: sum,
    honesty: 'Estimated',
    paper: 'Estimated sum of the papers on this seat, not a closed week.',
  };
}

export function laborFromFacts(facts: readonly PaperFact[]): {
  amount: number;
  honesty: 'Verified';
  paper: string;
} | null {
  const rows = facts.filter((fact) => fact.kind === 'labor' && fact.amount != null);
  if (!rows.length) return null;
  const picked = [...rows].sort((left, right) => {
    const pct = Number(right.laborPct != null) - Number(left.laborPct != null);
    if (pct !== 0) return pct;
    return (right.amount ?? 0) - (left.amount ?? 0);
  })[0];
  if (!picked || picked.amount == null) return null;
  const extra = [
    picked.laborPct != null ? `${picked.laborPct}%` : '',
    picked.hours != null ? `${picked.hours} h` : '',
  ].filter(Boolean).join(', ');
  return {
    amount: picked.amount,
    honesty: 'Verified',
    paper: extra
      ? `Verified from the time clock (${extra}). Hours are not a second labor dollar.`
      : 'Verified from the time clock. Hours are not a second labor dollar.',
  };
}

function askedDay(question: string): { month: number; day: number; year: number | null } | null {
  const iso = question.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  const mdy = question.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (mdy) {
    let year = mdy[3] ? Number(mdy[3]) : null;
    if (year != null && year < 100) year += 2000;
    return { month: Number(mdy[1]), day: Number(mdy[2]), year };
  }
  const named = question.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s+(20\d{2}))?/i);
  if (!named) return null;
  const month = MONTHS[named[1].toLowerCase()];
  if (!month) return null;
  return { month, day: Number(named[2]), year: named[3] ? Number(named[3]) : null };
}

function sameDay(factDate: string | null, asked: { month: number; day: number; year: number | null }): boolean {
  if (!factDate) return false;
  const [year, month, day] = factDate.split('-').map(Number);
  if (month !== asked.month || day !== asked.day) return false;
  if (asked.year == null) return true;
  return year === asked.year;
}

function isSalesAsk(question: string): boolean {
  return /what were my (?:total )?sales|my total sales|total sales on|sales on \d|grand total on \d/i.test(question);
}

function isInvoiceAsk(question: string): boolean {
  return /invoice total|what was my .+ invoice|what is the (?:total|invoice)|my .+ invoice total/i.test(question);
}

function isLaborAsk(question: string): boolean {
  return /total labor|time clock|labor dollars|what was my labor|how much was labor/i.test(question);
}

function vendorWanted(question: string): RegExp | null {
  if (/pfg|performance food/i.test(question)) return /performance|pfg/i;
  if (/vestis/i.test(question)) return /vestis/i;
  if (/central iowa/i.test(question)) return /central iowa/i;
  if (/sysco/i.test(question)) return /sysco/i;
  if (/us foods/i.test(question)) return /us foods/i;
  return null;
}

export function isPlainPaperQuestion(question: string): boolean {
  return isSalesAsk(question) || isInvoiceAsk(question) || isLaborAsk(question);
}

export function missingPaperAnswer(needs = 'The paper that prints this number.'): PaperFactAnswer {
  return {
    slug: 'action-shift',
    headline: 'Missing — that number is not on a paper for this account.',
    facts: [
      'Missing stays Missing. We will not guess a dollar.',
      'Add the paper that prints this number. A photo with no readable text stays Missing.',
    ],
    coachTomorrow: 'Add the Z, time clock, sales file, or invoice that has this number.',
    needs,
    verifiedClose: false,
    sampleDollars: 'none-verified',
    sourceTags: [{ tag: 'unverified', source: 'paper-fact:missing' }],
  };
}

function verifiedLines(lines: string[], headline: string): PaperFactAnswer {
  return {
    slug: 'action-shift',
    headline,
    facts: lines,
    coachTomorrow: 'The number above is the figure printed on your paper.',
    needs: 'Nothing else is required for this figure.',
    verifiedClose: true,
    sampleDollars: 'prime-verified',
    sourceTags: [{ tag: 'verified', source: 'paper-fact:answer' }],
  };
}

export function answerFromPaperFacts(
  question: string,
  uploads: readonly Pick<SimpleOwnerUploadRecord, 'filename' | 'sourceTags'>[],
): PaperFactAnswer | null {
  const salesAsk = isSalesAsk(question);
  const invoiceAsk = isInvoiceAsk(question);
  const laborAsk = isLaborAsk(question);
  if (!salesAsk && !invoiceAsk && !laborAsk) return null;
  const facts = factsFromUploads(uploads);

  if (salesAsk) {
    const asked = askedDay(question);
    const pool = facts.filter((fact) => (fact.kind === 'z' || fact.kind === 'sales') && fact.amount != null);
    const rows = pool.some((fact) => fact.kind === 'z')
      ? pool.filter((fact) => fact.kind === 'z')
      : pool.filter((fact) => fact.kind === 'sales');
    const matched = asked ? rows.filter((fact) => sameDay(fact.date, asked)) : rows;
    if (!matched.length || matched.some((fact) => fact.amount == null)) return null;
    if (matched.length === 1 && matched[0].amount != null) {
      const when = matched[0].date ? ` on ${matched[0].date}` : '';
      return verifiedLines(
        [`Verified · ${matched[0].filename} · sales ${usd(matched[0].amount)}${when}.`],
        `Verified sales ${usd(matched[0].amount)}${when}.`,
      );
    }
    const lines = matched
      .filter((fact) => fact.amount != null)
      .map((fact) => `Verified · ${fact.filename} · ${fact.date ?? 'date Missing'} · ${usd(fact.amount ?? 0)}.`);
    return verifiedLines(lines, `Verified · ${matched.length} sales papers on this account.`);
  }

  if (invoiceAsk) {
    let invoices = facts.filter((fact) => fact.kind === 'invoice' && fact.amount != null);
    const vendor = vendorWanted(question);
    if (vendor) invoices = invoices.filter((fact) => vendor.test(`${fact.vendor ?? ''} ${fact.filename}`));
    const number = question.match(/\b(\d{5,})\b/)?.[1];
    if (number) invoices = invoices.filter((fact) => fact.invoiceNumber === number);
    if (!invoices.length) return null;
    if (invoices.length === 1 && invoices[0].amount != null) {
      const who = invoices[0].vendor ?? 'Invoice';
      const num = invoices[0].invoiceNumber ? ` #${invoices[0].invoiceNumber}` : '';
      const tax = invoices[0].tax != null ? ` Tax ${usd(invoices[0].tax)}.` : '';
      return verifiedLines(
        [`Verified · ${invoices[0].filename} · ${who}${num} total ${usd(invoices[0].amount)}.${tax}`],
        `Verified · ${who}${num} total ${usd(invoices[0].amount)}.`,
      );
    }
    return verifiedLines(
      invoices.map((fact) => {
        const who = fact.vendor ?? 'Invoice';
        const num = fact.invoiceNumber ? ` #${fact.invoiceNumber}` : '';
        return `Verified · ${fact.filename} · ${who}${num} total ${usd(fact.amount ?? 0)}.`;
      }),
      `Verified · ${invoices.length} invoice totals on this account.`,
    );
  }

  const labor = laborFromFacts(facts);
  if (!labor) return null;
  return verifiedLines(
    [`Verified · labor ${usd(labor.amount)}. ${labor.paper}`],
    `Verified labor ${usd(labor.amount)}.`,
  );
}
