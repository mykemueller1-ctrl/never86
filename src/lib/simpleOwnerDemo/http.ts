import { NextRequest, NextResponse } from 'next/server';
import { restaurantNameHintFromOperatorId } from '@/lib/seatIsolation';
import { SIMPLE_OWNER_COOKIE } from './types';
import { resolveSimpleOwnerTenant, simpleOwnerCookieOpts } from './tenant';

async function restaurantNameForTenant(operatorId: string): Promise<string | undefined> {
  const hint = restaurantNameHintFromOperatorId(operatorId);
  if (hint) return hint;
  const m = /^seat:(\d+)$/.exec(operatorId);
  if (!m) return undefined;
  try {
    const { findFreeSeatOperator } = await import('@/lib/operatorActivation');
    const op = await findFreeSeatOperator(Number(m[1]));
    return op?.restaurantName || undefined;
  } catch {
    return undefined;
  }
}

export async function withSimpleOwnerTenant(
  req: NextRequest,
  handler: (operatorId: string, restaurantName?: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const tenant = await resolveSimpleOwnerTenant(req.cookies);
  const restaurantName = await restaurantNameForTenant(tenant.operatorId);
  const response = await handler(tenant.operatorId, restaurantName);
  if (tenant.cookieValue) {
    response.cookies.set(SIMPLE_OWNER_COOKIE, tenant.cookieValue, simpleOwnerCookieOpts());
  }
  return response;
}

export function jsonError(status: number, error: string, code: string): NextResponse {
  return NextResponse.json({ success: false, error, code }, { status });
}
