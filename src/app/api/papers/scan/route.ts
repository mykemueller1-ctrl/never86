import { NextRequest, NextResponse } from 'next/server';
import { evaluatePapersInboxEnablement, papersFailClosedBody } from '@/lib/papersInbox';
import { fixturePapersScanRows, PAPERS_SCAN_FIXTURE_BANNER } from '@/lib/papersScanFixtures';
import {
  allowPapersRescan,
  drainPapersScan,
  enqueuePapersScan,
  hydratePapersScan,
  papersScanSnapshot,
} from '@/lib/papersScanJob';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('fixture') === '1') {
    return NextResponse.json({
      success: true,
      fixture: true,
      honesty: 'Estimated',
      note: PAPERS_SCAN_FIXTURE_BANNER,
      job: null,
      rows: fixturePapersScanRows(),
    });
  }
  return withSimpleOwnerTenant(req, async (operatorId) => {
    await hydratePapersScan(operatorId);
    const snap = papersScanSnapshot(operatorId);
    return NextResponse.json({
      success: true,
      fixture: false,
      job: snap.job,
      rows: snap.rows,
    });
  });
}

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    if (!gate.ready) return NextResponse.json(papersFailClosedBody(), { status: 503 });
    const body = await req.json().catch(() => ({})) as { force?: boolean };
    if (body.force) allowPapersRescan(operatorId);
    enqueuePapersScan(operatorId);
    const job = await drainPapersScan({ operatorId });
    const snap = papersScanSnapshot(operatorId);
    return NextResponse.json({ success: true, fixture: false, job, rows: snap.rows });
  });
}
