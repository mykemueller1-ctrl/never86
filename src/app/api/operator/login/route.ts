import { NextResponse } from 'next/server';
import {
  findOperatorCredential,
  verifyPassword,
  touchOperatorLogin,
} from '@/lib/operatorAuth';
import {
  findFreeSeatCredential,
  touchFreeSeatLogin,
} from '@/lib/operatorActivation';
import {
  signOperatorSession,
  operatorSessionSecret,
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_OPTS,
} from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/operator/login  { email, password } -> sets the signed operator
// session cookie. Prefers Neon free-seat credentials (Monday gate), then OPS.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Enter your email and password.' }, { status: 400 });
  }
  if (!operatorSessionSecret()) {
    return NextResponse.json(
      { success: false, error: "Operator login isn't switched on yet." },
      { status: 503 },
    );
  }

  const free = await findFreeSeatCredential(email).catch(() => null);
  if (free && verifyPassword(password, free.passwordHash)) {
    const token = await signOperatorSession(free.operatorId, free.email, Date.now());
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Operator login isn't switched on yet." },
        { status: 503 },
      );
    }
    touchFreeSeatLogin(free.operatorId, free.email).catch(() => {});
    const res = NextResponse.json({
      success: true,
      redirect: '/dashboard',
      name: free.name,
      seat: 'free',
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

  const res = NextResponse.json({ success: true, redirect: '/dashboard', name: cred.name });
  res.cookies.set(OPERATOR_COOKIE, token, OPERATOR_COOKIE_OPTS);
  return res;
}
