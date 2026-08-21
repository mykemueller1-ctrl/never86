import { NextResponse } from 'next/server';
import { findOperatorCredential, verifyPassword, touchOperatorLogin } from '@/lib/operatorAuth';
import {
  signOperatorSession,
  operatorSessionSecret,
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_OPTS,
} from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/operator/login  { email, password } -> sets the signed operator
// session cookie (carrying only their operator_id) and returns { redirect }.
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
