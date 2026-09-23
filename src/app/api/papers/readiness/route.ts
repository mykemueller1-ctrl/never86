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
    honesty: gate.ready ? 'Estimated' : 'Missing',
    missingSecrets: gate.missingSecrets,
    requiredEnv: [...PAPERS_REQUIRED_SECRET_NAMES],
    error: gate.error,
  });
}
