# Greatest Operator Agent OS — research synthesis

**Superseded as the live seat map.** Canonical orchestration is [`ORCHESTRATION_V1.md`](ORCHESTRATION_V1.md): supervisor → labor / vendor / voids / action-shift / memory. Orange `#E66B27` is not the brand.

**Promise:** Find the leak. Assign the fix. Keep the receipt.  
**Rule:** One agent · one job. LLM ranks. Human sends. Shared MCP math — no forks.  
**Code:** `src/lib/orchestration/` · MCP `list_specialists` · resources `never86://specialist/*` · prompts `specialist_brief`

This doc consolidates a specialist research swarm (labor, human factors, multi-agent systems, MCP architecture, beverage, truth/QA, design) plus live literature pointers. It does **not** invent restaurant formulas.

---

## Research grounding (labeled)

| Domain | Finding | Use in Never86 | Confidence |
|---|---|---|---|
| Labor ops | Real-time just-in-time schedules can cut server productivity ~4.4% (Kamalahmadi, Yu, Zhou — *Management Science*, DOI [10.1287/mnsc.2020.3877](https://doi.org/10.1287/mnsc.2020.3877)) | Labor specialist prefers schedule + hourly sales + clock before “cut labor” advice; Incomplete week stays Open | High (peer-reviewed) |
| Schedule stability | Unstable / inadequate hours hurt productivity; adequacy can move productivity ~10–29% (MIT thesis / retail field work — [hdl.handle.net/1721.1/129091](https://hdl.handle.net/1721.1/129091)) | Missing Evidence for incomplete schedule scope; never shame staff | High |
| Workload | Inverted-U workload vs sales effort in restaurants (SMU / Tan & Netessine line of work) | Demand–capacity match before blame; hours without sales ≠ theft | Med–high |
| Schedule fairness | Absolute + relative schedule quality affect retention (HBS working paper on frontline schedules) | Coach fairness as process, not people-as-thieves | Med |
| Multi-agent | Blackboard (shared state) > debate swarms for daily ops; human keeps `decide` verb | Sync `commandCenterSwarm` + `storeMemory` approve; no AutoGen debate | High |
| MCP | Specialists discover via tools/resources/prompts; math stays in one backend | `get_operator_system` → `list_specialists` → domain tool | High |

**Human factors (Endsley SA, System 1/2, calibrated trust):** 5:47am first viewport = one verdict + evidence status + one Action Shift + ask mouth. Missing Evidence = prep checklist energy, not shame. One coach voice; specialists backstage.

**Design:** Orange `#E66B27`, peach unlock, mint ready; tray action/food/labor/pop/beer/liquor; no dashboard chrome. Mobbin MCP was paywalled this run — design brief used product constraints + HF research instead.

---

## Seat map (max 12 — Operator Agent OS)

| # | Seat | One job |
|---|---|---|
| 1 | Store Chief of Staff | ≤3 actions; usually 1 |
| 2 | Source Collector | Intake + missing evidence |
| 3 | File Defender | Secrets / injection defense |
| 4 | Margin Analyst | Deterministic tools only |
| 5 | Operator Coach | One concept + one tribal Q |
| 6 | Proof Verifier | Night proof closes or Open |
| 7 | Memory Curator | Propose → human approve |
| 8 | Send Gate | Drafts only; never deliver |
| 9–11 | Labor / Beverage / Food specialists | Route to allowlisted tools |
| 12 | Human Approver | Not an LLM |

Domain packs for external LLMs: `labor`, `beverage`, `food-invoice`, `human-coach`, `design-qa`, `truth-qa` via `list_specialists`.

---

## Orchestration protocol

1. `get_operator_system`  
2. `list_agent_jobs` + `list_specialists`  
3. `prompts/get` → `specialist_brief`  
4. Source + file defense → blackboard  
5. One analysis tool per domain (no thrash)  
6. Truth-gate (POS≠payout, invoice≠COGS, no count→no food/bev cost)  
7. `build_action_shift` → ≤3  
8. Human approves memory/sends; proof later  

Blackboard pattern: agents write evidence states to shared receipt; humans alone decide irreversible acts ([agentic blackboard notes](https://fareedkhan-dev.github.io/all-agentic-architectures/architectures/07_blackboard/); HITL “decide” verb in modern blackboard systems).

---

## What we shipped in code

- Specialist packs + MCP `list_specialists`  
- MCP `resources/list|read` (`never86://specialist/{id}`, `never86://operator-system`)  
- MCP `prompts/list|get` (`specialist_brief`, `truth_gate_check`)  
- `analyze_beverage` wrapping existing `runBeverageCostScore`  
- Skill pack discovery path updated  

## Explicit non-goals

Mem0/Pinecone theater · mega-agent · AutoGen debate as daily runtime · Temporal for morning shift · auto-mail · portal logins · names as thieves · guaranteed recovery · Mobbin-dependent redesign this pass  

---

*Operator-turned-founder native AI. Built by an operator, for operators.*
