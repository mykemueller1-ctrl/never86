# Monday gate status — 2026-08-26

## Operating model (locked)
Grok (phone) → Cursor (agents/bots/code/PRs) → Codex (outside review).
One Cursor factory job at a time.

## Live deploy
Production SHA on `main` still serves www.never86.ai. This slice does **not** deploy or apply Neon.

## Live stack (landed on allowlist)
| PR | Branch | Status |
| --- | --- | --- |
| **#131** | `cursor/never86-pr-130-merge-ready-0699` | Merged into `codex/action-shift-122-safe`. Dirty **#130** closed. |
| **#132** | `cursor/never86-vendor-drift-action-shift-6c5c` | Landed. |
| **#133** | `cursor/never86-po-receive-usage-gap-b6b2` | Landed. |
| **#134** | `cursor/never86-vendor-silence-action-shift-69a5` | Landed @ `f92f89d`. |
| **#135** | `cursor/monday-gate-apply-neon-6e56` | Open; Monday gate + two-date unattended. Claimed red (TS at operatorActivation). |
| **#137** | `cursor/neon-free-seat-apply-9d74` | Draft; ops apply + door probe. Claimed green. |

Allowlisted tip: `codex/action-shift-122-safe` @ `f92f89d`. Reconcile PR: **#138** `cursor/never86-pr-135-137-reconcile-c42a`.

Local evidence (this agent, not CI yet): `npx vitest run` **221/221** (30 files). `npm run lint` green. `npm run build` TypeScript + Next production green. Does not merge/deploy/apply Neon.

## What this reconcile keeps
- Join → email activation token → one Neon free store + one login.
- Yesterday close via paste / file upload / forwarded email. PDQ native-text → desk numbers + ≤3 Action Shift moves.
- Vendor drift / PO gap / vendor silence from #131–#134.
- **Two-business-date unattended gate from #135:** Z + Hourly + Void each parse on two different dates. Same-day re-upload does not count. Desk returns `unattendedRoutines.enabled: false` until then.
- **One Neon apply/probe path:** `npm run db:apply-free-seat` → `scripts/apply-free-seat.sh` (exit 2 if `DATABASE_URL` missing; never prints the URL). Probe: `node scripts/probe-free-seat-door.mjs https://www.never86.ai`. Do not add `apply-free-seat-neon.sh`.

## Onboarding harden (this slice)
- Fail closed if activation email is unavailable. Never return raw tokens.
- Normalized-email + trusted-IP request throttles; login throttling.
- HTML-escape user values in activation/owner mail.
- Atomic token consume (`consumed_at IS NULL` + unexpired).
- Neon credential with a bad password does **not** fall through to OPS for the same email.

## Apply Neon (ops, not this agent)
```bash
npm run db:apply-free-seat
# exits 2 if DATABASE_URL is missing (do not paste the URL in chat, git, PR, or logs)
node scripts/probe-free-seat-door.mjs https://www.never86.ai
```

Or paste in Neon SQL Editor:
- `drizzle/0002_free_seat_neon.sql`
- `drizzle/0003_free_seat_intake.sql`

## Residuals
- Neon 0002+0003 apply is ops (blocking stranger door on www).
- Inbound DNS.
- Gmail poll later.
- OCR later.
- `docs/company/intake/CHATGPT_HANDOFF.md` and `INBOX.md` were not in this checkout.

## Do not
Merge this PR. Merge grok-sales-org (#121). Re-open dirty #130. Deploy production. Apply Neon from the factory. Auto-send. Invent dollars. Print private store totals or `DATABASE_URL` in public comments.
