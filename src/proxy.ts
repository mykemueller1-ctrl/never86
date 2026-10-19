import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyOperatorSession, OPERATOR_COOKIE } from '@/lib/operatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import { OWNER_SEAT_LOGIN_HREF, ownerSeatUnauthenticatedRedirect } from '@/lib/ownerSeatGate';
import { canonicalOneDoorUrl, isOneDoorAliasHost } from '@/lib/oneDoor';

const GATED_PREFIXES = [
  '/reports',
  '/command-center',
  '/tools',
  '/admin',
  '/dashboard',
  '/operator',
] as const;

export const config = {
  // Alias hosts need every path. Gated auth still only runs on GATED_PREFIXES.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host');
  if (isOneDoorAliasHost(host)) {
    const { pathname, search } = req.nextUrl;
    return NextResponse.redirect(canonicalOneDoorUrl(pathname, search), 308);
  }

  const { pathname } = req.nextUrl;
  if (!isGatedPath(pathname)) {
    return NextResponse.next();
  }

  const ownerSeatLogin = ownerSeatUnauthenticatedRedirect(pathname);
  if (ownerSeatLogin) {
    const session = await verifyOperatorSession(req.cookies.get(OPERATOR_COOKIE)?.value, Date.now());
    if (session) return NextResponse.next();
    return NextResponse.redirect(new URL(OWNER_SEAT_LOGIN_HREF, req.url));
  }

  if (pathname.startsWith('/reports/login')) {
    return NextResponse.next();
  }

  const adminPw = process.env.ADMIN_PASSWORD;
  const adminToken = adminPw ? await sha256Hex(adminPw) : null;
  const adminCookie = req.cookies.get('n86_admin_auth')?.value;
  const adminOk = !!adminToken && adminCookie === adminToken;

  // Operator portal: /dashboard is gated by the signed per-operator session
  // (each operator sees only their own operator_id). Admins may view it too.
  if (pathname.startsWith('/dashboard')) {
    const session = await verifyOperatorSession(req.cookies.get(OPERATOR_COOKIE)?.value, Date.now());
    if (session || adminOk) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set(
      'next',
      pathname === '/dashboard' || pathname === '/dashboard/'
        ? OWNER_DESK_POST_AUTH_REDIRECT
        : pathname,
    );
    return NextResponse.redirect(url);
  }

  // Internal surfaces (/reports, /command-center, /tools, /admin) stay behind
  // the shared REPORTS_PASSWORD / ADMIN_PASSWORD gate — Myke's own view of every
  // operator. Operators never reach these.
  const reportsPw = process.env.REPORTS_PASSWORD;
  const reportsToken = reportsPw ? await sha256Hex(reportsPw) : null;
  const reportsCookie = req.cookies.get('n86_report_auth')?.value;
  const reportsOk = !!reportsToken && reportsCookie === reportsToken;

  const adminPath = pathname.startsWith('/admin');
  if (adminPath ? adminOk : reportsOk || adminOk) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/reports/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}
