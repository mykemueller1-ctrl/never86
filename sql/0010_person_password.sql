-- 0010_person_password.sql
--
-- One person email, one password, many isolated seats.
-- Idempotent. ensureFreeSeatSchema() applies the same DDL on Neon.
-- Does not drop seat_operators.email unique (public second-store claim
-- still 409s). Extra stores attach via seat_person_access.
-- Do not mint plus-alias emails.

begin;

alter table seat_credentials
  add column if not exists password_set_at timestamptz;

create table if not exists seat_person_passwords (
  id serial primary key,
  email text not null unique,
  password_hash text not null,
  password_set_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists seat_person_access (
  id serial primary key,
  email text not null,
  operator_id integer not null,
  created_at timestamptz not null default now()
);

create unique index if not exists seat_person_access_email_operator_idx
  on seat_person_access (email, operator_id);

commit;
