import { NextRequest, NextResponse } from 'next/server';
import { evaluatePapersInboxEnablement, outlookV2Plan, papersIntakeCopy } from '@/lib/papersInbox';
import { papersConnectionFor } from '@/lib/papersInboxHttp';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    const copy = papersIntakeCopy();
    return NextResponse.json({
      success: true,
      intakeOrder: ['gmail', 'photo', 'chat'],
      googleFirst: true,
      ready: gate.ready,
      error: gate.error,
      connection: papersConnectionFor(operatorId),
      copy,
      outlook: outlookV2Plan(),
    });
  });
}
