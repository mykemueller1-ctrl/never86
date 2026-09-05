import { and, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { nagWeeklyPrimeCost, seatCloses, seatLocations } from '@/db/schema';
import { neonConfigured } from '@/lib/operatorActivation';
import type { DeskClose } from '@/lib/deskClose';
import { previousIsoWeekRange, rollupWeekFromCloses } from './nagWeeklyPrimeCost';

function tableMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /nag_weekly_prime_cost|seat_closes|seat_locations|relation .* does not exist/i.test(msg);
}

/** Roll up one operator+location's just-completed week into a persistent
 * `nag_weekly_prime_cost` row (insert or update — idempotent per week). */
export async function runWeeklyPrimeCostRollup(input: {
  operatorId: number;
  locationId: number;
  now?: Date;
}): Promise<{ persisted: boolean; rollup: ReturnType<typeof rollupWeekFromCloses> | null }> {
  if (!neonConfigured()) return { persisted: false, rollup: null };
  const now = input.now ?? new Date();
  const { weekStart, weekEnd } = previousIsoWeekRange(now);

  try {
    const rows = await db
      .select({ businessDate: seatCloses.businessDate, desk: seatCloses.desk })
      .from(seatCloses)
      .where(
        and(
          gte(seatCloses.businessDate, weekStart),
          lte(seatCloses.businessDate, weekEnd),
        ),
      );

    const closes = rows
      .filter((row) => row.businessDate != null)
      .map((row) => ({ businessDate: row.businessDate as string, desk: row.desk as DeskClose }));

    const rollup = rollupWeekFromCloses(closes, weekStart, weekEnd);

    await db
      .insert(nagWeeklyPrimeCost)
      .values({
        operatorId: input.operatorId,
        locationId: input.locationId,
        weekStart: rollup.weekStart,
        weekEnd: rollup.weekEnd,
        grossSales: String(rollup.grossSales),
        laborCost: String(rollup.laborCost),
        voidsTotal: String(rollup.voidsTotal),
        cashVariance: String(rollup.cashVariance),
        primeCostPercent: rollup.primeCostPercent == null ? null : String(rollup.primeCostPercent),
        daysWithData: rollup.daysWithData,
        sourceTags: rollup.sourceTags,
      })
      .onConflictDoUpdate({
        target: [nagWeeklyPrimeCost.operatorId, nagWeeklyPrimeCost.locationId, nagWeeklyPrimeCost.weekStart],
        set: {
          grossSales: String(rollup.grossSales),
          laborCost: String(rollup.laborCost),
          voidsTotal: String(rollup.voidsTotal),
          cashVariance: String(rollup.cashVariance),
          primeCostPercent: rollup.primeCostPercent == null ? null : String(rollup.primeCostPercent),
          daysWithData: rollup.daysWithData,
          sourceTags: rollup.sourceTags,
        },
      });

    return { persisted: true, rollup };
  } catch (err) {
    if (tableMissing(err)) return { persisted: false, rollup: null };
    throw err;
  }
}

/** Run the rollup for every free-seat operator+location on file. Best-effort
 * per row — one bad seat does not block the rest. */
export async function runWeeklyPrimeCostRollupForAllSeats(
  now = new Date(),
): Promise<{ ranFor: number; persisted: number; errors: number }> {
  if (!neonConfigured()) return { ranFor: 0, persisted: 0, errors: 0 };
  try {
    const locations = await db
      .select({ operatorId: seatLocations.operatorId, id: seatLocations.id })
      .from(seatLocations);

    let persisted = 0;
    let errors = 0;
    for (const loc of locations) {
      try {
        const result = await runWeeklyPrimeCostRollup({
          operatorId: loc.operatorId,
          locationId: loc.id,
          now,
        });
        if (result.persisted) persisted += 1;
      } catch {
        errors += 1;
      }
    }
    return { ranFor: locations.length, persisted, errors };
  } catch (err) {
    if (tableMissing(err)) return { ranFor: 0, persisted: 0, errors: 0 };
    throw err;
  }
}
