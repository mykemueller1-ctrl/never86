import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { upsertOperatorCredential, operatorExists } from '@/lib/operatorAuth';
import { opsDbConfigured } from '@/lib/opsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin-only: create or reset an operator's login. Gated by the same
// n86_admin_auth cookie the /admin pages use (this API path isn't under the
// middleware matcher, so we check the admin cookie here directly).
function adminOk(req: NextRequest): boolean {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return false;
  const token = crypto.createHash('sha256').update(adminPw).digest('hex');
  return req.cookies.get('n86_admin_auth')?.value === token;
}

export async function POST(req: NextRequest) {
  if (!adminOk(req)) {
    return NextResponse.json({ success: false, error: 'Not authorized.' }, { status: 401 });
  }
  if (!opsDbConfigured()) {
    return NextResponse.json({ success: false, error: 'Ops DB is not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const operatorId = Number.parseInt(String(body?.operatorId ?? ''), 10);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!Number.isInteger(operatorId) || operatorId <= 0) {
    return NextResponse.json({ success: false, error: 'Pick a valid operator.' }, { status: 400 });
  }
  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ success: false, error: 'Enter a valid email.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  if (!(await operatorExists(operatorId))) {
    return NextResponse.json({ success: false, error: `No operator with id ${operatorId}.` }, { status: 400 });
  }

  try {
    await upsertOperatorCredential(operatorId, email, password);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save login.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, operatorId, email: email.toLowerCase() });
}
