import { NextResponse } from 'next/server';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { findFreeSeatOperator, isFreeSeatOperatorId } from '@/lib/operatorActivation';
import { loadLatestClose, loadUnattendedGate } from '@/lib/seatCloseStore';
import { intakeMailboxAddress } from '@/lib/closeIntake';
import { isCtapSeat1Email } from '@/lib/ctapSeat1';
import { day1StoreTitle } from '@/lib/day1Coach';
import { restaurantNameForOwnerSeat } from '@/lib/ownerSeatGate';

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
    restaurantName: operator
      ? restaurantNameForOwnerSeat({
          signedIn: true,
          ctapOwner: isCtapSeat1Email(session.email),
          restaurantName: day1StoreTitle(operator.restaurantName),
        })
      : null,
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
