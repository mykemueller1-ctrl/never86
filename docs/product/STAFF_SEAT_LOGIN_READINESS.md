# Staff seat login readiness

**State:** drafted, tested, not merged, not deployed, not live-verified.  
Live staff credentials are **not issued** until Neon apply of `sql/0005_staff_seat_auth.sql` **and** `STAFF_SEAT_LOGIN_ENABLED=true`. The existing `/login` operator credential still grants full operator access and stays owner-only.

## What this slice is

Least-privilege **manager-first** station seats on top of the Action Shift workforce contract:

| Seat | Kind | Can invite / reset / revoke | Privileged proof |
|---|---|---|---|
| Owner | manager | FOH manager, kitchen manager, crew stations in the same tenant | cash, dough, alarm — source proof only |
| FOH manager | manager | bartender, server, driver, pizza | cash, alarm |
| Kitchen manager | manager | prep, line cook, dishwasher | dough, alarm |
| Bartender / server / prep / driver / line cook / pizza / dishwasher | station | none | none |

Operator A cannot own, prove, invite, or revoke operator B. A verbal yes does not close cash, dough, or alarm.

## Login enable path (after Neon apply)

This PR does **not** apply SQL, mint live passwords, or send mail.

1. Fail closed if `DATABASE_URL` is missing.
2. Stay blocked unless `STAFF_SEAT_LOGIN_ENABLED` is exactly `true`.
3. After Myke applies `sql/0005_staff_seat_auth.sql`, set that flag plus `STAFF_SEAT_SESSION_SECRET`.
4. Invite tokens are stored as `token_hash` only. Handles are not emails or PINs.
5. `POST /api/staff/invite` remains 403 with `mailSent: false`. Delivery stays a human-approved channel.
6. Owner `/login` is never copied onto a staff seat. Staff sessions set `grantsFullOperatorAccess: false`.


## What this slice is not

- Not live credential issuance
- Not a Neon / Supabase apply
- Not auto-mail, CRM write, Facebook, or social
- Not real Community Tap names, emails, phones, PINs, payroll, or live schedules in git

Draft SQL lives at `sql/0005_staff_seat_auth.sql` and is intentionally unapplied.

## Private inputs still required before any real CTap login

These stay off git. Supply them privately to Myke's operator plane:

1. `approved-roster-source` — operator-approved roster, one row per seat, names private
2. `approved-schedule-source` — approved current-week schedule file, not a live board paste
3. `owner-credential-stays-owner-only` — written confirmation `/login` stays the owner plane
4. `first-manager-seats` — FOH manager and/or kitchen manager first; crew waits
5. `authorized-work-emails` — per-seat work emails Myke authorizes; no POS PINs or phones
6. `invite-delivery-channel` — human-approved delivery path; no auto-mail
7. `live-schema-apply-approval` — explicit approval to apply invite + audit tables
8. `store-timezone-cutoff` — timezone and business-day cutoff

## Surfaces

- `/staff/login` — noindex staff door; live POST is fail-closed
- `/staff/seats` — noindex synthetic model + private-input stop
- `/dashboard/staff` — operator-gated synthetic invite / reset / revoke desk
