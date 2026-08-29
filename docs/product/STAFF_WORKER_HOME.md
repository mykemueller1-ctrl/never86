# CTap Worker Home

**State:** drafted, tested, not merged, not deployed, not live-verified.  
Live staff credentials stay **blocked** until Neon apply of `sql/0005_staff_seat_auth.sql` plus `STAFF_SEAT_LOGIN_ENABLED=true`.

## What this slice is

`/staff/desk` is the people-platform **Worker Home**, not the builder wall.

1. **Schedule** — week strip, CTap bar-week extras (Mon pop/ice through Sun parm + buff), my shifts, Time Off (full or partial day, date, note), same-house same-seat swap or cover, standing availability, coverage counts as slots not people, manager Needs Approval inbox. See `docs/product/STAFF_SCHEDULE.md`.
2. **Ask** — answers only from the CTap waitress/server quiz, dress SOP, and menu-special extracts already in the repo / Drive: Community Special, what can I wear, pour spec. No invented dollars. Cannot-answer is first-class.
3. **Comms rooms** All / FOH / BOH. Staff talk inside their house. Managers see all. Crew does not see each other's checklist misses.
4. **Role-day checklists** stay wired by seat + weekday via `buildStaffRoleDayDesk`. The builder wall remains on `/staff/seats`.
5. **Miss board** visible only to owner (Myke), FOH manager (Kenzy), and kitchen manager (Tom). Station labels only.
6. **`/staff/login`** exists and fails closed 503 without `DATABASE_URL` / `STAFF_SEAT_LOGIN_ENABLED`. No live credentials, no invite mail, no Neon apply.

Floor words on kitchen / driver / line / pizza: ticket, printer, driver area, dispatch.

## Surfaces

- `/staff/desk` — noindex Worker Home (Schedule + Ask + rooms)
- `/staff/seats` — role-day wall + synthetic invite desk (unchanged)
- `POST /api/staff/login` — fail-closed without `DATABASE_URL`
- `POST /api/staff/invite` — 403, `mailSent: false`

## Not in git

Real emails, PINs, passwords, phones, Karlee Sturtz, Ashley Holding, live weekly dollars, live POs, Facebook, or counting.
