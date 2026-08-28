# Staff role-day desk

**State:** drafted, tested, not merged, not deployed, not live-verified.  
Stacked after PR #157. Live staff credentials stay **blocked**.

## What this slice is

Each station seat sees **today's wall checklist** plus the **policies that seat needs**:

| Seat | Today | Policies |
|---|---|---|
| FOH manager | Bar whip + FOH Mon–Sun extras + liquor/beer cadence | Pour/POS, bucket prices, void vs promo, cost bands, coverage, deposit-before-close |
| Kitchen manager | Kitchen whip + prep dough-by-3 + fry AM/PM + drivers | Void vs promo, food cost band, dough by 3, late-delivery four questions |
| Bartender / server / prep / driver | Own station card + that day's extras | Only the policies that station rings or cooks |

Coverage: dining/back room Tue–Sun, never Monday; day Mon–Thu one out front; night two front + one back room.  
Cooked food is a **promo**, not a void. Cost bands are **percent policy**, not this week's dollars. Fry portion weights stay on the fry card — no invented recipe book.

## Surfaces

- `/staff/desk` — noindex role-day picker
- `/staff/seats` and `/dashboard/staff` embed the same desk
- `POST /api/staff/login` still 503; `POST /api/staff/invite` still 403

## Not in git

Real emails, PINs, passwords, phones, Karlee Sturtz, Ashley Holding, live weekly dollars, or live POs.
