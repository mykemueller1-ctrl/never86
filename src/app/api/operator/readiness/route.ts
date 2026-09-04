import { NextRequest, NextResponse } from 'next/server';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const service = getSimpleOwnerDemoService();
    if (isServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }
    const readiness = await service.readiness(operatorId);
    return NextResponse.json({
      success: true,
      operatorId,
      readiness,
    });
  });
}
