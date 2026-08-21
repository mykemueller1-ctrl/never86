import { NextRequest, NextResponse } from 'next/server';
import { runRefundAuditor } from '@/lib/refundAuditorCsv';
import { logVisitorEvent } from '@/lib/leadCapture';
import { readCsvFromRequest } from '@/lib/csv/request';
import { saveTrialRun } from '@/lib/trialRunsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/connect/refund-auditor
// Accepts json {csv}, a multipart file, or raw text. Runs the CSV-based Refund
// Auditor and returns the analysis. No DB write / lead capture here.
export async function POST(req: NextRequest) {
  try {
    const parsed = await readCsvFromRequest(req);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
    }
    const { csv, filename } = parsed;

    const result = runRefundAuditor(csv);

    logVisitorEvent({
      eventType: 'connect_agent_run',
      pagePath: '/connect/refund-auditor',
      agentName: 'Refund Auditor',
      audience: 'owner',
      meta: 'rowsParsed' in result ? { rowsParsed: result.rowsParsed, storesFlagged: result.storesFlagged } : { error: result.error },
    }).catch(() => {});

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    let shareToken: string | undefined;
    const trialCookie = req.cookies.get('n86_trial')?.value;
    if (trialCookie) {
      const saved = await saveTrialRun({
        sessionToken: trialCookie,
        agent: 'refund-auditor',
        filename,
        rowsParsed: result.rowsParsed,
        result,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      });
      shareToken = saved?.shareToken;
    }

    return NextResponse.json({ ok: true, shareToken, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to process CSV';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
