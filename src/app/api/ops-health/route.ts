import postgres from 'postgres';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

// Diagnostic: try every plausible Supabase connection from inside Vercel and
// report which one actually connects. Returns hosts + ok/error only — never the
// password and never any operator data. Temporary; remove once the live string
// is confirmed.
async function probe(label: string, url: string) {
  const sql = postgres(url, { ssl: 'require', prepare: false, max: 1, idle_timeout: 1, connect_timeout: 5 });
  const t0 = Date.now();
  try {
    const r = await sql<{ ok: number }[]>`select 1 as ok`;
    return { label, ok: r[0]?.ok === 1, ms: Date.now() - t0 };
  } catch (e) {
    return { label, ok: false, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  } finally {
    try { await sql.end({ timeout: 2 }); } catch { /* ignore */ }
  }
}

export async function GET() {
  const raw = process.env.OPS_DATABASE_URL || '';
  let ref = '';
  let pwd = '';
  try {
    const u = new URL(raw);
    ref = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1] || (u.username.includes('.') ? u.username.split('.')[1] : '');
    pwd = u.password;
  } catch { /* ignore */ }

  if (!ref || !pwd) {
    return Response.json({ ok: false, reason: 'could not parse ref/password from OPS_DATABASE_URL', hasUrl: Boolean(raw) });
  }

  const enc = encodeURIComponent(decodeURIComponent(pwd));
  const candidates: { label: string; url: string }[] = [
    { label: 'as-configured', url: raw },
    { label: 'aws-0 tx 6543', url: `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
    { label: 'aws-1 tx 6543', url: `postgresql://postgres.${ref}:${enc}@aws-1-us-east-1.pooler.supabase.com:6543/postgres` },
    { label: 'aws-0 session 5432', url: `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:5432/postgres` },
    { label: 'aws-1 session 5432', url: `postgresql://postgres.${ref}:${enc}@aws-1-us-east-1.pooler.supabase.com:5432/postgres` },
  ];

  const results = await Promise.all(candidates.map((c) => probe(c.label, c.url)));
  const winner = results.find((r) => r.ok)?.label ?? null;
  return Response.json({ ref, winner, results });
}
