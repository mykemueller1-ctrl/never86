# Intake — privacy close + one-seat claim start

**From:** Cursor factory (local)  
**Status:** partial  
**For HQ:** Grok command hub

## What I found

- AEO `#139` was already merged. No new search-page work.
- Public leak PRs `#162` and `#167` were redacted and **closed without merge**.
- Production `main` is `678a96e`. Clean worktree is `cursor/one-seat-claim-contain-29aug`.
- One-seat claim/approval code is drafted on that branch (email/Google → pending → Myke/Tom roster match). No Neon apply. No mail sent. Tests not yet green in this run.

## Files created/changed

- `src/lib/oneSeatClaim.ts` + tests/HTTP helpers
- `/staff/claim`, `/staff/pending`, `/staff/approvals` + APIs
- `sql/0006_one_seat_claim.sql` (draft, do not apply)
- public `GROK_HANDOFF.md` stripped of store-private dollars

## Open loops for Myke

- Tests/PR not pushed. Next: run vitest off the inner worktree, push the claim branch, open the auth PR.
- History rewrite / GitHub Support cache cleanup still a separate gate.
- Preview URLs for the closed PRs may still exist until Vercel GC.

## Do NOT do from cloud

- Do not merge `#162` / `#167` (already closed).
- Do not apply `0006` or issue credentials.
- Do not put CTAP dollars back on `main`.
