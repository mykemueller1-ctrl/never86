# Free operator / Owner desk phone demo

**Track:** 1–3 unit Owner desk (`/operator`) · open suck-in play (`/play`)  
**Multi-unit track:** Command Center (`/command-center`) — separate product promise  
**Founder lock:** Keep the mouth and the cards. Do not invent dollars.

Public surfaces:
- `/play` — Action Shift suck-in open play (anyone, no login). Sample shop only.
- `/operator` — phone-first Owner desk
- `/onboard` / `/login` — claim or reopen a real free owner seat by email
- Seat 1 assignment (public): **Community Tap · first store**. No private CTAP dollars, PINs, or staff names on these surfaces.

Sample answers: `/operator/answers/{slug}` — labeled **FICTIONAL / sample-not-verified**.

## What this is

Phone-first **Owner desk** (`SimpleOwnerDemo`) for the 1–3 unit ICP. Action Shift home, Labor & schedule (Prime Cost Coach evidence), food/beverage trays, ask mouth (talk / type / photo / file). The composer calls `POST /api/ask` and `POST /api/upload`. Questions and answers persist tenant-scoped by `operator_id` with source tags (Neon = D1 equivalent on this stack). Files land in R2 when `R2_*` is configured, otherwise a Neon object fallback. Readiness is live from stored files. Evidence stays **NEED** / **READY**. Named is not a verified close. Sample answer URLs are noindex. Demo restaurant only — no Community Tap private data.

Open play at `/play` uses the same boarding voice: pain → POS email/photo/Drive (no day-one API) → one Action Shift → schedule → vendors → menu.

## What this is not

- Not a dashboard.
- Not the signed-in owner-seat EOD desk. Forward PDQ Z + Hourly + Void to `close+{seat}@inbound.never86.ai` stays on the signed-in owner seat.
- Not a live CTap close. No staff names, pars, or live Z dollars.
- Not staff login. `STAFF_SEAT_LOGIN_ENABLED` stays off. `POST /api/staff/login` stays fail-closed.
- Not multi-unit Command Center. Group rollups live under `/command-center`.

## Vendor silence

First 14 calendar days are advisory. Missing cadence is **Missing Evidence**, not $0 and not a missed truck.

## Evidence states for this job

| Claim | State |
|---|---|
| Pages and sample path in git | **drafted** then **committed** / **pushed** on the Cursor branch |
| PR against main | **opened** |
| Production deploy | after merge |
| Live-verified on www.never86.ai | after deploy |
