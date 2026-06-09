import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/reports/:path*', '/command-center/:path*', '/tools/:path*', '/admin/:path*'],
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/reports/login')) {
    return NextResponse.next();
  }

  const adminPath = pathname.startsWith('/admin');
  const adminPw = process.env.ADMIN_PASSWORD;
  const reportsPw = process.env.REPORTS_PASSWORD;

  const adminToken = adminPw ? await sha256Hex(adminPw) : null;
  const reportsToken = reportsPw ? await sha256Hex(reportsPw) : null;
  const adminCookie = req.cookies.get('n86_admin_auth')?.value;
  const reportsCookie = req.cookies.get('n86_report_auth')?.value;

  const adminOk = adminToken && adminCookie === adminToken;
  const reportsOk = reportsToken && reportsCookie === reportsToken;

  if (adminPath ? adminOk : (reportsOk || adminOk)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/reports/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}
