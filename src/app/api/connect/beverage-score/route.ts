import { NextRequest, NextResponse } from 'next/server';
import { runBeverageCostScore } from '@/lib/beverageScoreCsv';
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
    const { csv, filename } = parsed;

    const result = runBeverageCostScore(csv);

    logVisitorEvent({
      eventType: 'connect_agent_run',
      pagePath: '/connect/beverage-score',
      agentName: 'Beverage Cost Score',
      audience: 'owner',
      meta: 'networkBcsScore' in result ? { stores: result.storesCount, bcs: result.networkBcsScore, shrinkPct: result.networkShrinkPct } : { error: result.error },
    }).catch(() => {});

    if ('error' in result) return NextResponse.json(result, { status: 400 });

    let shareToken: string | undefined;
    const trialCookie = req.cookies.get('n86_trial')?.value;
    if (trialCookie) {
      const saved = await saveTrialRun({
        sessionToken: trialCookie,
        agent: 'beverage-score',
        filename, rowsParsed: result.rowsParsed, result,
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
