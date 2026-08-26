-- Neon free-seat tables for Monday gate (#118).
-- Apply with: DATABASE_URL=... npx drizzle-kit push
-- OR run this SQL on Neon Console.
-- Supabase OPS is deferred; these tables do not touch Toast/CTAP data.

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
);

create index if not exists seat_activation_tokens_email_created_idx
  on seat_activation_tokens (lower(email), created_at desc);

create table if not exists seat_operators (
  id serial primary key,
  email text not null unique,
  name text,
  restaurant_name text not null,
  source_page text,
  consent_at timestamptz not null default now(),
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

-- Keep free-seat ids out of the OPS operator_users range.
select setval(
  pg_get_serial_sequence('seat_operators', 'id'),
  greatest(coalesce((select max(id) from seat_operators), 0), 999999)
);

create table if not exists seat_locations (
  id serial primary key,
  operator_id integer not null references seat_operators(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists seat_locations_one_free_store_idx
  on seat_locations (operator_id);

create table if not exists seat_credentials (
  id serial primary key,
  operator_id integer not null references seat_operators(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
