import { NextRequest, NextResponse } from 'next/server';
import { evaluatePapersInboxEnablement, papersGoogleRedirect } from '@/lib/papersInbox';
import { rememberPapersToken } from '@/lib/papersInboxHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = evaluatePapersInboxEnablement();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.never86.ai';
  const fail = new URL('/operator', site);
  fail.searchParams.set('papers', 'closed');
  if (!gate.ready) {
    return NextResponse.redirect(fail);
  }

  const code = req.nextUrl.searchParams.get('code');
  const stateRaw = req.nextUrl.searchParams.get('state');
  if (!code || !stateRaw) {
    return NextResponse.redirect(fail);
  }

  let operatorId = '';
  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8')) as { operatorId?: string };
    operatorId = parsed.operatorId?.trim() || '';
  } catch {
    return NextResponse.redirect(fail);
  }
  if (!operatorId) return NextResponse.redirect(fail);

  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: papersGoogleRedirect(),
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => null);
  if (!tokenRes?.ok) {
    fail.searchParams.set('papers', 'token');
    return NextResponse.redirect(fail);
  }
  const tokenBody = (await tokenRes.json()) as { access_token?: string };
  if (!tokenBody.access_token) {
    fail.searchParams.set('papers', 'token');
    return NextResponse.redirect(fail);
  }

  rememberPapersToken({ operatorId, accessToken: tokenBody.access_token });
  const ok = new URL('/operator', site);
  ok.searchParams.set('papers', 'connected');
  return NextResponse.redirect(ok);
}
