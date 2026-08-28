# Staff seat login readiness

**State:** drafted, tested, not merged, not deployed, not live-verified.  
Live staff credentials are **not issued**. The existing `/login` operator credential still grants full operator access.

## What this slice is

Least-privilege **manager-first** station seats on top of the Action Shift workforce contract:

| Seat | Kind | Can invite / reset / revoke | Privileged proof |
|---|---|---|---|
| Owner | manager | FOH manager, kitchen manager, crew stations in the same tenant | cash, dough, alarm — source proof only |
| FOH manager | manager | bartender, server, driver | cash, alarm |
| Kitchen manager | manager | prep | dough, alarm |
| Bartender / server / prep / driver | station | none | none |

Operator A cannot own, prove, invite, or revoke operator B. A verbal yes does not close cash, dough, or alarm.

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
- `/staff/desk` — noindex role-day checklist + policies from the wall pack
- `/dashboard/staff` — operator-gated synthetic invite / reset / revoke desk
