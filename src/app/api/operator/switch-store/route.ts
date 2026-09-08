import { NextRequest, NextResponse } from 'next/server';
import { listAccessibleSeats, pickAccessibleSeat } from '@/lib/personAuth';
import { normalizeRestaurant } from '@/lib/operatorActivation';
import {
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_OPTS,
  signOperatorSession,
  verifyOperatorSession,
} from '@/lib/operatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/operator/switch-store  { storeName | restaurantName }
// Same signed-in email. No second password. Isolated operatorId cookie.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sign in first.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const storeName =
    typeof body?.storeName === 'string'
      ? normalizeRestaurant(body.storeName)
      : typeof body?.restaurantName === 'string'
        ? normalizeRestaurant(body.restaurantName)
        : '';
  if (!storeName) {
    return NextResponse.json({ success: false, error: 'Pick a store.' }, { status: 400 });
  }

  const seats = await listAccessibleSeats(session.email);
  const picked = pickAccessibleSeat(seats, storeName);
  if (!picked.ok) {
    return NextResponse.json(
      { success: false, error: 'That store is not on this email.', code: picked.code },
      { status: 409 },
    );
  }

  const next = await signOperatorSession(picked.seat.operatorId, session.email, Date.now());
  if (!next) {
    return NextResponse.json(
      { success: false, error: "Operator login isn't switched on yet." },
      { status: 503 },
    );
  }

  const res = NextResponse.json({
    success: true,
    redirect: OWNER_DESK_POST_AUTH_REDIRECT,
    restaurantName: picked.seat.restaurantName,
  });
  res.cookies.set(OPERATOR_COOKIE, next, OPERATOR_COOKIE_OPTS);
  return res;
}
