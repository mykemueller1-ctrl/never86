import { NextResponse } from 'next/server';
import { PAPERS_REQUIRED_SECRET_NAMES, evaluatePapersInboxEnablement } from '@/lib/papersInbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public Google door. Secret values are never returned. Fail closed when unset. */
export async function GET() {
  const gate = evaluatePapersInboxEnablement();
  return NextResponse.json({
    success: true,
    ready: gate.ready,
    honesty: 'Missing',
    missingSecrets: gate.missingSecrets,
    requiredEnv: [...PAPERS_REQUIRED_SECRET_NAMES],
    error: gate.ready ? null : gate.error,
    note: gate.ready
      ? 'Google client is ready. Gmail is not connected on this page. Papers stay Missing until a pull lands.'
      : gate.error,
  });
}
