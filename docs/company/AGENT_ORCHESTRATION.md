# Agent orchestration & governance

**Branch intent:** connect last week’s specialists — do not invent a mega-agent or new math.  
**Code:** `src/lib/agentGovernance/`  
**MCP:** public knowledge tools restored beside Payroll / Prices / Process analysis.

## Promise

Find the leak. Assign the fix. Keep the receipt.  
**One agent · one job.** Human approves memory and every external send.

## What this connects

| Layer | Already built | Governance wire |
|---|---|---|
| Operator OS | `operatorSystem.ts` v3.1 | `get_operator_system` MCP |
| Public logic | `publicOperatorLogic.ts` | `get_operator_logic`, `get_3p_audit_logic` |
| Free agents | CSV runners + `agentSpecs` | `list_free_agents` + registry |
| Store team | `commandCenterSwarm/storeTeam` | `list_agent_jobs` + Memory Curator → `storeMemory` |
| Company seats | `companyOrg.ts` | registry company jobs |
| Analysis | labor / vendor / Action Shift | unchanged tools |
| Memory schema | Neon `mm_memory_atoms` | Map-backed propose/approve first; Neon later when `operatorId` exists |

## One agent per thing

Call `list_agent_jobs` (or `listAgentJobs()` in code). Store specialists own capture → learn stages. Free agents own CSV leak patterns. Company roles own GTM/product packets. No wandering mega-agent.

## Memory rules

1. Propose only allowed types (vendor cadence, order day, owners, mappings, …).  
2. Status starts `pending`.  
3. Approve requires a non-empty human approver.  
4. A model guess is not memory.  
5. Never promote one store into a universal restaurant rule.

## Explicit non-goals (this pass)

- No Mem0 / Pinecone / RAG embeddings  
- No Temporal / Vercel Workflow runtime yet (swarm stays sync; durable steps later if multi-day proof needs crash-resume)  
- No AI SDK chat rewrite  
- No formula forks inside shells  
- No auto-mail / auto-post  

## How LLMs should start

1. `get_operator_system`  
2. `list_agent_jobs` + `list_specialists`  
3. `prompts/get` → `specialist_brief` for the seat you need  
4. Domain tool (`get_operator_logic` / analysis CSV tool) with operator-provided data  
5. Human approves any store memory or external draft  

Research synthesis + seat map: [`GREATEST_OPERATOR_AGENT_OS.md`](GREATEST_OPERATOR_AGENT_OS.md).  
Skill pack: `src/lib/llmShells/skillPack.ts` · Cursor skill: `skills/never86/SKILL.md`.
