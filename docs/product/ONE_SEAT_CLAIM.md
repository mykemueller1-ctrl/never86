# One-seat claim and approval

**State:** drafted, tested, not merged, not deployed, not live-verified.  
`sql/0006_one_seat_claim.sql` is a readiness draft. Do not apply it from this PR. Live credentials are not issued.

## Locked flow

1. A person verifies **email or Google**.
2. Verification creates a **pending CTAP request**. No checklist, schedule, or money.
3. The request lands in one Myke/Tom approval inbox.
4. Either approver matches the live roster and assigns role / department / seat, or rejects.
5. After approval, only that role-scoped workspace opens.

Phone and X wait until a real provider configuration exists.

## Fail-closed gates

- Missing `DATABASE_URL` or `ONE_SEAT_CLAIM_ENABLED !== true` → 503
- Email path without a mail provider → 503, **no raw token returned**, `mailSent: false`
- Google path without client id/secret/state secret → 503
- Unknown person on the roster → cannot approve
- Invite-token staff login at `/staff/login` stays a separate fail-closed door

## Surfaces

- `/staff/claim` — request a seat
- `/staff/pending` — verified, no tenant access
- `/staff/approvals` — Myke/Tom inbox
- `POST /api/staff/claim/start`
- `POST /api/staff/approvals/:id`

All staff claim surfaces are noindex and stay out of the sitemap.

## What this slice is not

- Not a Neon / Supabase apply
- Not auto-mail, CRM write, Facebook, or social
- Not real Community names, emails, phones, or private dollars in git
- Not a merge or production deploy
