import { NextRequest, NextResponse } from 'next/server';
import { evaluatePapersInboxEnablement } from '@/lib/papersInbox';
import { connectPapersFolders, hydratePapersConnection, papersFoldersFor } from '@/lib/papersInboxHttp';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    await hydratePapersConnection(operatorId);
    return NextResponse.json({
      success: true,
      folders: papersFoldersFor(operatorId),
    });
  });
}

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    if (!gate.ready) return jsonError(503, gate.error ?? 'Drive folders stay off.', 'papers_google_closed');
    await hydratePapersConnection(operatorId);
    const result = await connectPapersFolders(operatorId);
    return NextResponse.json({
      success: true,
      honesty: result.folders.every((folder) => folder.status === 'missing') ? 'Missing' : 'Estimated',
      folders: result.folders,
      note: result.note,
    });
  });
}
