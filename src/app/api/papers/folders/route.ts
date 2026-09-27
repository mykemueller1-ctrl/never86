import { NextRequest, NextResponse } from 'next/server';
import { PAPERS_REQUIRED_SECRET_NAMES, evaluatePapersInboxEnablement, papersFailClosedBody } from '@/lib/papersInbox';
import { connectPapersFolders, hydratePapersConnection, papersFoldersFor } from '@/lib/papersInboxHttp';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    await hydratePapersConnection(operatorId);
    return NextResponse.json({
      success: true,
      honesty: gate.ready ? 'Estimated' : 'Missing',
      missingSecrets: gate.missingSecrets,
      requiredEnv: [...PAPERS_REQUIRED_SECRET_NAMES],
      folders: papersFoldersFor(operatorId),
    });
  });
}

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    if (!gate.ready) return NextResponse.json(papersFailClosedBody(), { status: 503 });
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
