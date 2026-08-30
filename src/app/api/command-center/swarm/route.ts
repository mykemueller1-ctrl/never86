import { NextResponse } from 'next/server';
import { runSampleCommandCenterSwarm } from '@/lib/commandCenterSwarm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Read-only status of the sample-store swarm. Never sends. */
export async function GET() {
  const report = runSampleCommandCenterSwarm();
  return NextResponse.json({
    ok: true,
    sendsDelivered: report.sendsDelivered,
    portalLogins: report.portalLogins,
    report,
  });
}
