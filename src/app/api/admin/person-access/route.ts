import { NextRequest, NextResponse } from 'next/server';
import { adminOk } from '@/lib/adminBearerAuth';
import {
  grantPersonAccess,
  isRetireNativeSuccess,
  retireNativeOperator,
  revokePersonAccess,
} from '@/lib/personAuth';
import { neonConfigured } from '@/lib/operatorActivation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/person-access
// { email, operatorId, detach?: true, retire?: true }
// Attach, detach (person_access only), or retire native ownership.
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
  const retire =
    body?.retire === true || body?.detachNative === true || body?.action === 'retire';
  const detach = !retire && (body?.detach === true || body?.action === 'detach');

  const result = retire
    ? await retireNativeOperator(email, operatorId)
    : detach
      ? await revokePersonAccess(email, operatorId)
      : await grantPersonAccess(email, operatorId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  const retired = isRetireNativeSuccess(result)
    ? { nativeRetired: result.nativeRetired, retiredEmail: result.retiredEmail }
    : {};

  return NextResponse.json({
    success: true,
    email: email.trim().toLowerCase(),
    operatorId,
    detached: detach || retire,
    retired: retire,
    ...retired,
  });
}
