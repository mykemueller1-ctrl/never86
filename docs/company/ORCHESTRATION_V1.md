# Never86 orchestration v1

**Status:** drafted · tested in this PR · not merged · not deployed · not live-verified  
**Code:** `src/lib/orchestration/`  
**Registry:** `config/orchestration-registry.json`  
**MCP:** `https://www.never86.ai/api/mcp`  
**Seat door:** `/portal`  
**Brand:** Void Hunter blue `#0066ff` only

Promise: Find the leak. Assign the fix. Keep the receipt.  
Rule: one agent · one job. LLM ranks. Human sends. No portal logins.

## Shape

```
/portal (house code) → operator_id
        ↓
   Supervisor
        ↓
 labor | vendor | voids | action-shift | memory
        ↓
 live MCP math at /api/mcp
```

Supervisor never computes dollars. Specialists call allowlisted public tools only. Tenant key is `operator_id`. Memory is source-tagged and never deleted.

## Seats

| Seat | One job |
|---|---|
| Supervisor | Route one intent to exactly one specialist. Never compute dollars. |
| Labor | Schedule vs clock vs hourly sales; ≤3 labor moves — never discipline. |
| Vendor | Invoice drift and vendor silence. Invoice ≠ COGS. No count → no food/bev cost. |
| Voids | Void/comp pattern vs this store’s peer band. Pattern, not verdict. |
| Action Shift | Yesterday → one action → night proof. |
| Memory | Human-approved, source-tagged store rules forever. A model guess is not memory. |

Killed as addressable seats: `design-qa` (orange leftover), overlapping store-team names, beverage / food-invoice / recipe-cost / human-coach / truth-qa. Those IDs alias into the five or return null.

## Tenant lake

- Every record requires `operator_id`.
- Source tag required: Verified / Reconciled / Partial / Estimated / Unverified / Missing Evidence.
- Append or supersede. `deleteLakeRecord()` always fails.
- Map-backed in process for tests. Draft SQL `sql/0008_orchestration_data_lake.sql` is **not applied**.

## Seat door

`/portal` is the only orchestration seat. Owner `/login` stays owner-only. Staff `/login` stays fail-closed. House codes are hashed. No live CTAP codes, PINs, or staff names are in git. HTTP stays `503` until `HOUSE_CODE_PORTAL_ENABLED=true` plus hash + operator_id in approved secret storage.

## What this does not do

- No merge, deploy, Neon apply, CRM write, send, or publish.
- No live MCP version bump claim. Production MCP is still v3.1.0 until this PR merges and deploys.
- No import of `grok-bot-restaurant-scout` (238 pain-shopper agents). Freeze that repo.
- No rewrite of `/agents/*` product pages or CSV adapters.

Inventory: [`AGENT_INVENTORY_2026-09-05.md`](AGENT_INVENTORY_2026-09-05.md).
