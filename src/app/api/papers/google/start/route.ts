import { NextRequest, NextResponse } from 'next/server';
import { evaluatePapersInboxEnablement, papersFailClosedBody } from '@/lib/papersInbox';
import { startPapersGoogleOAuth } from '@/lib/papersInboxHttp';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mintState(operatorId: string): string {
  return Buffer.from(JSON.stringify({ operatorId, n: Date.now() }), 'utf8').toString('base64url');
}

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    if (!gate.ready) {
      return NextResponse.json(papersFailClosedBody(), { status: 503 });
    }
    const started = startPapersGoogleOAuth({ state: mintState(operatorId) });
    if (!started.ok) return jsonError(503, started.error, 'papers_google_closed');
    return NextResponse.json({
      success: true,
      authorizationUrl: started.authorizationUrl,
      googleFirst: true,
    });
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
