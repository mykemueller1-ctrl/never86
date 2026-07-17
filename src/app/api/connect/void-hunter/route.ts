import { NextRequest, NextResponse } from 'next/server';
import { runVoidHunter } from '@/lib/voidHunterCsv';
import { logVisitorEvent } from '@/lib/leadCapture';
import { readCsvFromRequest } from '@/lib/csv/request';
import { saveTrialRun } from '@/lib/trialRunsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// POST /api/connect/void-hunter
// Accepts either:
//   - application/json with { csv: "..." }
//   - multipart/form-data with a single file field named "file"
// Runs the CSV-based Void Hunter and returns the analysis. No DB write,
// no lead capture here — that's the next step in the UI flow.
export async function POST(req: NextRequest) {
  try {
    const parsed = await readCsvFromRequest(req);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
    }
    const { csv, filename } = parsed;

    const result = runVoidHunter(csv);

    logVisitorEvent({
      eventType: 'connect_agent_run',
      pagePath: '/connect/void-hunter',
      agentName: 'Void Hunter',
      audience: 'owner',
      meta: 'rowsParsed' in result ? { rowsParsed: result.rowsParsed, storesFlagged: result.storesFlagged } : { error: result.error },
    }).catch(() => {});

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    // If this came from a trial session, save the run so the operator
    // can return to the exact same result via a share URL.
    let shareToken: string | undefined;
    const trialCookie = req.cookies.get('n86_trial')?.value;
    if (trialCookie) {
      const saved = await saveTrialRun({
        sessionToken: trialCookie,
        agent: 'void-hunter',
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
