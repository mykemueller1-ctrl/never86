import postgres from 'postgres';

// Connection to the Supabase "never86" operations database — where the live
// Toast data lives (toast_location_breakdown, toast_employee_performance,
// operator_z_reports, operator_locations, ...). This is intentionally separate
// from the app's primary Neon DB (src/db) so we can read ops data without
// disturbing the existing schema.
//
// Set OPS_DATABASE_URL to the Supabase connection string:
//   Supabase → Project Settings → Database → Connection string → "Transaction" pooler.

let client: ReturnType<typeof postgres> | null = null;

export function opsDbConfigured(): boolean {
  return Boolean(process.env.OPS_DATABASE_URL);
}

// Verified working endpoint for this project (confirmed empirically via the
// /api/ops-health probe): the aws-1 Supavisor transaction pooler with user
// postgres.<ref>. The configured OPS_DATABASE_URL only needs to carry the
// correct PASSWORD — we always rebuild the host + username to the known-good
// values, so a mangled host or a stripped project ref can't break the
// connection. Host/ref overridable via OPS_DB_POOLER_HOST / OPS_DB_REF.
function normalizeOpsUrl(raw: string): string {
  try {
    let pwd = '';
    try { pwd = new URL(raw).password; } catch { /* malformed */ }
    if (!pwd) {
      const m = raw.match(/:\/\/[^:@/]+:([^@]+)@/);
      if (m) pwd = m[1];
    }
    if (!pwd) return raw;
    const ref = process.env.OPS_DB_REF || 'zjtbhsouhwyyfwoyjgow';
    const host = process.env.OPS_DB_POOLER_HOST || 'aws-1-us-east-1.pooler.supabase.com';
    return `postgresql://postgres.${ref}:${pwd}@${host}:6543/postgres`;
  } catch {
    return raw;
  }
}

export function opsDb() {
  const url = process.env.OPS_DATABASE_URL;
  if (!url) {
    throw new Error(
      'OPS_DATABASE_URL is not set. Point it at the Supabase never86 database ' +
        '(Project Settings → Database → Connection string → Transaction pooler).'
    );
  }
  if (!client) {
    client = postgres(normalizeOpsUrl(url), {
      ssl: 'require',
      max: 3,
      idle_timeout: 20,
      // Supabase transaction pooler (port 6543) does not support prepared statements.
      prepare: false,
    });
  }
  return client;
}
