import { NextRequest, NextResponse } from 'next/server';
import { adminBearerOk } from '@/lib/adminBearerAuth';
import { ensureFreeSeatSchema } from '@/lib/ensureFreeSeatSchema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/apply-free-seat
 * Explicit Neon DDL apply. Auth: Bearer CRON_SECRET or Bearer ADMIN_API_SECRET.
 */
export async function POST(req: NextRequest) {
  if (!adminBearerOk(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureFreeSeatSchema();
    return NextResponse.json({ success: true, applied: 'free-seat-neon' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Migration failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
