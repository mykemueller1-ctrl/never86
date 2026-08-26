import { NextResponse } from 'next/server';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { findFreeSeatOperator, isFreeSeatOperatorId } from '@/lib/operatorActivation';
import { loadLatestClose, loadUnattendedGate } from '@/lib/seatCloseStore';
import { intakeMailboxAddress } from '@/lib/closeIntake';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await readOperatorSession();
  if (!session || !isFreeSeatOperatorId(session.operatorId)) {
    return NextResponse.json({ success: false, error: 'Sign in to your free seat first.' }, { status: 401 });
  }

  const operator = await findFreeSeatOperator(session.operatorId).catch(() => null);
  const saved = operator?.locationId
    ? await loadLatestClose(operator.operatorId, operator.locationId).catch(() => null)
    : null;
  const unattended = operator?.locationId
    ? await loadUnattendedGate(operator.operatorId, operator.locationId).catch(() => null)
    : null;

  return NextResponse.json({
    success: true,
    restaurantName: operator?.restaurantName ?? null,
    locationId: operator?.locationId ?? null,
    secondStore: 'paid',
    secondSeat: 'paid',
    forwardTo: intakeMailboxAddress(session.operatorId),
    desk: saved?.desk ?? null,
    closeId: saved?.closeId ?? null,
    unattendedRoutines: unattended
      ? { enabled: false, ready: unattended.ok, reason: unattended.reason, missing: unattended.missing }
      : { enabled: false, ready: false, reason: 'No store yet.' },
  });
}
