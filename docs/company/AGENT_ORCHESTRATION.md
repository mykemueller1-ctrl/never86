# Agent orchestration & governance

**Canonical:** [`ORCHESTRATION_V1.md`](ORCHESTRATION_V1.md) · inventory [`AGENT_INVENTORY_2026-09-05.md`](AGENT_INVENTORY_2026-09-05.md)  
**Code:** `src/lib/orchestration/`  
**MCP:** `https://www.never86.ai/api/mcp`  
**Seat door:** `/portal`

## Promise

Find the leak. Assign the fix. Keep the receipt.  
**One supervisor. Five specialists. One job each.** Human approves memory and every external send.

## Seats

Supervisor routes to **labor**, **vendor**, **voids**, **action-shift**, **memory**.  
Tenant key is `operator_id`. Source-tagged memory persists forever. House-code portal is the only seat door.

Old store-team names and the seven-pack specialists alias into these seats. `design-qa` is killed.

## How LLMs should start

1. `get_operator_system`  
2. `list_specialists`  
3. `prompts/get` → `specialist_brief` for one seat  
4. One domain tool on operator-provided data  
5. Human approves store memory or any external draft  

Public CSV product catalog stays on `list_free_agents`. Company GTM jobs stay on `list_agent_jobs` team=company.

Superseded research notes: [`GREATEST_OPERATOR_AGENT_OS.md`](GREATEST_OPERATOR_AGENT_OS.md).
