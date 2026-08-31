# Neon persist — phone-only owner checklist

**Task:** `neon-persist-cloud-v1`  
**State:** drafted + tested in this PR. Not merged. Not deployed. Not live-verified. Staff login stays fail-closed.

Do this on your phone. **Never paste the connection string into Git, chat, Slack, Grok, Cursor, or a PR.** Env **names** only below.

## Attach Neon later (owner)

1. Open neon.tech and sign in.
2. Create a **free** project. Name it `never86`.
3. Copy the **pooled** connection string from the Neon dashboard.
4. Open Vercel → project `never86` → Settings → Environment Variables.
5. Add name `DATABASE_URL` for **Production** only. Paste the pooled string as the value. Save.
6. Leave `STAFF_SEAT_LOGIN_ENABLED` unset or `false`. Do **not** enable it from this job.
7. Do **not** apply drizzle or `sql/0005_staff_seat_auth.sql` from this PR.

Public `/audit` and `/trial` keep working without `DATABASE_URL`.  
`GET /api/persist-health` returns `{ "databaseUrlPresent": true }` or `{ "databaseUrlPresent": false }` only.

## Later, after Myke approves (not this PR)

8. Reviewed apply of staff-seat SQL.
9. Optional: set `STAFF_SEAT_LOGIN_ENABLED` to `true` on Vercel Production.
10. Prove `POST /api/staff/login` before issuing any seat.

Supabase is not the persist path. Do not add `OPS_DATABASE_URL` for this attach.
