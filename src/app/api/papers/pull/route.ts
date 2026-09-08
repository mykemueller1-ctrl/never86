import { NextRequest, NextResponse } from 'next/server';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';
import { pullLastWeekPapers } from '@/lib/papersInboxHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId, restaurantName) => {
    const service = getSimpleOwnerDemoService();
    if (isServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }

    const pulled = await pullLastWeekPapers({ operatorId });
    const landed: string[] = [];
    for (const hit of pulled.pulled) {
      if (!hit.filename.trim()) continue;
      const bytes = new TextEncoder().encode(`papers-inbox:${hit.provider}:${hit.filename}`);
      const result = await service.upload({
        operatorId,
        filename: hit.filename,
        contentType: 'application/octet-stream',
        bytes,
        restaurantName,
      });
      if (result.ok) landed.push(hit.filename);
    }

    const readiness = await service.readiness(operatorId, restaurantName);
    return NextResponse.json({
      success: true,
      honesty: landed.length ? pulled.honesty : 'Missing',
      pulled: pulled.pulled,
      landed,
      skipped: pulled.skipped,
      nextAction: landed.length
        ? `Received ${landed.length} paper${landed.length === 1 ? '' : 's'} from Gmail / Drive: ${landed.join(', ')}.`
        : pulled.nextAction,
      readiness,
    });
  });
}
