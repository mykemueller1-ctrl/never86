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

// Normalize whatever is in OPS_DATABASE_URL into a Supavisor transaction-pooler
// URL that actually connects from Vercel. Two failure modes we route around:
//   - db.<ref>.supabase.co  -> IPv6-only, getaddrinfo ENOTFOUND from Vercel
//   - aws-0-<region>.pooler -> resolves but returns "Tenant or user not found"
//     (this project's tenant is served by the aws-1 node)
// We pull the project ref (from the direct host OR the postgres.<ref> username)
// and the password out of whatever is configured, then rebuild the canonical
// pooler URL. Host/region overridable via OPS_DB_POOLER_HOST / OPS_DB_REGION.
function normalizeOpsUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const fromHost = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    const fromUser = u.username.match(/^postgres\.([a-z0-9]+)$/i);
    const ref = fromHost?.[1] ?? fromUser?.[1];
    if (!ref) return raw; // not a recognizable Supabase URL — use as configured
    const region = process.env.OPS_DB_REGION || 'us-east-1';
    const host = process.env.OPS_DB_POOLER_HOST || `aws-1-${region}.pooler.supabase.com`;
    return `postgresql://postgres.${ref}:${u.password}@${host}:6543/postgres`;
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
