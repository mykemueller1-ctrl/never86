-- Seed Community Tap as seat 1 on the Never86 1-seat Neon.
-- Public shop email only. No PIN, staff name, or private dollars.
-- Apply AFTER drizzle/0002_free_seat_neon.sql.
-- Magic-link activate still mints the credential when Myke clicks the mail.

begin;

insert into seat_operators (id, email, name, restaurant_name, source_page, created_at)
values (
  1000000,
  'communitypizza2026@gmail.com',
  'Owner',
  'Community Tap',
  '/onboard',
  now()
)
on conflict (email) do update
  set restaurant_name = excluded.restaurant_name;

insert into seat_locations (operator_id, name, created_at)
select 1000000, 'Community Tap', now()
where not exists (
  select 1 from seat_locations where operator_id = 1000000
);

select setval(
  pg_get_serial_sequence('seat_operators', 'id'),
  greatest(coalesce((select max(id) from seat_operators), 0), 1000000)
);

commit;
