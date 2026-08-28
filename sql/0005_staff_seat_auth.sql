-- DRAFT. Do not apply to live Neon or live Supabase.
-- Staff-seat invite / reset / revoke audit for the manager-first login plane.
-- No real Community Tap names, emails, phones, PINs, or live schedules.
-- Live issuance stays blocked until Myke supplies PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.

begin;

create table if not exists public.staff_seat_invites (
  id uuid primary key default gen_random_uuid(),
  operator_id integer not null,
  seat_id uuid not null,
  action text not null check (action in ('invite', 'reset')),
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_by_seat_id uuid not null,
  created_at timestamptz not null default now(),
  unique (operator_id, id),
  foreign key (operator_id, seat_id)
    references public.operator_staff_seats(operator_id, id)
    on delete cascade,
  foreign key (operator_id, created_by_seat_id)
    references public.operator_staff_seats(operator_id, id)
    on delete restrict
);

create index if not exists staff_seat_invites_operator_seat_idx
  on public.staff_seat_invites (operator_id, seat_id, consumed_at);

create table if not exists public.staff_seat_audit_receipts (
  id uuid primary key default gen_random_uuid(),
  operator_id integer not null,
  action text not null check (action in ('invite', 'reset', 'revoke', 'prove', 'login_attempt')),
  actor_seat_id uuid not null,
  target_seat_id uuid not null,
  outcome text not null check (outcome in ('accepted', 'denied')),
  reason text not null,
  token_hash text,
  mail_sent boolean not null default false check (mail_sent = false),
  live_issuance text not null default 'blocked' check (live_issuance = 'blocked'),
  created_at timestamptz not null default now(),
  unique (operator_id, id),
  foreign key (operator_id, actor_seat_id)
    references public.operator_staff_seats(operator_id, id)
    on delete restrict,
  foreign key (operator_id, target_seat_id)
    references public.operator_staff_seats(operator_id, id)
    on delete restrict
);

create index if not exists staff_seat_audit_operator_created_idx
  on public.staff_seat_audit_receipts (operator_id, created_at desc);

alter table public.staff_seat_invites enable row level security;
alter table public.staff_seat_audit_receipts enable row level security;

revoke all on table public.staff_seat_invites from anon, authenticated;
revoke all on table public.staff_seat_audit_receipts from anon, authenticated;

create policy staff_seat_invites_select on public.staff_seat_invites
  for select to authenticated
  using (operator_id = public.current_operator_id());

create policy staff_seat_invites_insert on public.staff_seat_invites
  for insert to authenticated
  with check (operator_id = public.current_operator_id());

create policy staff_seat_invites_update on public.staff_seat_invites
  for update to authenticated
  using (operator_id = public.current_operator_id())
  with check (operator_id = public.current_operator_id());

create policy staff_seat_audit_select on public.staff_seat_audit_receipts
  for select to authenticated
  using (operator_id = public.current_operator_id());

create policy staff_seat_audit_insert on public.staff_seat_audit_receipts
  for insert to authenticated
  with check (operator_id = public.current_operator_id());

commit;
