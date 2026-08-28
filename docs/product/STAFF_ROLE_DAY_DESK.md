# Staff role-day desk

**State:** drafted, tested, not merged, not deployed, not live-verified.  
Includes `/staff/desk` because PR #160 was still open. Live staff credentials stay **blocked** until Neon apply. This PR does not merge or production-deploy.

## What this slice is

Deep small-ICP seats on one product. Quick Wins owner seat already exists. These seats are next:

| Seat | Owner | Today |
|---|---|---|
| Owner | Myke | Drawer and bank. Deposit before close. A $0 actual plus a counted drawer is unentered, not a shortage, and not driver late. |
| FOH manager | Kenzy | FOH only. Not kitchen make-time. Not the driver board. |
| Kitchen manager | Tom | Kitchen + drivers. Ticket out of the printer, bag and tag, driver area, grab, hit dispatch. Late on Z: ask dispatch first, then the 11–1 window. Do not restaff off a missed button. |
| Line cook | line | Ticket out, bag and tag, driver area. Do not hold the second lunch ticket. |
| Dishwasher | dish | Dishes between runs. Delivery dishes in. Not the lot. |
| Driver | driver | Same order path. The bag is not the cue. |

Weekday 11:00–13:00 driver slot exists. **No name on this desk.** Friday/Saturday night: 3 drivers. Sunday: 2 only if good. Sunday till 6 is open.

Tom board counts (coverage, not roster names):

- Mon–Thu AM: 2 line, 1 pizza
- Fri day: 2 fry/line, 2 pizza, 1 driver
- Mon night: 3 pizza, 2 line, 2 drivers
- Tue: 3 pizza, 2–3 line, 2 drivers + dish
- Wed: 3 pizza, 2 line, 2 drivers + dish
- Thu: 4 pizza, 2 line, dish, 2 drivers
- Fri+Sat night: 5 pizza, 3 line, dish, 3 drivers
- Sun: 4 pizza, 2 line, 2 good drivers

Station comms stay in-app notes only. Front → Kenzy. Back → Tom. Dollars → Myke. No auto email. No Action Shift jargon on staff screens.

## Surfaces

- `/staff/desk` — noindex seat picker (defaults to owner)
- `/staff/seats` and `/dashboard/staff` embed the same desk
- `POST /api/staff/login` fails closed without `DATABASE_URL`; live only after Neon apply + `STAFF_SEAT_LOGIN_ENABLED=true`
- `POST /api/staff/invite` still 403, no mail
- Owner credential stays at `/login`

## Login enable path (after Neon apply)

1. Myke applies `sql/0005_staff_seat_auth.sql` to Neon. This PR does **not** apply it.
2. Set `DATABASE_URL` (already required for the free seat).
3. Set `STAFF_SEAT_LOGIN_ENABLED=true`.
4. Set `STAFF_SEAT_SESSION_SECRET` (or `OPERATOR_SESSION_SECRET`).
5. Insert invite rows privately: `invite_handle` is not an email; `token_hash` is SHA-256 of the delivery secret. Never store plaintext secrets, PINs, or real emails in git.
6. Staff signs in at `/staff/login`. Owner `/login` stays owner-only. No mail is sent.

## Not in git

Real emails, PINs, passwords, phones, Karlee Sturtz, Ashley Holding, the unnamed 11–1 driver, live weekly dollars, live POs, or Facebook.
