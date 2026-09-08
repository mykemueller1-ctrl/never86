import { NextRequest, NextResponse } from 'next/server';
import { adminOk } from '@/lib/adminBearerAuth';
import { grantPersonAccess, revokePersonAccess } from '@/lib/personAuth';
import { neonConfigured } from '@/lib/operatorActivation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/person-access  { email, operatorId, detach?: true }
// Attach or detach an EXISTING isolated operator to this person email.
// Same password then opens that store. Does not mint +alias emails.
export async function POST(req: NextRequest) {
  if (!(await adminOk(req))) {
    return NextResponse.json({ success: false, error: 'Not authorized.' }, { status: 401 });
  }
  if (!neonConfigured()) {
    return NextResponse.json({ success: false, error: 'Primary database (Neon) is not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const operatorId = Number.parseInt(String(body?.operatorId ?? ''), 10);
  const detach = body?.detach === true || body?.action === 'detach';

  const result = detach
    ? await revokePersonAccess(email, operatorId)
    : await grantPersonAccess(email, operatorId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    email: email.trim().toLowerCase(),
    operatorId,
    detached: detach,
  });
}
