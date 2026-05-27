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

export function opsDb() {
  const url = process.env.OPS_DATABASE_URL;
  if (!url) {
    throw new Error(
      'OPS_DATABASE_URL is not set. Point it at the Supabase never86 database ' +
        '(Project Settings → Database → Connection string → Transaction pooler).'
    );
  }
  if (!client) {
    client = postgres(url, {
      ssl: 'require',
      max: 3,
      idle_timeout: 20,
      // Supabase transaction pooler (port 6543) does not support prepared statements.
      prepare: false,
    });
  }
  return client;
}
