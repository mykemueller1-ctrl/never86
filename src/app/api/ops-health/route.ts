import { opsDb, opsDbConfigured } from '@/lib/opsDb';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function tokenFor(pw: string): string {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function isAdmin(): boolean {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return false;
  const cookie = cookies().get('n86_admin_auth')?.value;
  if (!cookie) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookie, 'hex'),
      Buffer.from(tokenFor(adminPw), 'hex'),
    );
  } catch {
    return false;
  }
}

// Connection health for the ops database. Public response is a boolean only —
// no operator IDs, no row counts, no anything that fingerprints a specific
// customer. Admin-cookie holders see the detail.
export async function GET() {
  if (!opsDbConfigured()) {
    return Response.json({ ok: false, reason: 'data source not configured' });
  }
  const t0 = Date.now();
  try {
    const sql = opsDb();
    await sql`select 1 as ok`;
    if (isAdmin()) {
      const rows = await sql<{ n: number }[]>`
        select count(*)::int as n from operator_locations where operator_id = 3`;
      return Response.json({ ok: true, locations: rows[0]?.n ?? null, ms: Date.now() - t0 });
    }
    return Response.json({ ok: true, ms: Date.now() - t0 });
  } catch (e) {
    if (isAdmin()) {
      return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 });
    }
    return Response.json({ ok: false, ms: Date.now() - t0 });
  }
}
