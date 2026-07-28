import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function tokenFor(pw: string): string {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';
  const reportsPw = process.env.REPORTS_PASSWORD;
  const adminPw = process.env.ADMIN_PASSWORD;

  if (!reportsPw && !adminPw) {
    return NextResponse.json(
      { success: false, error: 'Access is not configured yet.' },
      { status: 503 }
    );
  }

  const isAdmin = !!adminPw && safeEqual(password, adminPw);
  const isReports = !!reportsPw && safeEqual(password, reportsPw);

  if (!isAdmin && !isReports) {
    return NextResponse.json({ success: false, error: 'Incorrect password.' }, { status: 401 });
  }

  const role = isAdmin ? 'admin' : 'operator';
  const defaultNext = isAdmin ? '/admin/never86' : '/command-center';
  const res = NextResponse.json({ success: true, role, defaultNext });

  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 12,
  };

  if (isReports && reportsPw) {
    res.cookies.set('n86_report_auth', tokenFor(reportsPw), cookieOpts);
  }
  if (isAdmin && adminPw) {
    res.cookies.set('n86_admin_auth', tokenFor(adminPw), cookieOpts);
    if (reportsPw) {
      res.cookies.set('n86_report_auth', tokenFor(reportsPw), cookieOpts);
    }
  }
  return res;
}
