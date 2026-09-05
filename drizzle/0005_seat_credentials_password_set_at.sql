-- Track when an operator sets their OWN password (vs. the unusable random
-- placeholder written at activation). Null until they set one from the
-- owner desk. Apply AFTER drizzle/0004_seat_auth_attempts.sql.

alter table seat_credentials
  add column if not exists password_set_at timestamptz;
