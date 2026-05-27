import { opsDb, opsDbConfigured } from '@/lib/opsDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Ungated connection health check for the ops database. Returns only a status
// and (on failure) the driver error message — never any operator data. Lets us
// verify the live ops-DB connection without logging in.
export async function GET() {
  if (!opsDbConfigured()) {
    return Response.json({ ok: false, reason: 'OPS_DATABASE_URL not set' });
  }
  const t0 = Date.now();
  try {
    const sql = opsDb();
    const rows = await sql<{ ok: number; n: number }[]>`
      select 1 as ok, (select count(*)::int from operator_locations where operator_id = 3) as n`;
    return Response.json({ ok: true, locations: rows[0]?.n ?? null, ms: Date.now() - t0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg, ms: Date.now() - t0 });
  }
}
