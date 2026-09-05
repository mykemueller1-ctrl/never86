-- Nag vendor portal + weekly prime cost persistence.
-- Drafted only. Do not apply to production from a factory job unless DATABASE_URL
-- is present in the worker env. Neon is the D1 equivalent on this Vercel/never86 stack.
-- R2 holds vendor photo bytes when R2_* env is present; otherwise neon-object-fallback
-- (shared simple_owner_blobs table from sql/0007_simple_owner_demo.sql).
--
-- Apply command (secrets stay in env, never in git or chat):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/0010_nag_vendor_portal.sql

create table if not exists nag_vendors (
  id text primary key,
  operator_id text not null,
  name text not null,
  category text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists nag_vendors_operator_idx
  on nag_vendors (operator_id, created_at desc);

create table if not exists nag_vendor_photos (
  id text primary key,
  operator_id text not null,
  vendor_id text not null,
  filename text not null,
  content_type text not null,
  byte_length integer not null,
  object_key text not null,
  storage_backend text not null,
  source_tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nag_vendor_photos_vendor_idx
  on nag_vendor_photos (vendor_id, created_at desc);

create index if not exists nag_vendor_photos_operator_idx
  on nag_vendor_photos (operator_id);

create table if not exists nag_weekly_prime_cost (
  id serial primary key,
  operator_id integer not null,
  location_id integer not null,
  week_start date not null,
  week_end date not null,
  gross_sales numeric(12, 2) not null,
  labor_cost numeric(12, 2) not null,
  voids_total numeric(12, 2) not null,
  cash_variance numeric(12, 2) not null,
  prime_cost_percent numeric(6, 2),
  days_with_data integer not null,
  source_tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (operator_id, location_id, week_start)
);
