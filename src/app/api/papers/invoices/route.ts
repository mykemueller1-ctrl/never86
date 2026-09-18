import { NextRequest, NextResponse } from 'next/server';
import { evaluatePapersInboxEnablement, papersFailClosedBody } from '@/lib/papersInbox';
import { hydratePapersConnection, papersInvoicesFor, pullLastWeekPapers } from '@/lib/papersInboxHttp';
import { papersInvoiceCompare } from '@/lib/papersInvoicePath';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    if (!gate.ready) {
      return NextResponse.json({ ...papersFailClosedBody(), invoices: [], documents: [] }, { status: 503 });
    }
    await hydratePapersConnection(operatorId);
    const invoices = papersInvoicesFor(operatorId);
    const compare = invoices.length ? papersInvoiceCompare(invoices) : null;
    return NextResponse.json({
      success: true,
      ready: gate.ready,
      honesty: compare?.honesty ?? (invoices.length ? 'Estimated' : 'Missing'),
      missingSecrets: gate.missingSecrets,
      error: null,
      invoices: invoices.map((row) => ({
        filename: row.filename,
        text: row.text,
        honesty: row.honesty,
        note: row.note,
        lines: row.lines,
      })),
      documents: compare?.documents ?? invoices.map((row) => ({ text: row.text, filename: row.filename })),
      compare: compare?.compare ?? null,
    });
  });
}

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    if (!gate.ready) return NextResponse.json(papersFailClosedBody(), { status: 503 });
    await hydratePapersConnection(operatorId);
    const pulled = await pullLastWeekPapers({ operatorId });
    return NextResponse.json({
      success: true,
      honesty: pulled.honesty,
      invoices: pulled.invoices.map((row) => ({
        filename: row.filename,
        text: row.text,
        honesty: row.honesty,
        note: row.note,
        lines: row.lines,
      })),
      documents: pulled.compare?.documents ?? [],
      compare: pulled.compare?.compare ?? null,
      nextAction: pulled.nextAction,
    });
  });
}
