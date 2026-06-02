import { NextRequest, NextResponse } from 'next/server';
import { logVisitorEvent } from '@/lib/leadCapture';

export const runtime = 'nodejs';

// POST /api/track — fire-and-forget anonymous visitor event capture.
// Used by the demo pages + role pages to record who viewed what, when.
// Never blocks the page render — bestEffort.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const e = {
      sessionId: typeof body?.sessionId === 'string' ? body.sessionId : undefined,
      eventType: typeof body?.eventType === 'string' ? body.eventType : 'view',
      pagePath: typeof body?.pagePath === 'string' ? body.pagePath : undefined,
      agentName: typeof body?.agentName === 'string' ? body.agentName : undefined,
      audience: typeof body?.audience === 'string' ? body.audience : undefined,
      referrer: req.headers.get('referer') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      meta: typeof body?.meta === 'object' ? body.meta : undefined,
    };
    // Don't await — return 204 immediately so the beacon doesn't block.
    logVisitorEvent(e).catch(() => {});
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
