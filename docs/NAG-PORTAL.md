# New American Grill portal

Tenant: `nag`. Owner: Max Turner. Seeded from Toast exports Aug 24–30, 2026.

## Routes
- `/nag` — store desk: week snapshot, revenue by room, the leak, menu
- `/nag/prime-cost` — weekly prime cost table + next action

## Brand
Void Hunter blue only (`#0066ff` → `#003bb5`). No gold, orange, or cream.

## Data
`src/data/nag-seed.ts` holds store profile, week snapshot, menu. Neon wiring lands in the next pass once `DATABASE_URL` is set on the deploy target.

## Do not
- Mix Taco Bamba numbers or names here.
- Invent food cost % without a vendor invoice file.
