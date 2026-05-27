import postgres from 'postgres';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

// Diagnostic: report what OPS_DATABASE_URL is set to (password masked) and probe
// candidate Supabase pooler endpoints to find which one actually connects.
// Password comes from the env var, or a ?pw= override for testing. Returns only
// connection results — never the password, never operator data. Temporary.
const REF = 'zjtbhsouhwyyfwoyjgow';

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

export async function GET(request: Request) {
  const raw = process.env.OPS_DATABASE_URL || '';
  let pUser = '', pHost = '', pPort = '', envPwd = '';
  try {
    const u = new URL(raw);
    pUser = u.username; pHost = u.hostname; pPort = u.port; envPwd = decodeURIComponent(u.password);
  } catch { /* malformed */ }
  if (!envPwd) {
    const m = raw.match(/:\/\/[^:@/]+:([^@]+)@/);
    if (m) { try { envPwd = decodeURIComponent(m[1]); } catch { envPwd = m[1]; } }
  }
  const ref = pHost.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1]
    || (pUser.includes('.') ? pUser.split('.')[1] : '')
    || REF;

  const configured = { user: pUser, host: pHost, port: pPort, hasEnvPwd: Boolean(envPwd) };

  const pwd = new URL(request.url).searchParams.get('pw') || envPwd;
  if (!pwd) return Response.json({ ok: false, reason: 'no password available', configured });

  const enc = encodeURIComponent(pwd);
  const candidates: { label: string; url: string }[] = [
    { label: 'as-configured', url: raw },
    { label: 'aws-0 tx 6543', url: `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
    { label: 'aws-1 tx 6543', url: `postgresql://postgres.${ref}:${enc}@aws-1-us-east-1.pooler.supabase.com:6543/postgres` },
    { label: 'aws-0 session 5432', url: `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:5432/postgres` },
    { label: 'aws-1 session 5432', url: `postgresql://postgres.${ref}:${enc}@aws-1-us-east-1.pooler.supabase.com:5432/postgres` },
  ];

  const results = await Promise.all(candidates.map((c) => probe(c.label, c.url)));
  return Response.json({ ref, configured, winner: results.find((r) => r.ok)?.label ?? null, results });
}
