# Staff role-day desk

**State:** drafted, tested, not merged, not deployed, not live-verified.  
Replayed onto current `main` after #157 (`570e48d`). Live staff credentials stay **blocked** until Neon apply.

## What this slice is

Each station seat sees **today** by role:

1. Wall **checklist** for that station
2. **Coverage / schedule board** for that weekday
3. **Station comms** (in-app notes only)

| Seat | Today | Policies / board |
|---|---|---|
| FOH manager | Bar whip + FOH Mon–Sun extras + liquor/beer cadence | Pour/POS, bucket prices, void vs promo, cost bands, coverage, deposit-before-close |
| Kitchen manager | Kitchen whip + prep dough-by-3 + fry AM/PM + drivers | Void vs promo, food cost band, dough by 3, late-delivery four questions, weekday 11–1 driver naming, weekend driver counts |
| Bartender / server / prep / driver | Own station card + that day's extras | Only the policies that station rings or cooks |
| Line cook | Fry AM/PM + line station card | Fry rotation policy, void vs promo |
| Pizza | Pizza-side wall card + pizza-line open/close from existing kitchen steps | Dough by 3, void vs promo |
| Dishwasher | Dish start / shift / close | Dish pit card only |
| Owner | Owner desk | Cost bands, coverage, driver board, dollars comms |

Coverage: dining/back room Tue–Sun, never Monday; day Mon–Thu one out front; night two front + one back room.  
Weekdays 11:00–13:00: kitchen lead (Tom) names the driver on that window. Friday/Saturday: three drivers. Sunday: two good drivers.  
Station comms: front → Kenzy, back → Tom, dollars → Myke. **In-app notes only. No auto email.**  
Cooked food is a **promo**, not a void. Cost bands are **percent policy**, not this week's dollars. Fry portion weights stay on the fry card — no invented recipe book.

## Surfaces

- `/staff/desk` — noindex role-day picker (defaults to today)
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

Real emails, PINs, passwords, phones, Karlee Sturtz, Ashley Holding, live weekly dollars, live POs, or Facebook.
