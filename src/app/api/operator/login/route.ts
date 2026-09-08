import { NextRequest, NextResponse } from 'next/server';
import {
  findOperatorCredential,
  verifyPassword,
  touchOperatorLogin,
} from '@/lib/operatorAuth';
import {
  findFreeSeatCredential,
  normalizeEmail,
  normalizeRestaurant,
  touchFreeSeatLogin,
} from '@/lib/operatorActivation';
import {
  choosePersonLoginPlane,
  findPersonPassword,
  listAccessibleSeats,
  pickAccessibleSeat,
  publicSeatsForPicker,
  touchPersonLogin,
} from '@/lib/personAuth';
import {
  signOperatorSession,
  operatorSessionSecret,
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_OPTS,
} from '@/lib/operatorSession';
import { pickTrustedClientIp } from '@/lib/trustedClientIp';
import { allowDurableLoginAttempt } from '@/lib/authThrottle';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/operator/login  { email, password, storeName? } -> n86_operator cookie.
// One person password opens each isolated seat attached to that email.
// Magic-link /api/onboard/* stays as backup. A person/Neon hit with a bad
// password never falls through to a different OPS password.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const storeName =
    typeof body?.storeName === 'string'
      ? normalizeRestaurant(body.storeName)
      : typeof body?.restaurantName === 'string'
        ? normalizeRestaurant(body.restaurantName)
        : '';

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Enter your email and password.' }, { status: 400 });
  }
  if (!operatorSessionSecret()) {
    return NextResponse.json(
      { success: false, error: "Operator login isn't switched on yet." },
      { status: 503 },
    );
  }

  const ip = pickTrustedClientIp(req.headers);
  const normalized = normalizeEmail(email);
  if (!(await allowDurableLoginAttempt({ email: normalized, ip }))) {
    return NextResponse.json(
      { success: false, error: 'Too many sign-in attempts. Try again in an hour.' },
      { status: 429 },
    );
  }

  const person = await findPersonPassword(normalized).catch(() => null);
  const free = await findFreeSeatCredential(normalized).catch(() => null);
  const personOk = person ? verifyPassword(password, person.passwordHash) : false;
  const neonOk = free ? verifyPassword(password, free.passwordHash) : false;
  const plane = choosePersonLoginPlane({
    personHash: person?.passwordHash ?? null,
    neonHash: free?.passwordHash ?? null,
    personOk,
    neonOk,
  });

  if (plane === 'deny') {
    return NextResponse.json({ success: false, error: 'Wrong email or password.' }, { status: 401 });
  }

  if (plane === 'person' || plane === 'neon') {
    const seats = await listAccessibleSeats(normalized);
    const picked = pickAccessibleSeat(seats, storeName || undefined);
    if (!picked.ok) {
      if (picked.code === 'pick_store') {
        return NextResponse.json(
          {
            success: false,
            error: 'Pick the store for this sign-in.',
            code: 'pick_store',
            seats: publicSeatsForPicker(picked.seats),
          },
          { status: 409 },
        );
      }
      if (picked.code === 'unknown_store') {
        return NextResponse.json(
          {
            success: false,
            error: 'That store is not on this email.',
            code: 'unknown_store',
            seats: publicSeatsForPicker(picked.seats),
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ success: false, error: 'Wrong email or password.' }, { status: 401 });
    }

    const token = await signOperatorSession(picked.seat.operatorId, normalized, Date.now());
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Operator login isn't switched on yet." },
        { status: 503 },
      );
    }
    touchPersonLogin(normalized).catch(() => {});
    if (picked.seat.plane === 'neon') {
      touchFreeSeatLogin(picked.seat.operatorId, picked.seat.email).catch(() => {});
    } else {
      touchOperatorLogin(picked.seat.operatorId, picked.seat.email).catch(() => {});
    }
    const res = NextResponse.json({
      success: true,
      redirect: OWNER_DESK_POST_AUTH_REDIRECT,
      name: picked.seat.restaurantName,
      seat: picked.seat.plane === 'neon' ? 'free' : 'ops',
      restaurantName: picked.seat.restaurantName,
    });
    res.cookies.set(OPERATOR_COOKIE, token, OPERATOR_COOKIE_OPTS);
    return res;
  }

  const cred = await findOperatorCredential(email).catch(() => null);
  if (!cred || !verifyPassword(password, cred.passwordHash)) {
    return NextResponse.json({ success: false, error: 'Wrong email or password.' }, { status: 401 });
  }

  const token = await signOperatorSession(cred.operatorId, cred.email, Date.now());
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Operator login isn't switched on yet." },
      { status: 503 },
    );
  }

  touchOperatorLogin(cred.operatorId, cred.email).catch(() => {});

  const res = NextResponse.json({
    success: true,
    redirect: OWNER_DESK_POST_AUTH_REDIRECT,
    name: cred.name,
  });
  res.cookies.set(OPERATOR_COOKIE, token, OPERATOR_COOKIE_OPTS);
  return res;
}
