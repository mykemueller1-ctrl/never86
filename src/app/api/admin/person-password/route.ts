import { NextRequest, NextResponse } from 'next/server';
import { adminBearerOk } from '@/lib/adminBearerAuth';
import { copyPersonPasswordHash, setAdminPersonPassword } from '@/lib/personAuth';
import { neonConfigured } from '@/lib/operatorActivation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/person-password
//   { email, password }                    — set a new shared hash
//   { email, copyPasswordFrom }            — copy an existing person hash (no plaintext)
// CoS/Build: set the ONE shared password for an existing person email.
// Does not mint plus-alias seats. Does not create a new store.
export async function POST(req: NextRequest) {
  if (!adminBearerOk(req)) {
    return NextResponse.json({ success: false, error: 'Not authorized.' }, { status: 401 });
  }
  if (!neonConfigured()) {
    return NextResponse.json({ success: false, error: 'Primary database (Neon) is not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const copyPasswordFrom =
    typeof body?.copyPasswordFrom === 'string' ? body.copyPasswordFrom.trim() : '';

  const result = copyPasswordFrom
    ? await copyPersonPasswordHash(copyPasswordFrom, email)
    : await setAdminPersonPassword(email, password);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    email: email.trim().toLowerCase(),
    copiedFrom: copyPasswordFrom ? copyPasswordFrom.trim().toLowerCase() : undefined,
  });
}
