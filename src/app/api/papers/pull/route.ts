import { NextRequest, NextResponse } from 'next/server';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';
import { evaluatePapersInboxEnablement, papersFailClosedBody } from '@/lib/papersInbox';
import { pullLastWeekPapers } from '@/lib/papersInboxHttp';
import { papersSkuFailureMessage } from '@/lib/papersSkuStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId, restaurantName) => {
    const gate = evaluatePapersInboxEnablement();
    if (!gate.ready) return NextResponse.json(papersFailClosedBody(), { status: 503 });
    const service = getSimpleOwnerDemoService();
    if (isServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }

    let pulled;
    try {
      pulled = await pullLastWeekPapers({ operatorId });
    } catch (error) {
      const message = papersSkuFailureMessage(error);
      if (message) return NextResponse.json({ success: false, honesty: 'Missing', error: message }, { status: 503 });
      throw error;
    }
    const landed: string[] = [];
    const saved = {
      documents: pulled.compare?.documents ?? [],
      compare: pulled.compare?.compare ?? null,
    };
    const uploadFailed = (error: string) => NextResponse.json({
      success: false,
      honesty: 'Missing' as const,
      error: `Papers were saved. The desk upload did not land. ${error}`,
      code: 'papers_upload_failed',
      landed,
      ...saved,
    }, { status: 503 });
    const land = async (input: {
      filename: string;
      contentType: string;
      bytes: Uint8Array;
      folder?: string;
    }) => {
      try {
        const result = await service.upload({
          operatorId,
          filename: input.filename,
          contentType: input.contentType,
          bytes: input.bytes,
          restaurantName,
          folder: input.folder,
        });
        if (!result.ok) return uploadFailed(result.error);
        landed.push(input.filename);
        return null;
      } catch {
        return uploadFailed('Desk upload did not land.');
      }
    };
    for (const invoice of pulled.invoices) {
      if (!invoice.filename.trim() || !invoice.text.trim()) continue;
      const failed = await land({
        filename: invoice.filename,
        contentType: 'text/csv',
        bytes: new TextEncoder().encode(invoice.text),
        folder: 'invoice-truck',
      });
      if (failed) return failed;
    }
    for (const hit of pulled.pulled) {
      if (landed.includes(hit.filename) || !hit.filename.trim()) continue;
      const failed = await land({
        filename: hit.filename,
        contentType: 'application/octet-stream',
        bytes: new TextEncoder().encode(`papers-inbox:${hit.provider}:${hit.filename}`),
        folder: hit.folder === 'labor' ? 'schedule' : hit.folder === 'invoices' || hit.folder === 'liquor-beer' ? 'invoice-truck' : undefined,
      });
      if (failed) return failed;
    }

    const readiness = await service.readiness(operatorId, restaurantName);
    return NextResponse.json({
      success: true,
      honesty: landed.length ? pulled.honesty : 'Missing',
      pulled: pulled.pulled,
      landed,
      skipped: pulled.skipped,
      invoices: pulled.invoices.map((row) => ({
        filename: row.filename,
        honesty: row.honesty,
        note: row.note,
        lines: row.lines,
        text: row.text,
      })),
      documents: pulled.compare?.documents ?? [],
      compare: pulled.compare?.compare ?? null,
      folders: pulled.folders,
      nextAction: landed.length
        ? pulled.nextAction
        : pulled.nextAction,
      readiness,
    });
  });
}
