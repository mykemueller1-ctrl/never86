import { NextRequest, NextResponse } from 'next/server';
import { runLaborDrift } from '@/lib/laborDriftCsv';
import { logVisitorEvent } from '@/lib/leadCapture';
import { saveTrialRun } from '@/lib/trialRunsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CSV_BYTES = 5 * 1024 * 1024;

// POST /api/connect/labor-drift · ticket-level labor / timesheet CSV →
// labor drift, ghost shifts, schedule-vs-clocked gaps, OT estimate $.
export async function POST(req: NextRequest) {
  try {
    let csv = '';
    let filename = '';
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await req.json();
      csv = typeof body?.csv === 'string' ? body.csv : '';
      filename = typeof body?.filename === 'string' ? body.filename : '';
    } else if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (file && typeof file !== 'string') {
        if (file.size > MAX_CSV_BYTES) {
          return NextResponse.json({ ok: false, error: 'File too large (5 MB max)' }, { status: 413 });
        }
        csv = await file.text();
        filename = file.name;
      }
    } else {
      csv = await req.text();
    }
    if (!csv || csv.length > MAX_CSV_BYTES) {
      return NextResponse.json({ ok: false, error: 'Send a CSV in the body (json {csv}, form file, or raw text).' }, { status: 400 });
    }

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
        agent: 'leak-detector' as const, // reuse type until schema accepts more agents
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
