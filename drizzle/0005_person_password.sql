-- Track when a person sets their OWN password (vs. the unusable random
-- placeholder written at activation). Person hash is shared across stores.
-- Apply AFTER drizzle/0004_seat_auth_attempts.sql.

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
