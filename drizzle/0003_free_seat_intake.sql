-- Neon free-seat intake / close / night proof for Monday gate (#118).
-- Apply AFTER drizzle/0002_free_seat_neon.sql.
-- Do not delete source intake rows; proofs reference closes.

create table if not exists seat_intake_events (
  id serial primary key,
  operator_id integer not null references seat_operators(id) on delete cascade,
  location_id integer not null references seat_locations(id) on delete cascade,
  channel text not null,
  source_filename text,
  source_from text,
  report_family text,
  business_date date,
  payload jsonb not null default '{}'::jsonb,
  injection_suspected boolean not null default false,
  rejected_reason text,
  created_at timestamptz not null default now()
);

create index if not exists seat_intake_events_operator_created_idx
  on seat_intake_events (operator_id, created_at desc);

create table if not exists seat_closes (
  id serial primary key,
  operator_id integer not null references seat_operators(id) on delete cascade,
  location_id integer not null references seat_locations(id) on delete cascade,
  business_date date not null,
  desk jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists seat_closes_operator_location_date_idx
  on seat_closes (operator_id, location_id, business_date);

create table if not exists seat_proofs (
  id serial primary key,
  operator_id integer not null references seat_operators(id) on delete cascade,
  close_id integer not null references seat_closes(id) on delete restrict,
  action_id text not null,
  outcome text not null,
  proof_kind text not null,
  proof_note text,
  created_at timestamptz not null default now()
);

create index if not exists seat_proofs_close_idx
  on seat_proofs (close_id, created_at desc);
