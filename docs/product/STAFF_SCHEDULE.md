# Staff Schedule / Time Off

**State:** drafted, tested, not merged, not deployed, not live-verified.  
Stacked on Worker Home (`/staff/desk`). Live staff credentials stay **blocked** until Neon apply of `sql/0005_staff_seat_auth.sql` plus `STAFF_SEAT_LOGIN_ENABLED=true`. This slice does **not** apply Neon.

## What this slice is

Schedule lives inside Worker Home. It is a floor board of **slots**, not a named roster.

1. **Week strip** — Mon–Sun dates plus that day's coverage counts.
2. **My shifts** — this station's unnamed slots for the selected day.
3. **Time Off** — inside Schedule: full day or partial day, date from the strip, note required. FOH routes to Kenzy. BOH and drivers route to Tom. In-app only. Dollars never.
4. **Swap / cover** — same house and same seat only. Counterpart is another slot of this station, not a person. Cross-tenant is denied.
5. **Standing availability** — this station's day / night / 11–1 windows. Not a roster name.
6. **Coverage counts** — CTap board pattern only as slot counts:
   - Friday / Saturday night: 5 pizza · 3 line · 1 dish · 3 drivers
   - Weekday 11:00–13:00: 1 unnamed driver slot
   - Dining / back room still Tuesday–Sunday, never Monday; day Mon–Thu one FOH front; night two front + one back room; Sunday two driver slots
7. **Needs Approval** — manager inbox. Owner sees both houses. FOH lead sees FOH. Kitchen lead sees BOH. Crew does not decide it.

Role privacy and tenant boundaries stay on. `POST /api/staff/login` stays fail-closed without `DATABASE_URL`.

## Not in git

Real emails, PINs, passwords, phones, Karlee Sturtz, Ashley Holding, live weekly dollars, live POs, Facebook, or a live named schedule.
