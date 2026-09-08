/**
 * Thin EOD lock (CoS Verified).
 *
 * No ZReport_Summary for that business date → hard Missing for day
 * totals / Grand Total / net close. Before Missing, cross-check the
 * secondary CC for a same-morning ZReport. Void-only: voids may be
 * Verified from Void_Promo; totals stay Missing. No regen. No other days.
 */

import type { PdqFactPack } from '@/lib/pdqEodParse';
import { pdqIngestLaneRank, type PdqIngestLane } from '@/lib/pdqIngest';

export const PDQ_THIN_EOD = {
  noZ: 'hard-missing',
  secondaryCrosscheck: true,
  voidOnlyVoidsVerified: true,
  noRegen: true,
  noOtherDays: true,
} as const;

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

export function chicagoYmd(now: Date, dayOffset = 0): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((row) => row.type === 'year')?.value);
  const month = Number(parts.find((row) => row.type === 'month')?.value);
  const day = Number(parts.find((row) => row.type === 'day')?.value);
  const utc = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return utc.toISOString().slice(0, 10);
}

export function resolvePdqAskedDate(question: string, now: Date): string | null {
  const q = question.toLowerCase();
  if (/\byesterday\b/.test(q)) return chicagoYmd(now, -1);
  const mdY = q.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  if (mdY) {
    const month = Number(mdY[1]);
    const day = Number(mdY[2]);
    const year = Number(mdY[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const named = q.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s*(\d{4})?\b/,
  );
  if (named) {
    const month = MONTHS[named[1].replace(/\./g, '')] ?? 0;
    const day = Number(named[2]);
    const year = named[3] ? Number(named[3]) : Number(chicagoYmd(now, 0).slice(0, 4));
    if (month >= 1 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  if (/\btoday\b/.test(q) && !/food today/.test(q)) return chicagoYmd(now, 0);
  return null;
}

export function zPackHasTotals(pack: PdqFactPack): boolean {
  return pack.grandTotal != null
    || pack.netSales != null
    || pack.mix.food != null
    || pack.mix.largePizzas != null;
}

export function pickPdqPackForDate(
  packs: readonly PdqFactPack[],
  family: PdqFactPack['family'],
  askedDate: string | null,
): PdqFactPack | null {
  let hits = packs.filter((row) => row.family === family);
  if (family === 'z-summary') hits = hits.filter(zPackHasTotals);
  if (askedDate) {
    hits = hits.filter((row) => row.businessDate === askedDate);
  } else {
    const dates = [...new Set(hits.map((row) => row.businessDate).filter(Boolean))];
    if (dates.length > 1) return null;
  }
  hits.sort((a, b) => pdqIngestLaneRank(b.ingestLane as PdqIngestLane) - pdqIngestLaneRank(a.ingestLane as PdqIngestLane));
  return hits[0] ?? null;
}

export function thinEodMissingFacts(input: {
  askedDate: string | null;
  hasVoids: boolean;
}): string[] {
  const lines = [
    'Hard Missing for day totals / Grand Total / net close. Hourly_Sales_Report or Void_Promo_Report is not a ZReport_Summary.',
    'Cross-checked secondary CC for a same-morning ZReport. None on this seat.',
    'Do not invent from a regen guess or another business date.',
  ];
  if (input.hasVoids) {
    lines.unshift(
      'Void-only thin pack: voids may be Verified from Void_Promo. Day totals stay Missing.',
    );
  }
  if (input.askedDate) {
    lines.push(`Asked business date ${input.askedDate} has no ZReport_Summary.`);
  }
  return lines;
}
