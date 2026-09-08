-- 0010_person_password.sql
--
-- One person email, one password, many isolated seats.
-- Idempotent. ensureFreeSeatSchema() applies the same DDL on Neon.
-- Drops seat_operators.email / seat_credentials.email UNIQUE so one
-- person can own Community Tap AND New American Grill (and the next store).
-- One operator still has one store (seat_locations_one_free_store_idx).
-- Do not mint plus-alias emails.

begin;

alter table seat_operators drop constraint if exists seat_operators_email_key;
alter table seat_operators drop constraint if exists seat_operators_email_unique;
drop index if exists seat_operators_email_idx;
create index if not exists seat_operators_email_idx on seat_operators (email);

alter table seat_credentials
  add column if not exists password_set_at timestamptz;

alter table seat_credentials drop constraint if exists seat_credentials_email_key;
alter table seat_credentials drop constraint if exists seat_credentials_email_unique;
drop index if exists seat_credentials_email_idx;
create unique index if not exists seat_credentials_one_per_operator_idx
  on seat_credentials (operator_id);
create index if not exists seat_credentials_email_idx on seat_credentials (email);

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
