import { NextRequest, NextResponse } from 'next/server';
import { runThreePFeeFinder } from '@/lib/threePFeeFinderCsv';
import { logVisitorEvent } from '@/lib/leadCapture';
import { readCsvFromRequest } from '@/lib/csv/request';
import { saveTrialRun } from '@/lib/trialRunsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const parsed = await readCsvFromRequest(req);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
    }
    const result = runThreePFeeFinder(parsed.csv);
    logVisitorEvent({
      eventType: 'connect_agent_run',
      pagePath: '/connect/3p-fee-finder',
      agentName: '3P Fee Finder',
      audience: 'cfo',
      meta: 'rowsParsed' in result ? { rowsParsed: result.rowsParsed } : { error: result.error },
    }).catch(() => {});
    if ('error' in result) return NextResponse.json(result, { status: 400 });
    let shareToken: string | undefined;
    const trialCookie = req.cookies.get('n86_trial')?.value;
    if (trialCookie) {
      const saved = await saveTrialRun({
        sessionToken: trialCookie,
        agent: '3p-fee-finder',
        filename: parsed.filename,
        rowsParsed: result.rowsParsed,
        result,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      });
      shareToken = saved?.shareToken;
    }
    return NextResponse.json({ ok: true, shareToken, ...result });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
