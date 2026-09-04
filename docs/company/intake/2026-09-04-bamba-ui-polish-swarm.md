# Intake — bamba-ui-polish-swarm-v1

**Status:** drafted · tested in-repo · not merged · not deployed · not live-verified  
**Task:** `bamba-ui-polish-swarm-v1`  
**Base:** PR #189 Bamba sales-labor Command Center desk (Lane C)  
**Surface:** `/command-center/sales-labor` (reports gate, noindex)

## What this adds

Enterprise polish on the existing Bamba desk. Not a new product. Not Grill. Not CTap.

- Clean Daily / WTD / PTD views. Incomplete week stays Open.
- Store and region rollups plus a 16-store roster (six stores carry Aug 12 Daily dollars).
- One-click drill: system miss → store → void or catering line → owner role and due date.
- Zep Graphiti temporal memory + local `bamba-agentmemory` MCP. Facts have validity windows. Tenant is `bamba` only.
- Replay harness: Aug 12 system CY sales **125273.41**; Landmark highest Daily void rate; fail on drift.
- Chaos harness: kill 3 of 12 swarm jobs; desk degrades to **incomplete**, never **done**.
- 12-job agent config fanning to 16 stores.

## Hard gates

- No CTap or New American Grill numbers in fixtures or memory
- No staff names
- No merge, deploy, live migration, CRM write, or send
- No live Zep write from this factory job
