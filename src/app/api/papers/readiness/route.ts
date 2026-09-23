import { NextResponse } from 'next/server';
import {
  PAPERS_REQUIRED_SECRET_NAMES,
  evaluatePapersInboxEnablement,
  papersFileFirstWhenInboxOff,
} from '@/lib/papersInbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public door. This route has no Gmail session, so connection stays false.
 * A ready Google client is not a connected inbox. Secret values are never returned.
 */
export async function GET() {
  const gate = evaluatePapersInboxEnablement();
  const fileFirst = papersFileFirstWhenInboxOff({ gmail: false, drive: false });
  return NextResponse.json({
    success: true,
    ready: gate.ready,
    honesty: 'Missing',
    missingSecrets: gate.missingSecrets,
    requiredEnv: [...PAPERS_REQUIRED_SECRET_NAMES],
    connection: { gmail: false, drive: false, outlook: false, email: null },
    fileFirst: true,
    lead: fileFirst.lead,
    folders: fileFirst.folders,
    error: gate.ready ? null : gate.error,
    note: gate.ready ? fileFirst.note : `${gate.error} ${fileFirst.note}`,
  });
}
