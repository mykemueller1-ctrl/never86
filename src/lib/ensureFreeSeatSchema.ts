import { neon } from '@neondatabase/serverless';

/**
 * Ensures Monday-gate free-seat tables exist on Neon (DATABASE_URL).
 * Idempotent. Safe to call on every onboard — runs once per cold start.
 */
let ensurePromise: Promise<void> | null = null;

export async function ensureFreeSeatSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!ensurePromise) {
    ensurePromise = applyFreeSeatDdl(process.env.DATABASE_URL).catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  await ensurePromise;
}

async function applyFreeSeatDdl(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);

  await sql`
    create table if not exists seat_activation_tokens (
      id serial primary key,
      email text not null,
      restaurant_name text not null,
      operator_name text,
      token_hash text not null unique,
      source_page text,
      consent_at timestamptz not null default now(),
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      consumed_at timestamptz,
      consumed_operator_id integer,
      request_ip text,
      user_agent text
    )
  `;

  await sql`
    create index if not exists seat_activation_tokens_email_created_idx
      on seat_activation_tokens (lower(email), created_at desc)
  `;

  await sql`
    create table if not exists seat_operators (
      id serial primary key,
      email text not null unique,
      name text,
      restaurant_name text not null,
      source_page text,
      consent_at timestamptz not null default now(),
      activated_at timestamptz,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists seat_locations (
      id serial primary key,
      operator_id integer not null references seat_operators(id) on delete cascade,
      name text not null,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create unique index if not exists seat_locations_one_free_store_idx
      on seat_locations (operator_id)
  `;

  await sql`
    create table if not exists seat_credentials (
      id serial primary key,
      operator_id integer not null references seat_operators(id) on delete cascade,
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now(),
      last_login_at timestamptz
    )
  `;

  // Keep free-seat ids out of the OPS operator_users range.
  await sql`
    select setval(
      pg_get_serial_sequence('seat_operators', 'id'),
      greatest(coalesce((select max(id) from seat_operators), 0), 999999)
    )
  `;
}
