# Neon persist — owner checklist

**Task:** `neon-persist-cloud-v1` / `prod-persist-attach-v1`  
**State:** `#178` **merged** at `c57d5d13`. Production **live-verified** 2026-09-01 and re-probed 2026-09-03. Staff login stays fail-closed.

`GET https://www.never86.ai/api/persist-health` returns `{ "databaseUrlPresent": true }` only.  
Do **not** paste a connection string into Git, chat, Slack, Grok, Cursor, or a PR. Env **names** only below.

## Already done (do not repeat)

Production Vercel project `never86` on `mykes-projects-6f549d7f` already has `DATABASE_URL` present.  
The owner does **not** need to open neon.tech, copy a pooled string, or add the env again.

1. Leave `STAFF_SEAT_LOGIN_ENABLED` unset or `false`. Do **not** enable it from this job.
2. Do **not** apply drizzle or `sql/0005_staff_seat_auth.sql` from this PR.
3. Do **not** create a second Vercel project. Do **not** treat hobby `myke-muellers-projects` / `compass` as production.

Public `/audit` and `/trial` keep working without a new Neon attach.

## Only if persist-health ever returns false

If `GET /api/persist-health` is `{ "databaseUrlPresent": false }`:

1. Open neon.tech and sign in (human).
2. Use the existing free project named `never86` if it exists; do not invent a URL.
3. Copy the **pooled** connection string from the Neon dashboard.
4. Open Vercel → project `never86` (`mykes-projects-6f549d7f`, Production) → Settings → Environment Variables.
5. Add name `DATABASE_URL` for **Production** only. Save. Never paste the value into chat or Git.

A cloud agent may write that env only when a Vercel/Neon credential already exists in its environment. This worker did not have one and did not invent a value.

## Later, after Myke approves (not this PR)

6. Reviewed apply of staff-seat SQL.
7. Optional: set `STAFF_SEAT_LOGIN_ENABLED` to `true` on Vercel Production.
8. Prove `POST /api/staff/login` before issuing any seat.

Supabase is not the persist path. Do not add `OPS_DATABASE_URL` for this attach.
