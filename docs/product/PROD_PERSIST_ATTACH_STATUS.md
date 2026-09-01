# Production persist-health — live-verified

**Task:** `prod-persist-attach-v1`  
**State:** **live-verified** on `www.never86.ai`. No deploy-config change. No secret written. Staff login stays fail-closed.

Probed 2026-09-01 ~02:40 UTC by cloud worker `bc-b20d38ab` on `cursor/never86-prod-persist-attach-v1-871d`. Not Myke's computer.

## What is true

| Claim | Evidence | State |
|---|---|---|
| `#178` persist-health on `main` | merge `c57d5d13c11717ba2962bffc3a81548899f78da0` (2026-08-31 21:45 UTC) | **merged** |
| GitHub CI on that SHA | `verify` success run `33442983311` | **tested** |
| Real Vercel project (CI) | `https://vercel.com/mykes-projects-6f549d7f/never86/5X2TR5EixFY4jn17neLAk14cu2sn` | **deployed** |
| GitHub Production deployment | id `6190212314`, SHA `c57d5d13`, state `success` (21:46 UTC) | **deployed** |
| Public route | `GET https://www.never86.ai/api/persist-health` → HTTP 200 `application/json`, `x-matched-path: /api/persist-health` | **live-verified** |
| Body shape | keys exactly `{ databaseUrlPresent }` | **live-verified** |
| Presence boolean | `{ "databaseUrlPresent": true }` | **live-verified** |
| Apex host | `https://never86.ai/api/persist-health` → 307 to `www` | **live-verified** |
| Staff login stays closed | `POST /api/staff/login` → 503; body does not contain a connection string | **live-verified** |

No URL value was printed, logged, or committed. The health route never echoes `DATABASE_URL`.

## What this worker did **not** do

- Did not merge `#177` or `#179` (both remain **open**).
- Did not create a second Vercel project.
- Did not use hobby team `myke-muellers-projects` as production. This worker's Vercel MCP only sees that hobby team, and the only project there is unrelated `compass`.
- Did not log into Neon.
- Did not invent a postgres URL.
- Did not commit `.env`.
- Did not set `STAFF_SEAT_LOGIN_ENABLED` (and did not set it `true`).
- Did not write production env. Cloud agent environment has **no** `DATABASE_URL`, `VERCEL_TOKEN`, or Neon API key. Production already reports `databaseUrlPresent: true`, so no attach was required.

The stale “today it 404s” claim was **false** by the time this worker probed. `#178` had already produced a successful Production deploy on `mykes-projects-6f549d7f/never86`.

## Blockers

None for persist-health itself.

If a later job must *change* production env: this cloud agent cannot write Vercel env on the real project (MCP is the hobby `compass` team only; no production Vercel/Neon credential in the agent env). Name the missing env. Do not invent a value.

## Next owner

Codex: confirm this packet does not treat hobby `compass` as production and does not claim a secret write.

Myke: no phone attach required for `DATABASE_URL` — production already reports present. Leave `STAFF_SEAT_LOGIN_ENABLED` unset/`false` until a reviewed staff-auth activation.
