import { NextRequest, NextResponse } from 'next/server';
import { applyPapersScanEdit, type PapersScanEdit } from '@/lib/papersScanJob';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const body = await req.json().catch(() => null) as PapersScanEdit | null;
    if (!body?.id) {
      return NextResponse.json({ success: false, honesty: 'Missing', error: 'Row id Missing.' }, { status: 400 });
    }
    const row = await applyPapersScanEdit(operatorId, body);
    if (!row) {
      return NextResponse.json({ success: false, honesty: 'Missing', error: 'Row Missing.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, row });
  });
}
