import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';
  const expected = process.env.REPORTS_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { success: false, error: 'Reports access is not configured yet (set REPORTS_PASSWORD).' },
      { status: 503 }
    );
  }

  if (password !== expected) {
    return NextResponse.json({ success: false, error: 'Incorrect password.' }, { status: 401 });
  }

  const token = crypto.createHash('sha256').update(expected).digest('hex');
  const res = NextResponse.json({ success: true });
  res.cookies.set('n86_report_auth', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
