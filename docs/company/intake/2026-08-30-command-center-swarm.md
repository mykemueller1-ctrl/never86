# Intake — command-center-swarm-v1

**From:** Cursor factory / command-center-swarm-v1  
**Status:** drafted · tested in-repo · not merged · not deployed  
**For HQ:** Grok command hub

## What I found

- Operator System v3.1 store + company specialists are now a runnable orchestration layer.
- All 10 free agents accept CSV. Sample Store One has inputs, outputs, and a first Action Shift.
- Truth gates, injection/secret defenses, and human-approval (never-send) are on the code path.
- Status dashboard: `/command-center/swarm`. CLI: `npm run swarm:run`.

## Files created/changed

- `src/lib/commandCenterSwarm/`
- `src/lib/threePFeeFinderCsv.ts`, `src/lib/rateCardAuditCsv.ts`, `src/lib/shiftPulseCsv.ts`
- `public/samples/swarm/`
- `src/app/command-center/swarm/page.tsx`
- `docs/company/COMMAND_CENTER_SWARM.md`

## Open loops for Myke

- Review the isolated-branch PR. Do not merge or deploy from this packet.
- Sample store only. No CTAP private figures.

## Do NOT do from cloud

- Merge, deploy, live Neon apply, credential issuance, CRM write, social send, portal login.
