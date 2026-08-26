import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { seatCloses, seatIntakeEvents, seatProofs } from '../db/schema';
import { neonConfigured } from './operatorActivation';
import type { DeskClose } from './deskClose';
import type { PdqReportFamily } from './pdqEodParse';
import type { IntakeDocument } from './closeIntake';
import { unattendedRoutineGate, type SuccessfulParse } from './unattendedRoutineGate';
import { describeDocumentParse } from './intakeParseRecord';

function tableMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /seat_closes|seat_intake_events|seat_proofs|relation .* does not exist/i.test(msg);
}

export async function recordIntakeAndClose(input: {
  operatorId: number;
  locationId: number;
  docs: IntakeDocument[];
  desk: DeskClose;
}): Promise<{ closeId: number | null; persisted: boolean }> {
  if (!neonConfigured()) return { closeId: null, persisted: false };
  try {
    for (const doc of input.docs) {
      const parsed = describeDocumentParse(doc);
      await db.insert(seatIntakeEvents).values({
        operatorId: input.operatorId,
        locationId: input.locationId,
        channel: doc.channel,
        sourceFilename: doc.filename ?? null,
        sourceFrom: doc.from ?? null,
        reportFamily: parsed.family,
        businessDate: parsed.businessDate || null,
        payload: {
          textBytes: Buffer.byteLength(doc.text, 'utf8'),
          injectionSuspected: input.desk.injectionSuspected,
          parsedBusinessDate: parsed.businessDate || null,
          rejectedReason: parsed.rejectedReason,
        },
        injectionSuspected: parsed.rejectedReason === 'injection' || input.desk.injectionSuspected,
        rejectedReason: parsed.rejectedReason,
      });
    }

    const existing = await db
      .select({ id: seatCloses.id })
      .from(seatCloses)
      .where(
        and(
          eq(seatCloses.operatorId, input.operatorId),
          eq(seatCloses.locationId, input.locationId),
          eq(seatCloses.businessDate, input.desk.businessDate || '1970-01-01'),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(seatCloses)
        .set({ desk: input.desk })
        .where(eq(seatCloses.id, existing[0].id));
      return { closeId: existing[0].id, persisted: true };
    }

    const inserted = await db
      .insert(seatCloses)
      .values({
        operatorId: input.operatorId,
        locationId: input.locationId,
        businessDate: input.desk.businessDate || '1970-01-01',
        desk: input.desk,
      })
      .returning({ id: seatCloses.id });
    return { closeId: inserted[0]?.id ?? null, persisted: true };
  } catch (err) {
    if (tableMissing(err)) return { closeId: null, persisted: false };
    throw err;
  }
}

export async function loadLatestClose(operatorId: number, locationId: number): Promise<{
  closeId: number;
  desk: DeskClose;
} | null> {
  if (!neonConfigured()) return null;
  try {
    const rows = await db
      .select({ id: seatCloses.id, desk: seatCloses.desk })
      .from(seatCloses)
      .where(and(eq(seatCloses.operatorId, operatorId), eq(seatCloses.locationId, locationId)))
      .orderBy(desc(seatCloses.createdAt))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { closeId: row.id, desk: row.desk as DeskClose };
  } catch (err) {
    if (tableMissing(err)) return null;
    throw err;
  }
}

export async function recordProof(input: {
  operatorId: number;
  closeId: number;
  actionId: string;
  outcome: string;
  proofKind: string;
  proofNote?: string;
}): Promise<boolean> {
  if (!neonConfigured()) return false;
  try {
    await db.insert(seatProofs).values({
      operatorId: input.operatorId,
      closeId: input.closeId,
      actionId: input.actionId,
      outcome: input.outcome,
      proofKind: input.proofKind,
      proofNote: input.proofNote ?? null,
    });
    return true;
  } catch (err) {
    if (tableMissing(err)) return false;
    throw err;
  }
}

export async function loadSuccessfulParses(operatorId: number, locationId: number): Promise<SuccessfulParse[]> {
  if (!neonConfigured()) return [];
  try {
    const rows = await db
      .select({
        family: seatIntakeEvents.reportFamily,
        businessDate: seatIntakeEvents.businessDate,
        rejectedReason: seatIntakeEvents.rejectedReason,
        injectionSuspected: seatIntakeEvents.injectionSuspected,
      })
      .from(seatIntakeEvents)
      .where(and(eq(seatIntakeEvents.operatorId, operatorId), eq(seatIntakeEvents.locationId, locationId)));

    return rows.map((row) => ({
      family: (row.family || 'unknown') as PdqReportFamily,
      businessDate: row.businessDate || '',
      rejected: Boolean(row.rejectedReason) || Boolean(row.injectionSuspected),
    }));
  } catch (err) {
    if (tableMissing(err)) return [];
    throw err;
  }
}

export async function loadUnattendedGate(operatorId: number, locationId: number) {
  const parses = await loadSuccessfulParses(operatorId, locationId);
  return unattendedRoutineGate(parses);
}
