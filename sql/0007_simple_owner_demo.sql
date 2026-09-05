-- Simple Owner Demo persistence.
-- Drafted only. Do not apply to production from a factory job unless DATABASE_URL
-- is present in the worker env. Neon is the D1 equivalent on this Vercel/never86 stack.
-- R2 holds file bytes when R2_* env is present; otherwise neon-object-fallback.
--
-- Apply command (secrets stay in env, never in git or chat):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/0007_simple_owner_demo.sql
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/0008_orchestration_data_lake.sql

create table if not exists simple_owner_uploads (
  id text primary key,
  operator_id text not null,
  filename text not null,
  content_type text not null,
  byte_length integer not null,
  evidence_kind text not null,
  source_tags jsonb not null default '[]'::jsonb,
  object_key text not null,
  storage_backend text not null,
  created_at timestamptz not null default now()
);

create index if not exists simple_owner_uploads_operator_idx
  on simple_owner_uploads (operator_id, created_at desc);

create table if not exists simple_owner_asks (
  id text primary key,
  operator_id text not null,
  question text not null,
  tray text not null,
  mouth text not null,
  slug text,
  headline text not null,
  facts jsonb not null default '[]'::jsonb,
  coach_tomorrow text not null,
  needs text not null,
  source_tags jsonb not null default '[]'::jsonb,
  invented_close boolean not null default false,
  sample_dollars text not null default 'none-verified',
  verified_close boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists simple_owner_asks_operator_idx
  on simple_owner_asks (operator_id, created_at desc);

create table if not exists simple_owner_blobs (
  object_key text primary key,
  operator_id text not null,
  content_type text not null,
  payload_b64 text not null,
  created_at timestamptz not null default now()
);
