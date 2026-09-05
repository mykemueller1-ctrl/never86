import type { DeskClose } from '@/lib/deskClose';
import type { TagLevel } from '@/lib/sourceTags';

export type NagWeeklyPrimeCostSourceTag = { tag: TagLevel; source: string };

export type NagWeeklyPrimeCostRollup = {
  weekStart: string;
  weekEnd: string;
  grossSales: number;
  laborCost: number;
  voidsTotal: number;
  cashVariance: number;
  primeCostPercent: number | null;
  daysWithData: number;
  sourceTags: NagWeeklyPrimeCostSourceTag[];
};

/** Monday 00:00Z through Sunday 23:59Z of the ISO week containing `reference`. */
export function isoWeekRange(reference: Date): { weekStart: string; weekEnd: string } {
  const day = reference.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { weekStart: isoDate(monday), weekEnd: isoDate(sunday) };
}

/** The most recently completed ISO week (Mon–Sun) as of `now` — for a job that
 * runs each Monday to roll up the week that just ended. */
export function previousIsoWeekRange(now: Date): { weekStart: string; weekEnd: string } {
  const lastWeek = new Date(now);
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
  return isoWeekRange(lastWeek);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function cashVarianceFromDesk(desk: DeskClose): number {
  const action = desk.actionShift?.morningActions.find((a) => a.id === 'cash-proof');
  return action?.dollarsObserved ?? 0;
}

/** Pure rollup: sums sales/labor/voids/cash-variance across a week's closes. No
 * I/O — the DB-backed wrapper in this module fetches `seatCloses` rows and
 * calls this. */
export function rollupWeekFromCloses(
  closes: { businessDate: string; desk: DeskClose }[],
  weekStart: string,
  weekEnd: string,
): NagWeeklyPrimeCostRollup {
  const inWeek = closes.filter((c) => c.businessDate >= weekStart && c.businessDate <= weekEnd);

  let grossSales = 0;
  let laborCost = 0;
  let voidsTotal = 0;
  let cashVariance = 0;
  let daysWithData = 0;
  let anyMissingEvidence = false;

  for (const { desk } of inWeek) {
    const hasSales = desk.sales.value != null;
    if (hasSales) daysWithData += 1;
    if (desk.sales.value != null) grossSales += desk.sales.value;
    if (desk.labor.value != null) laborCost += desk.labor.value;
    if (desk.voids.value != null) voidsTotal += desk.voids.value;
    cashVariance += cashVarianceFromDesk(desk);
    if (desk.missingEvidence.length > 0) anyMissingEvidence = true;
  }

  const primeCostPercent = grossSales > 0 ? Number(((laborCost / grossSales) * 100).toFixed(2)) : null;

  const sourceTags: NagWeeklyPrimeCostSourceTag[] = [
    { tag: 'verified', source: 'seat_closes (POS Z/hourly/void-promo close)' },
    {
      tag: 'estimated',
      source: 'prime_cost_percent = labor / gross sales (COGS not wired; labor-only proxy)',
    },
  ];
  if (anyMissingEvidence || daysWithData === 0) {
    sourceTags.push({ tag: 'unverified', source: 'one or more days in this week had missing evidence' });
  }

  return {
    weekStart,
    weekEnd,
    grossSales: Number(grossSales.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    voidsTotal: Number(voidsTotal.toFixed(2)),
    cashVariance: Number(cashVariance.toFixed(2)),
    primeCostPercent,
    daysWithData,
    sourceTags,
  };
}
