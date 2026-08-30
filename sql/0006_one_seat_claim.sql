-- DRAFT. Do not apply to live Neon or live Supabase from this PR.
-- Enable path after Myke applies this file: set ONE_SEAT_CLAIM_ENABLED=true
-- with DATABASE_URL present. Owner /login stays owner-only.
-- Verified identity creates a pending request only. Myke or Tom assign a seat.
-- Identifiers are stored hashed. Never store raw emails, tokens, or PINs.
-- HTTP claim stays fail-closed and mail_sent = false until a private mail
-- provider exists.

begin;

create table if not exists public.one_seat_identities (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null unique,
  google_sub_hash text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.one_seat_claims (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.one_seat_identities(id) on delete restrict,
  operator_id integer not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'revoked')),
  provider text not null check (provider in ('email', 'google')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text check (decided_by in ('myke', 'tom')),
  assigned_seat_key text,
  assigned_department text,
  assigned_seat_id uuid,
  location_id integer,
  unique (operator_id, id)
);

create index if not exists one_seat_claims_pending_idx
  on public.one_seat_claims (operator_id, status, requested_at);

create table if not exists public.one_seat_audit_events (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in (
    'verify', 'claim', 'approve', 'reject', 'revoke', 'reset', 'link', 'rate_limit'
  )),
  identity_id uuid,
  claim_id uuid,
  actor text not null,
  outcome text not null check (outcome in ('accepted', 'denied')),
  reason text not null,
  mail_sent boolean not null default false check (mail_sent = false),
  created_at timestamptz not null default now()
);

alter table public.one_seat_identities enable row level security;
alter table public.one_seat_claims enable row level security;
alter table public.one_seat_audit_events enable row level security;

revoke all on table public.one_seat_identities from anon, authenticated;
revoke all on table public.one_seat_claims from anon, authenticated;
revoke all on table public.one_seat_audit_events from anon, authenticated;

commit;
