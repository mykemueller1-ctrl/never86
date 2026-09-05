-- Orchestration tenant lake + house-code hashes.
-- Tenant key is operator_id. Memory is append-only. Never store plaintext house codes.
-- Include this file only if the CTAP house-code lake is wanted on the 1-seat Neon.
-- Email-claim free seat does not require these tables.
--
-- Apply command (secrets stay in env, never in git or chat):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/0007_simple_owner_demo.sql
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/0008_orchestration_data_lake.sql

begin;

create table if not exists public.orchestration_lake_records (
  id uuid primary key default gen_random_uuid(),
  operator_id integer not null,
  location_id text,
  kind text not null check (kind in ('source', 'memory', 'receipt', 'route')),
  source_tag text not null check (source_tag in (
    'verified', 'reconciled', 'partial', 'estimated', 'unverified', 'missing-evidence'
  )),
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  superseded_by uuid,
  version integer not null default 1,
  unique (operator_id, id)
);

create index if not exists orchestration_lake_operator_kind_idx
  on public.orchestration_lake_records (operator_id, kind, created_at desc);

create table if not exists public.orchestration_house_codes (
  id uuid primary key default gen_random_uuid(),
  operator_id integer not null unique,
  code_hash text not null,
  live_issuance text not null default 'blocked' check (live_issuance in ('blocked', 'enabled')),
  created_at timestamptz not null default now(),
  unique (operator_id, id)
);

-- Intentionally no DELETE policy. Supersede in application code. Do not drop rows.

commit;
