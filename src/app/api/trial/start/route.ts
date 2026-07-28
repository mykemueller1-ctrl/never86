import { NextRequest, NextResponse } from 'next/server';
import { startTrial, TRIAL_DURATION_MS } from '@/lib/trialDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/trial/start
// Starts a new 60-minute trial. Sets a cookie carrying the session token.
// Returns the token + expiry so the UI can render its countdown.
export async function POST(req: NextRequest) {
  const sourceCampaign = req.nextUrl.searchParams.get('utm_campaign') ?? undefined;
  const session = await startTrial({
    sourceCampaign,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Trial unavailable right now.' }, { status: 503 });
  }
  const res = NextResponse.json({
    ok: true,
    token: session.sessionToken,
    expiresAt: session.expiresAt,
    durationMs: TRIAL_DURATION_MS,
  });
  res.cookies.set('n86_trial', session.sessionToken, {
    httpOnly: false, // readable by client so the UI knows the trial is live
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(TRIAL_DURATION_MS / 1000),
  });
  return res;
}
