import { NextRequest, NextResponse } from 'next/server';
import { OWNER_DESK_TRAY, type OwnerDeskTrayId } from '@/lib/freeOperatorDemo';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';
import type { AskMouth } from '@/lib/simpleOwnerDemo/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRAYS = new Set(OWNER_DESK_TRAY.map((row) => row.id));
const MOUTHS = new Set<AskMouth>(['talk', 'type', 'photo', 'file']);

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const service = getSimpleOwnerDemoService();
    if (isServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }

    const body = (await req.json().catch(() => null)) as {
      question?: unknown;
      tray?: unknown;
      mouth?: unknown;
    } | null;
    const question = typeof body?.question === 'string' ? body.question : '';
    const tray = TRAYS.has(body?.tray as OwnerDeskTrayId) ? (body?.tray as OwnerDeskTrayId) : 'action';
    const mouth = MOUTHS.has(body?.mouth as AskMouth) ? (body?.mouth as AskMouth) : 'type';

    const result = await service.ask({ operatorId, question, tray, mouth });
    if (!result.ok) {
      return jsonError(result.status, result.error, result.code);
    }

    return NextResponse.json({
      success: true,
      operatorId,
      persisted: true,
      askId: result.record.id,
      sourceTags: result.answer.sourceTags,
      answer: result.answer,
      readiness: result.readiness,
    });
  });
}
