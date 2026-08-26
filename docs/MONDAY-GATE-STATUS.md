# Monday gate status — 2026-08-26

## Operating model (locked)
Grok (phone front door) → Cursor (runs agents/bots/code/PRs) → Codex (outside review / safe branch rails).
One Cursor factory job at a time. Kill stuck Grok sales organization before the next dispatch.

## Live deploy proof
GitHub Deployments API for `mykemueller1-ctrl/never86`:
- Production SHA `84e543a` (2026-08-26) = `origin/main` tip (Grok OAuth connector merge).
- Older note `b86eef9` is stale — that SHA is not in this repo; current production is.
- This repo deploys www.never86.ai (Vercel). Default git branch `recovery-apr12` is NOT production.

## Branch for this work
`cursor/monday-gate-onboard-6e56` from founder-authorized `codex/action-shift-122-safe`.

## What shipped in this PR
- Activation token migration `sql/0005_operator_activation.sql` (hashed token, expiry, consent).
- `requestOperatorActivation` + `activateOperatorSeat` using only proven columns from applied sql/0003+0004:
  - `operator_users(id, name, restaurant_name, email)`
  - `operator_locations(id, operator_id, name, city, state)`
  - `operator_credentials(...)`
- `/api/onboard/request`, `/api/onboard/activate`, `/activate` password UI (password never emailed).
- `/onboard` calls activation first; waitlist fallback if ops DB is 503.
- Dashboard empty state asks for prior complete business-day close only.
- AGENTS.md: Grok → Cursor → Codex + active job #118.

## Hard blocker (exact)
Supabase project `never86` (`zjtbhsouhwyyfwoyjgow`) is **INACTIVE** with **unpaid invoices**.
`restore_project` → `PaymentRequiredException`.
Without OPS DB up + `sql/0005` applied + `OPS_DATABASE_URL` in Vercel:
- stranger activation cannot complete live
- live schema re-check cannot run

## Phone taps for Myke (only these)
1. Stop/Archive stuck **Grok sales organization** Cursor chat if still ACTIVE.
2. Pay / unpause Supabase org invoices → restore project `never86`.
3. Paste `OPS_DATABASE_URL` (and `RESEND_API_KEY` if missing) into Cursor secrets / Vercel.
4. Confirm Cursor GitHub App has **write** on this repo.

## Do not
- Merge grok-sales-org dump (#121).
- Invent columns beyond the proven set above.
- Ask Myke to merge from a laptop.
