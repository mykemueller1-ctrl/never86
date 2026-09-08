import { NextResponse } from 'next/server';
import { OPERATOR_COOKIE, OPERATOR_COOKIE_CLEAR_OPTS } from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/operator/logout — clears the operator session cookie.
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(OPERATOR_COOKIE, '', OPERATOR_COOKIE_CLEAR_OPTS);
  return res;
}
