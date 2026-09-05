import { NextRequest, NextResponse } from 'next/server';
import { setFreeSeatPassword } from '@/lib/operatorActivation';
import { OPERATOR_COOKIE, verifyOperatorSession } from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/operator/set-password  { password }
// Requires an existing signed operator session cookie. Lets a returning
// owner set their own password once so future sign-ins can use
// email+password instead of a fresh magic-link email every visit.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sign in first.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';

  const result = await setFreeSeatPassword(session.operatorId, session.email, password);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
