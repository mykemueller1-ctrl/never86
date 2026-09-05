# Never86 agent registry — rebuild v2

**Status:** drafted · tested in this PR · not merged · not deployed · not live-verified  
**Code:** `src/lib/orchestration/registry.ts` · `config/orchestration-registry.json`  
**Inventory:** `src/lib/orchestration/inventory.ts` · [`AGENT_INVENTORY_2026-09-05.md`](AGENT_INVENTORY_2026-09-05.md)  
**Architecture:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

Promise: Find the leak. Assign the fix. Keep the receipt.  
Rule: one agent · one job. LLM ranks. Human sends. No marketplace portal logins.

## Active factory seats (keep)

| Seat | One job | Side effects never |
|---|---|---|
| Supervisor | Route one intent to exactly one specialist. Never compute dollars. | auto-mail, auto-post, portal-login, theft allegation, guaranteed recovery |
| Labor | Schedule vs clock vs hourly sales. ≤3 labor moves. Never discipline. | same |
| Vendor | Invoice drift and vendor silence. Invoice ≠ COGS. | same |
| Voids | Void/comp vs this store’s peer band. Pattern, not verdict. | same |
| Action Shift | Yesterday → one action → night proof. | same |
| Memory | Human-approved, source-tagged store rules. Never deleted. | same |

Public CSV hunters on `/agents/*` stay **product**, not factory seats.  
Company GTM/social roles stay **company lane**. They draft; Myke sends.

## Removed from the active list (junk)

| Item | Disposition | Why |
|---|---|---|
| `agents/*.md` four-tier POS/folklore manifests | **archive** | Moved to `archive/agents-v0/`. Conflicts with one-job seats. |
| `design-qa` | **kill** | Orange leftover. Alias returns null. |
| beverage / food-invoice / recipe-cost | **replace** → Vendor | Same tools, one seat. |
| human-coach / operator-coach / proof-verifier | **replace** → Action Shift | One action, one proof. |
| store-chief / source-collector / margin-analyst / truth-qa | **replace** → Supervisor | Routing is not three jobs. |
| memory-curator | **replace** → Memory | Same job, tenant key `operator_id`. |
| `/communities` open-play lobby | **replace** → `/portal` | House code is the only seat door. |
| `/command-center/swarm` | **archive** | Redirects to `/action-shift/swarm`. |
| Overnight coordinator | **kill** | Obsolete. Do not relaunch. |
| Grok sales organization | **kill** | No SHA/PR. Do not relaunch. |
| Current system context / Agent-ctap-marketing | **kill** | Wrong repo. |
| ~140 idle browser/video/secret testers | **archive** | History only. Cap stays 1 writer. |
| grok-bot-restaurant-scout (238 shoppers) | **freeze** | Separate repo. Do not import. |

Remote Cursor archive is a recommendation. This PR does not kill live cloud agents.

## Doors

| Surface | Role |
|---|---|
| `/onboard` | Email-first stranger funnel. Claim the free owner seat. |
| `/login` | Returning owner email link. Not an orchestration seat. |
| `/portal` | **Only seat door.** CTAP house code → `operator_id`. Fail-closed. |
| `/communities` | Redirects to `/portal`. |
| `/staff/login` | Fail-closed. Not a seat door. |
| `/play` `/operator` | Demo URLs. Not stranger CTAs. SimpleOwnerDemo stays wired to `/api/ask` and `/api/upload`. |

## Brand

Void Hunter blue `#0066ff` on void surfaces. No orange/gold on Void Hunter.

## Automations still allowed (draft only)

Cursor recipes 1–8 in `CURSOR_AUTOMATIONS.md`, Vercel briefing cron, GitHub CI/IndexNow, draft-only Grok Bot social routines. Facebook stays deferred. Follow-up send cron stays **frozen**.
