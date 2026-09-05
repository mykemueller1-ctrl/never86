# Neon 1-seat go-live — SQL is done. Vercel env is the remaining door.

**Project:** Never86 1 seat  
**project_id:** `misty-resonance-48939769`  
**Default branch:** production `br-wispy-paper-ae1nzoch`  
**SQL A+B:** applied (drizzle `0002`–`0004`, `sql/0006`–`0008`). Stop waiting on Neon.  
**Canary seat:** Community Tap (public label only)  
**Login email:** `communitypizza2026@gmail.com`

Do not paste connection strings, PINs, API keys, or staff names into git or this file.

## What this milestone is

One seat. Email claim → `/operator` Operator V2 plates desk.  
Not Command Center. Not extra FOH/BOH seats. Not a portal-only maze.

## Stranger door (locked)

`/` / `/onboard` / `/login` → magic-link email → `/activate` → `/operator` chat + plates.

`/portal` house-code is the later CTAP community door. It stays fail-closed until a hash is issued. It is **not** the stranger free-seat door.

## Vercel Production env names (no values)

Set on the project that deploys **www.never86.ai**. Names only. Do not print secrets.

| Name | Required | What to set |
|---|---|---|
| `DATABASE_URL` | yes | Pooled URL for this Neon project / production branch |
| `RESEND_API_KEY` | yes | Live Resend key. Missing → magic link 503 |
| `OWNER_EMAIL` | yes | Production notify for seat 1: `communitypizza2026@gmail.com` |
| `ONE_SEAT_CLAIM_ENABLED` | yes | `true` |
| `ONE_SEAT_ALLOW_LIVE_EMAIL` | yes | `true` |
| `HOUSE_CODE_PORTAL_ENABLED` | keep false | `false` — `/portal` stays fail-closed |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://www.never86.ai` |
| `CTAP_SEAT1_EMAIL` | optional | defaults to `communitypizza2026@gmail.com` |
| `CTAP_SEAT1_RESTAURANT` | optional | defaults to `Community Tap` |
| `STAFF_SEAT_LOGIN_ENABLED` | keep false | `false` — no extra seats |
| `HOUSE_CODE_HASH` | leave empty | `/portal` fail-closed |
| `HOUSE_CODE_OPERATOR_ID` | leave empty | |
| `HOUSE_CODE_PEPPER` | leave empty | |

Magic-link owner seat is live when `DATABASE_URL` + `RESEND_API_KEY` are present.  
`ONE_SEAT_CLAIM_ENABLED=true` + `ONE_SEAT_ALLOW_LIVE_EMAIL=true` unlock the 0006 claim plane for the live shop email.

Optional leftover: `sql/0009_ctap_seat1_seed.sql` seeds operator_id `1000000` for the shop email if that row is not there yet.

## Myke login path

1. `https://www.never86.ai/login` or `/onboard`
2. Enter `communitypizza2026@gmail.com`
3. Open the Resend mail **Open owner desk**
4. Land on `/operator` — plates: schedule, labor cards, menu, order guide + chat composer

## Honest leftovers

| If this is missing | What happens |
|---|---|
| `DATABASE_URL` points at the old Neon | Writes miss this 1-seat project |
| `RESEND_API_KEY` unset | 503 Activation email is unavailable |
| `ONE_SEAT_ALLOW_LIVE_EMAIL` unset | 0006 claim path rejects live shop email |
| House-code hash empty | `/portal` stays 401 fail-closed — correct |
