import { opsDb, opsDbConfigured } from '@/lib/opsDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Connection health for the ops database. Returns only status + a row count
// (or the driver error) — never operator data. Confirms the live connection.
export async function GET() {
  if (!opsDbConfigured()) {
    return Response.json({ ok: false, reason: 'OPS_DATABASE_URL not set' });
  }
  const t0 = Date.now();
  try {
    const sql = opsDb();
    const rows = await sql<{ n: number }[]>`
      select count(*)::int as n from operator_locations where operator_id = 3`;
    return Response.json({ ok: true, locations: rows[0]?.n ?? null, ms: Date.now() - t0 });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 });
  }
}
