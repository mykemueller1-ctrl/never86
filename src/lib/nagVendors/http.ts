import { NextRequest, NextResponse } from 'next/server';
import { SIMPLE_OWNER_COOKIE } from '@/lib/simpleOwnerDemo/types';
import { resolveSimpleOwnerTenant, simpleOwnerCookieOpts } from '@/lib/simpleOwnerDemo/tenant';

// Vendor portal shares the same owner-desk tenant cookie/session as
// simpleOwnerDemo — a vendor list belongs to the same operator, not a
// separate identity.
export async function withNagVendorTenant(
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
