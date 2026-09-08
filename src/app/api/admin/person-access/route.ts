import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantPersonAccess } from '@/lib/personAuth';
import { neonConfigured } from '@/lib/operatorActivation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminOk(req: NextRequest): boolean {
  const cron = process.env.CRON_SECRET?.trim();
  const bearer = req.headers.get('authorization');
  if (cron && bearer === `Bearer ${cron}`) return true;
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return false;
  const token = crypto.createHash('sha256').update(adminPw).digest('hex');
  return req.cookies.get('n86_admin_auth')?.value === token;
}

// POST /api/admin/person-access  { email, operatorId }
// Attach an EXISTING isolated operator to this person email.
// Same password then opens that store. Does not mint +alias emails.
export async function POST(req: NextRequest) {
  if (!adminOk(req)) {
    return NextResponse.json({ success: false, error: 'Not authorized.' }, { status: 401 });
  }
  if (!neonConfigured()) {
    return NextResponse.json({ success: false, error: 'Primary database (Neon) is not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const operatorId = Number.parseInt(String(body?.operatorId ?? ''), 10);

  const result = await grantPersonAccess(email, operatorId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, email: email.trim().toLowerCase(), operatorId });
}
