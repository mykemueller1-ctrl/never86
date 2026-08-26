-- Login / activation attempt log so throttles survive Vercel cold starts.
-- Apply AFTER drizzle/0003_free_seat_intake.sql. Safe if 0002+0003 already exist.
-- No operator FK: attempts happen before a seat exists.

create table if not exists seat_auth_attempts (
  id serial primary key,
  kind text not null,
  email text,
  request_ip text,
  created_at timestamptz not null default now()
);

create index if not exists seat_auth_attempts_kind_email_created_idx
  on seat_auth_attempts (kind, lower(email), created_at desc);

create index if not exists seat_auth_attempts_kind_ip_created_idx
  on seat_auth_attempts (kind, request_ip, created_at desc);
