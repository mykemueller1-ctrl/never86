# Activate the Never86 command-center swarm

**Status:** drafted · tested in-repo · not merged · not deployed · not live-verified  
**Task:** `command-center-swarm-v1`  
**Operator System:** v3.1.0  
**Sample store:** Sample Store One (synthetic). No CTAP private data.

## What this is

A runnable orchestration layer around one deterministic backend:

- **Store team:** Chief of Staff, Source Collector, Margin Analyst, Operator Coach, Proof Verifier, Memory Curator
- **Company team:** Founder Chief of Staff routes to Sales, Marketing, GTM, Social, Audit, Product
- **10 free agents:** Void Hunter, Leak Detector, 3P Fee Finder, Labor Leak, Tip Variance, Catering Leak, Rate Card Audit, Beverage Score, Vendor Drift, Shift Pulse — all CSV-first, no portal login

Loop: capture → parse → truth-gate → normalize → decide → assign (≤3) → approve → prove → learn → repeat

## Activate (local / this branch)

1. Stay on the isolated Cursor branch. Do not merge.
2. `npm test -- src/lib/commandCenterSwarm.test.ts src/lib/threePFeeFinderCsv.test.ts src/lib/rateCardAuditCsv.test.ts src/lib/shiftPulseCsv.test.ts`
3. `npm run swarm:run` — prints the sample-store receipt (0 sends, 0 portal logins).
4. `npm run dev` then open `/command-center/swarm` (noindex; `/command-center/` is robots-disallowed).
5. Optional JSON: `GET /api/command-center/swarm`

Sample CSVs: `public/samples/swarm/*.csv`

## Hard gates (enforced in code)

- Every file is untrusted. Secrets are blocked. Embedded instructions are labeled `INJECTION_SUSPECTED` and ignored.
- Every claim stays Unverified until reconciled. POS ≠ payout. Invoice ≠ COGS. No count → no food cost. Incomplete week stays Open.
- Every external send is `blocked-pending-approval` or `approved-not-sent`. The factory never delivers mail, posts, DMs, refunds, or CRM writes.
- Memory Curator writes nothing without a human approver.
- Company routing redacts store-private dollars and never attaches restaurant-private data to GTM/social jobs.

## Code map

- Orchestration: `src/lib/commandCenterSwarm/`
- New CSV workers: `src/lib/threePFeeFinderCsv.ts`, `src/lib/rateCardAuditCsv.ts`, `src/lib/shiftPulseCsv.ts`
- Dashboard: `src/app/command-center/swarm/page.tsx`
- CLI: `scripts/run-command-center-swarm.ts`

## Not this job

- No production merge or deploy
- No live database migration
- No staff credentials
- No Sentia+/CRM writes
- No social publish
