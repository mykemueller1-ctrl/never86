import { NextRequest, NextResponse } from 'next/server';
import { adminOk } from '@/lib/adminBearerAuth';
import { retireNativeOperator } from '@/lib/personAuth';
import { neonConfigured } from '@/lib/operatorActivation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/retire-operator
 * { email, operatorId }
 *
 * Owner-session / bearer admin. Re-points native seat_operators.email and
 * matching seat_credentials.email off this person, then deletes
 * seat_person_access. Does not delete the store.
 *
 * Fun 1000000: person-access detach is not enough — listAccessibleSeats
 * still includes native email ownership.
 */
export async function POST(req: NextRequest) {
  if (!(await adminOk(req))) {
    return NextResponse.json({ success: false, error: 'Not authorized.' }, { status: 401 });
  }
  if (!neonConfigured()) {
    return NextResponse.json({ success: false, error: 'Primary database (Neon) is not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const operatorId = Number.parseInt(String(body?.operatorId ?? ''), 10);

  const result = await retireNativeOperator(email, operatorId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    email: email.trim().toLowerCase(),
    operatorId,
    retired: true,
    nativeRetired: result.nativeRetired,
    retiredEmail: result.retiredEmail,
  });
}
