import { NextResponse } from 'next/server';
import {
  PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN,
  evaluateStaffSeatLoginEnablement,
} from '@/lib/staffSeatAuth';
import { attemptLiveStaffSeatLogin } from '@/lib/staffSeatLiveLogin';
import { STAFF_SEAT_COOKIE, STAFF_SEAT_COOKIE_OPTS, signStaffSeatSession } from '@/lib/staffSeatSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' } as const;

function blocked(error: string, privateInputIds: readonly string[]) {
  return NextResponse.json(
    {
      success: false,
      issuance: 'blocked',
      error,
      privateInputIds,
      privateInputs: PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN,
      mailSent: false,
      ownerPlane: '/login',
    },
    { status: 503, headers: NOINDEX },
  );
}

/** Staff login. Fails closed without DATABASE_URL. Goes live only after Neon apply + STAFF_SEAT_LOGIN_ENABLED=true. */
export async function POST(req?: Request) {
  const enablement = evaluateStaffSeatLoginEnablement();
  if (!enablement.ready) {
    return blocked(enablement.error, enablement.privateInputIds);
  }

  const body = req ? await req.json().catch(() => ({})) : {};
  const result = await attemptLiveStaffSeatLogin({
    inviteHandle: body?.inviteHandle,
    deliverySecret: body?.deliverySecret,
  });
  if (!result.ok) {
    return blocked(result.error, enablement.privateInputIds);
  }

  const token = await signStaffSeatSession(result.session, Date.now());
  if (!token) {
    return blocked(
      'Staff login fails closed: STAFF_SEAT_SESSION_SECRET is missing. Owner /login remains owner-only. No mail sent.',
      enablement.privateInputIds,
    );
  }

  const res = NextResponse.json(
    {
      success: true,
      issuance: result.issuance,
      mailSent: false,
      grantsFullOperatorAccess: false,
      seatKey: result.session.seatKey,
      redirect: '/staff/desk',
    },
    { status: 200, headers: NOINDEX },
  );
  res.cookies.set(STAFF_SEAT_COOKIE, token, STAFF_SEAT_COOKIE_OPTS);
  return res;
}

export async function GET() {
  const enablement = evaluateStaffSeatLoginEnablement();
  return blocked(
    enablement.ready
      ? 'Staff login is POST only. Owner /login remains owner-only. No mail sent.'
      : enablement.error,
    enablement.privateInputIds,
  );
}
