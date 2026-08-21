import { NextResponse } from 'next/server';
import { OPERATOR_COOKIE } from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/operator/logout — clears the operator session cookie.
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(OPERATOR_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
