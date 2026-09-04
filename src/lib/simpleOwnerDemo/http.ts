import { NextRequest, NextResponse } from 'next/server';
import { SIMPLE_OWNER_COOKIE } from './types';
import { resolveSimpleOwnerTenant, simpleOwnerCookieOpts } from './tenant';

export async function withSimpleOwnerTenant(
  req: NextRequest,
  handler: (operatorId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const tenant = await resolveSimpleOwnerTenant(req.cookies);
  const response = await handler(tenant.operatorId);
  if (tenant.cookieValue) {
    response.cookies.set(SIMPLE_OWNER_COOKIE, tenant.cookieValue, simpleOwnerCookieOpts());
  }
  return response;
}

export function jsonError(status: number, error: string, code: string): NextResponse {
  return NextResponse.json({ success: false, error, code }, { status });
}
