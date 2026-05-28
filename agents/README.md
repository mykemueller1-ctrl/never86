# agents/

The agent architecture for the platform. Each `.md` file in this directory is a **manifest** — the source-of-truth definition for one specialist's domain, scope, and limits. Manifests are internal; they are never customer-facing.

## Tier structure

| Tier | Role |
|---|---|
| **0** | Governance — Checker + Myke Mueller Logic. Everything passes through here. |
| **1** | Source specialists — one per integration. Deep, narrow expertise. |
| **2** | Aggregators + leakage hunters — roll Tier 1 outputs into operator-readable stories. |
| **3** | Operational / meta — the agents that keep the platform itself honest. |

## Manifest shape

Every manifest follows the same shape:

- **Tier** — 0 / 1 / 2 / 3
- **Status** — `live` · `scaffold` · `awaiting-data` · `stub`
- **Owns** — domain knowledge areas (the deep expertise body)
- **Reports to** — which aggregator or role-view consumes this agent's output
- **Data sources** — what feeds it (with Verified/Estimated/Unverified tagging up front)
- **Can claim** — what this agent is allowed to output as Verified
- **Cannot claim** — what this agent must downgrade to Estimated or refuse entirely
- **Calibration questions** — what we need from the operator to fully tune it

The Checker (Tier 0) enforces these declarations on every output.

## Inventory

### Tier 0 — Governance
- `checker.md` — the rule enforcer
- `myke-mueller-logic.md` — operator wisdom + veto

### Tier 1 — Source specialists (confirmed in Taco Bamba's stack)
- `toast.md` — POS
- `thanx.md` — loyalty
- `marqii.md` — listings management *(new — caught from Rik email)*
- `looker.md` — BI middleware *(new — Thanx reports flow through it)*
- `end-of-night-reports.md` — store-level closing forms *(new — TB's internal system)*
- `doordash.md` — 3P delivery (MFS settlement)
- `uber-eats.md` — 3P delivery

### Tier 1 — Source specialists (stubs, not yet in TB's stack)
- `grubhub.md`, `square.md`, `clover.md`, `aloha.md`, `lightspeed.md` — additional POS / 3P; lit up when a future operator uses them
- Scheduling/payroll specialists (`7shifts`, `hotschedules`, `homebase`, `adp`, `gusto`) — same

### Tier 2 — Aggregators + hunters
- `3p-aggregator.md` — rolls DoorDash + Uber + GrubHub into one operator view
- `restaurant-accountant.md` — turns numbers into a CEO-readable story
- `trade-area.md` — halo + heat map per location
- `void-hunter.md` — *(already live — see `void_hunter_findings` + `/command-center`)*

### Tier 3 — Operational
- `brand-voice-enforcer.md`, `hr-legal-redteam.md`, `devops-verifier.md`, `e2e-verifier.md`, `onboarding.md`, `customer-success-watcher.md`, `audit-receipts.md`, `sec-peer.md` — stubs until needed

---

*Manifests evolve. When an agent gains a rule, that rule lands here as a PR, not in someone's head.*
