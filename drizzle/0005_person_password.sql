-- One person email, one password, many isolated seats.
-- Apply AFTER drizzle/0004_seat_auth_attempts.sql.
-- Drops the 1-store-per-email unique so the same login opens every store.

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
