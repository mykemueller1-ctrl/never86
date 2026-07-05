import { NextRequest, NextResponse } from 'next/server';
import { runLeakDetector } from '@/lib/leakDetectorCsv';
import { logVisitorEvent } from '@/lib/leadCapture';
import { readCsvFromRequest } from '@/lib/csv/request';
import { saveTrialRun } from '@/lib/trialRunsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// POST /api/connect/leak-detector
// Same shape as /api/connect/void-hunter — multipart file, JSON {csv},
// or raw text. Runs the ticket-level Leak Detector and returns five
// signals: void-after-payment, cash-only voiders, promo stacking,
// comp abuse, discount-after-close.
export async function POST(req: NextRequest) {
  try {
    const parsed = await readCsvFromRequest(req);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
    }
    const { csv, filename } = parsed;

    const result = runLeakDetector(csv);

    logVisitorEvent({
      eventType: 'connect_agent_run',
      pagePath: '/connect/leak-detector',
      agentName: 'Leak Detector',
      audience: 'owner',
      meta: 'rowsParsed' in result ? {
        rowsParsed: result.rowsParsed,
        voidAfterPay: result.signals.voidAfterPayment.totalCount,
        compAbuse: result.signals.compAbuse.length,
        promoStacking: result.signals.promoStacking.totalCount,
      } : { error: result.error },
    }).catch(() => {});

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    // Persist for trial sessions so the operator can return via share URL.
    let shareToken: string | undefined;
    const trialCookie = req.cookies.get('n86_trial')?.value;
    if (trialCookie) {
      const saved = await saveTrialRun({
        sessionToken: trialCookie,
        agent: 'leak-detector',
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
