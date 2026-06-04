import { NextRequest, NextResponse } from 'next/server';
import { runVoidHunter } from '@/lib/voidHunterCsv';
import { logVisitorEvent } from '@/lib/leadCapture';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CSV_BYTES = 5 * 1024 * 1024; // 5 MB

// POST /api/connect/void-hunter
// Accepts either:
//   - application/json with { csv: "..." }
//   - multipart/form-data with a single file field named "file"
// Runs the CSV-based Void Hunter and returns the analysis. No DB write,
// no lead capture here — that's the next step in the UI flow.
export async function POST(req: NextRequest) {
  try {
    let csv = '';
    const ct = req.headers.get('content-type') || '';

    if (ct.includes('application/json')) {
      const body = await req.json();
      csv = typeof body?.csv === 'string' ? body.csv : '';
    } else if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (file && typeof file !== 'string') {
        if (file.size > MAX_CSV_BYTES) {
          return NextResponse.json({ ok: false, error: 'File too large (5 MB max)' }, { status: 413 });
        }
        csv = await file.text();
      }
    } else {
      // Accept raw text body too.
      csv = await req.text();
    }

    if (!csv || csv.length > MAX_CSV_BYTES) {
      return NextResponse.json({ ok: false, error: 'Send a CSV in the body (json {csv}, form file, or raw text).' }, { status: 400 });
    }

    const result = runVoidHunter(csv);

    // Fire-and-forget visitor event so the admin console knows someone
    // ran the live agent on their own data.
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
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to process CSV';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
