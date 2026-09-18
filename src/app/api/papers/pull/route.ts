import { NextRequest, NextResponse } from 'next/server';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';
import { evaluatePapersInboxEnablement, papersFailClosedBody } from '@/lib/papersInbox';
import { pullLastWeekPapers } from '@/lib/papersInboxHttp';

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

    const pulled = await pullLastWeekPapers({ operatorId });
    const landed: string[] = [];
    for (const invoice of pulled.invoices) {
      if (!invoice.filename.trim() || !invoice.text.trim()) continue;
      const bytes = new TextEncoder().encode(invoice.text);
      const result = await service.upload({
        operatorId,
        filename: invoice.filename,
        contentType: 'text/csv',
        bytes,
        restaurantName,
        folder: 'invoice-truck',
      });
      if (result.ok) landed.push(invoice.filename);
    }
    for (const hit of pulled.pulled) {
      if (landed.includes(hit.filename) || !hit.filename.trim()) continue;
      const bytes = new TextEncoder().encode(`papers-inbox:${hit.provider}:${hit.filename}`);
      const result = await service.upload({
        operatorId,
        filename: hit.filename,
        contentType: 'application/octet-stream',
        bytes,
        restaurantName,
        folder: hit.folder === 'labor' ? 'schedule' : hit.folder === 'invoices' || hit.folder === 'liquor-beer' ? 'invoice-truck' : undefined,
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
