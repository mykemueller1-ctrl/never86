# Action Shift workforce foundation

## What this slice establishes

Action Shift now has a private, tenant-scoped data contract for:

- manager and staff seats with an optional authentication subject;
- effective-dated, location-aware role assignments;
- POS, time-clock, scheduling, checklist, and identity-provider worker mappings;
- normalized scheduled/worked shifts;
- versioned role/location checklist templates and steps;
- assigned checklist runs and evidence-backed step receipts; and
- human feedback/corrections queued as learning candidates.

The canonical migration is
`supabase/migrations/20260826005152_action_shift_workforce.sql`. The matching
Drizzle definitions live in `src/db/schema.ts`.

## Privacy and authorization boundary

No employee names, emails, schedules, provider IDs, or checklist evidence belong
in Git. Those values are inserted only into the private tenant database after an
operator supplies or approves the source.

Every table carries `operator_id`, has row-level security enabled, rejects
anonymous table access, and uses the existing `current_operator_id()` tenant
policy. Composite `(operator_id, parent_id)` foreign keys also prevent a child
record from linking to another tenant's seat, location, template, shift, run, or
receipt parent even if an ID is guessed. Evidence URIs must target private
tenant-scoped storage.

Role assignments are represented in the database, but the current migration does
not claim that the public `/action-shift` page is a staff login surface. Staff
authentication, owner/manager administration, and per-role API policy tests are
the next delivery slice.

## Deterministic schedule matching

`src/lib/actionShiftWorkforce.ts` maps a provider worker ID to exactly one active
seat inside the same operator, resolves roles effective on the shift date, and
selects only active templates for that operator, location, role, and date.
It uses an explicit provider business date when available and otherwise preserves
the calendar date from the provider's offset timestamp instead of converting the
shift to UTC and moving a late-night close into the next day.

It refuses to silently guess when a shift has:

- no external worker ID;
- no approved identity link;
- an inactive or cross-tenant seat;
- no active role assignment;
- an invalid time window; or
- a duplicate identity or imported shift key.

Unmatched rows remain explicit intake work. Display-name matching is not used as
an identity key.

## Learning boundary

`action_shift_feedback` records accepted, rejected, completed, failed, corrected,
or needs-review outcomes. New feedback starts as `candidate`; it does not
automatically change production prompts, rules, model weights, or decisions.
Application requires a review trail so the mini-brain can improve without
learning from unverified or private data by accident.

## Release state

- Code generation: complete.
- Unit tests, lint, and production build: required before each push.
- Live database migration: not applied by this commit.
- Real staff/schedule import: blocked until Myke supplies the approved roster and
  schedule source and the live database is active.
