import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Gate every /reports/* page behind a shared password. The marketing site is
// public; operator reports (real sales data) must not be.
export const config = { matcher: ['/reports/:path*', '/command-center/:path*'] };

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page itself must stay reachable.
  if (pathname.startsWith('/reports/login')) {
    return NextResponse.next();
  }

  const password = process.env.REPORTS_PASSWORD;
  const cookie = req.cookies.get('n86_report_auth')?.value;

  if (password && cookie && cookie === (await sha256Hex(password))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/reports/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}
