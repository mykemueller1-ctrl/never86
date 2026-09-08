/**
 * Last-week prime — the One-Seat Action Shift path.
 *
 * Prime = week sales + COGS (labor, food, pop, liquor, beer).
 * Band 60–65%. Incomplete week stays Open. Missing stays Missing.
 * Invoice ≠ COGS. No count → no food / pop / liquor / beer dollar.
 * Never invent $ or %. Action Shift only.
 */

import { toastMayAnswerSeat } from '@/lib/seatIsolation';
import { collectToastFacts, usd } from '@/lib/toastParse';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';

export const LAST_WEEK_PRIME_BAND_MIN = 60;
export const LAST_WEEK_PRIME_BAND_MAX = 65;
export const LAST_WEEK_PRIME_LOAD_ASK =
  'Load last-week COGS. Week sales plus labor, food, pop, liquor, and beer.';

export const LAST_WEEK_PRIME_FAMILIES = [
  'week-sales',
  'labor',
  'food',
  'pop',
  'liquor',
  'beer',
] as const;

export type LastWeekPrimeFamilyId = (typeof LAST_WEEK_PRIME_FAMILIES)[number];
export type LastWeekHonesty = 'Verified' | 'Estimated' | 'Missing';

export type LastWeekPrimeFamily = {
  id: LastWeekPrimeFamilyId;
  label: string;
  honesty: LastWeekHonesty;
  amount: number | null;
  paper: string;
};

export type LastWeekPrimeSnapshot = {
  bandMin: typeof LAST_WEEK_PRIME_BAND_MIN;
  bandMax: typeof LAST_WEEK_PRIME_BAND_MAX;
  weekSales: number | null;
  cogsTotal: number | null;
  primePct: number | null;
  honesty: LastWeekHonesty;
  headline: string;
  families: LastWeekPrimeFamily[];
  missingIds: LastWeekPrimeFamilyId[];
  nextLoad: string;
  invented: false;
};

const FAMILY_LABEL: Record<LastWeekPrimeFamilyId, string> = {
  'week-sales': 'Week sales',
  labor: 'Labor',
  food: 'Food',
  pop: 'Pop',
  liquor: 'Liquor',
  beer: 'Beer',
};

const FAMILY_PAPER: Record<LastWeekPrimeFamilyId, string> = {
  'week-sales': 'Same-store week SalesSummary (or a complete week of Zs). Incomplete week stays Open.',
  labor: 'Same-week LaborBreakDown. Hours are not labor $.',
  food: 'Period food COGS (count + invoices). Invoice ≠ COGS.',
  pop: 'Period pop COGS (count + invoices). Invoice ≠ COGS.',
  liquor: 'Period liquor COGS (count + invoices). Invoice ≠ COGS.',
  beer: 'Period beer COGS (count + invoices). Invoice ≠ COGS.',
};

const COGS_TAG = /^(cogs):(food|pop|liquor|beer):(\d+(?:\.\d+)?)$/i;

export function routeLastWeekPrimeQuestion(question: string): boolean {
  const q = question.toLowerCase().replace(/[^a-z0-9\s/%-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return false;
  if (/prime\s*cost|last[\s-]*week\s*(cogs|prime|cost)|load last[\s-]*week/.test(q)) return true;
  if (/making money|under\s*60|60\s*65|week\s*cogs|cogs\s*(this\s*)?week/.test(q)) return true;
  if (/food cost/.test(q) && /week|prime/.test(q)) return true;
  return false;
}

function cogsFromTags(tags: readonly SourceTag[]): Partial<Record<'food' | 'pop' | 'liquor' | 'beer', { amount: number; honesty: LastWeekHonesty }>> {
  const out: Partial<Record<'food' | 'pop' | 'liquor' | 'beer', { amount: number; honesty: LastWeekHonesty }>> = {};
  for (const tag of tags) {
    const hit = COGS_TAG.exec(tag.source);
    if (!hit) continue;
    if (tag.tag !== 'verified' && tag.tag !== 'estimated') continue;
    const family = hit[2].toLowerCase() as 'food' | 'pop' | 'liquor' | 'beer';
    const amount = Number(hit[3]);
    if (!Number.isFinite(amount)) continue;
    const honesty: LastWeekHonesty = tag.tag === 'verified' ? 'Verified' : 'Estimated';
    out[family] = { amount, honesty };
  }
  return out;
}

function familyRow(
  id: LastWeekPrimeFamilyId,
  amount: number | null,
  honesty: LastWeekHonesty,
): LastWeekPrimeFamily {
  return {
    id,
    label: FAMILY_LABEL[id],
    honesty,
    amount,
    paper: FAMILY_PAPER[id],
  };
}

export function collectLastWeekPrime(
  operatorId: string,
  uploads: readonly { filename: string; sourceTags?: readonly SourceTag[] }[],
  restaurantName?: string | null,
): LastWeekPrimeSnapshot {
  const nagToastOk = toastMayAnswerSeat(operatorId, restaurantName);
  const toast = nagToastOk ? collectToastFacts(uploads) : null;
  const weekSales = toast?.salesWeek?.netSales ?? null;
  const weekHonesty: LastWeekHonesty = weekSales != null ? 'Verified' : 'Missing';
  const labor = toast?.labor?.laborCost ?? null;
  const laborHonesty: LastWeekHonesty = labor != null ? 'Verified' : 'Missing';
  const labeled = cogsFromTags(uploads.flatMap((row) => row.sourceTags ?? []));

  const families: LastWeekPrimeFamily[] = [
    familyRow('week-sales', weekSales, weekHonesty),
    familyRow('labor', labor, laborHonesty),
    familyRow('food', labeled.food?.amount ?? null, labeled.food?.honesty ?? 'Missing'),
    familyRow('pop', labeled.pop?.amount ?? null, labeled.pop?.honesty ?? 'Missing'),
    familyRow('liquor', labeled.liquor?.amount ?? null, labeled.liquor?.honesty ?? 'Missing'),
    familyRow('beer', labeled.beer?.amount ?? null, labeled.beer?.honesty ?? 'Missing'),
  ];

  const missingIds = families.filter((row) => row.honesty === 'Missing' || row.amount == null).map((row) => row.id);
  const ready = families.filter((row) => row.amount != null);
  const allReady = missingIds.length === 0 && ready.length === families.length;
  const anyEstimated = families.some((row) => row.honesty === 'Estimated');

  let cogsTotal: number | null = null;
  let primePct: number | null = null;
  let honesty: LastWeekHonesty = 'Missing';

  if (allReady && weekSales != null && weekSales > 0) {
    const cogs = families
      .filter((row) => row.id !== 'week-sales')
      .reduce((sum, row) => sum + (row.amount ?? 0), 0);
    cogsTotal = Math.round(cogs * 100) / 100;
    primePct = Math.round((cogsTotal / weekSales) * 10000) / 100;
    honesty = anyEstimated ? 'Estimated' : 'Verified';
  }

  const missingLabels = missingIds.map((id) => FAMILY_LABEL[id]).join(', ');
  const headline = honesty === 'Missing'
    ? (missingIds.length === LAST_WEEK_PRIME_FAMILIES.length
      ? 'Missing — last-week prime. Load last-week COGS.'
      : `Missing — last-week prime. Still need ${missingLabels}.`)
    : honesty === 'Verified'
      ? `Verified last-week prime ${primePct}% · band ${LAST_WEEK_PRIME_BAND_MIN}–${LAST_WEEK_PRIME_BAND_MAX}%`
      : `Estimated last-week prime ${primePct}% · band ${LAST_WEEK_PRIME_BAND_MIN}–${LAST_WEEK_PRIME_BAND_MAX}%`;

  const nextLoad = missingIds.length
    ? `Load last-week COGS for: ${missingLabels}. Invoice ≠ COGS. No count → no food / pop / liquor / beer $.`
    : 'Last-week COGS families are on this seat. Incomplete week stays Open if the dates do not match.';

  return {
    bandMin: LAST_WEEK_PRIME_BAND_MIN,
    bandMax: LAST_WEEK_PRIME_BAND_MAX,
    weekSales,
    cogsTotal,
    primePct,
    honesty,
    headline,
    families,
    missingIds,
    nextLoad,
    invented: false,
  };
}

export function emptyLastWeekPrime(): LastWeekPrimeSnapshot {
  return collectLastWeekPrime('demo:empty-prime', []);
}

export function answerLastWeekPrime(snapshot: LastWeekPrimeSnapshot): {
  slug: 'action-shift';
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  sourceTags: SourceTag[];
  verifiedClose: boolean;
  sampleDollars: 'none-verified' | 'prime-verified' | 'prime-estimated';
} {
  const facts = [
    `Action Shift: last-week prime = week sales + COGS (labor, food, pop, liquor, beer). Band ${snapshot.bandMin}–${snapshot.bandMax}%.`,
    ...snapshot.families.map((row) => (
      row.amount != null
        ? `${row.honesty} · ${row.label} ${usd(row.amount)}`
        : `Missing · ${row.label}. ${row.paper}`
    )),
    snapshot.primePct != null && snapshot.weekSales != null && snapshot.cogsTotal != null
      ? `${snapshot.honesty} · math ${usd(snapshot.cogsTotal)} ÷ ${usd(snapshot.weekSales)} × 100 = ${snapshot.primePct}`
      : 'Prime % stays Missing until every family has a same-week dollar. No invented %.',
    'Invoice ≠ COGS. No count → no food / pop / liquor / beer cost.',
  ];

  return {
    slug: 'action-shift',
    headline: snapshot.headline,
    facts,
    coachTomorrow: snapshot.nextLoad,
    needs: snapshot.missingIds.length
      ? `Still NEED last-week COGS: ${snapshot.missingIds.map((id) => FAMILY_LABEL[id]).join(', ')}.`
      : 'Last-week COGS families are present. Keep the same store and week.',
    sourceTags: snapshot.families
      .filter((row) => row.amount != null)
      .map((row) => ({
        tag: row.honesty === 'Verified' ? 'verified' as const : 'estimated' as const,
        source: `last-week-prime:${row.id}`,
      })),
    verifiedClose: snapshot.honesty === 'Verified',
    sampleDollars:
      snapshot.honesty === 'Verified'
        ? 'prime-verified'
        : snapshot.honesty === 'Estimated'
          ? 'prime-estimated'
          : 'none-verified',
  };
}
