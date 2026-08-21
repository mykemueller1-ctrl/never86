import { NextRequest, NextResponse } from 'next/server';
import { runLaborDrift } from '@/lib/laborDriftCsv';
import { logVisitorEvent } from '@/lib/leadCapture';
import { readCsvFromRequest } from '@/lib/csv/request';
import { saveTrialRun } from '@/lib/trialRunsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// POST /api/connect/labor-drift · ticket-level labor / timesheet CSV →
// labor drift, ghost shifts, schedule-vs-clocked gaps, OT estimate $.
export async function POST(req: NextRequest) {
  try {
    const parsed = await readCsvFromRequest(req);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
    }
    const { csv, filename } = parsed;

    const result = runLaborDrift(csv);

    logVisitorEvent({
      eventType: 'connect_agent_run',
      pagePath: '/connect/labor-drift',
      agentName: 'Labor Drift',
      audience: 'coo',
      meta: 'shifts' in result ? {
        shifts: result.shifts,
        employees: result.employees,
        driftMinutes: result.totalDriftMinutes,
        ghostShifts: result.ghostShifts.length,
      } : { error: result.error },
    }).catch(() => {});

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    // Persist for trial sessions.
    let shareToken: string | undefined;
    const trialCookie = req.cookies.get('n86_trial')?.value;
    if (trialCookie) {
      const saved = await saveTrialRun({
        sessionToken: trialCookie,
        agent: 'labor-drift',
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
