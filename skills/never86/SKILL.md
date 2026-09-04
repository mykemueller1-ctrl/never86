---
name: never86-operator
description: Thin Never86'd operator skill. Call the public MCP. Do not fork restaurant math.
version: 1.0.0
metadata:
  providerNeutral: true
  mcp: https://www.never86.ai/api/mcp
  marketplacePublication: not-submitted
  liveProviderInstall: unverified
---

# Never86'd operator skill

This file is a thin pointer. The Never86 OAuth/MCP backend owns restaurant logic, tools, auth, tenant scope, side-effect gates, and audit.

1. Connect to `https://www.never86.ai/api/mcp`.
2. Call `get_operator_system` first, then `list_specialists` (one agent · one job).
3. For cost / pour / recipe / P&L: `get_operator_logic` domains `uom-cost`, `recipe-cost`, `forensic-pnl`, `beverage`, `vendor-drift`. Tools: `convert_uom`, `analyze_recipe_cost`, `analyze_beverage`.
4. Use only the public read-only tools listed by `tools/list` (knowledge + analysis). Optional: `prompts/get` → `specialist_brief`.
5. Do not reimplement Action Shift, 3P formulas, vendor silence, UoM, recipe cost, or evidence states in this skill.
6. Typed values stay Unverified. Missing Evidence is not $0. Do not invent pack size, pourSpec, yield, or facts.
7. A verbal yes does not close an action. Escalate overdue unverified manager-checklist steps to the manager seat as Missing Evidence — not theft.
8. Vendor/service copy is DRAFT-ONLY. Never send, post, refund, pay, or change mailbox state.
9. Keep one store's rules out of another tenant. Memory Curator writes only human-approved store rules.
10. Do not claim a marketplace listing, live provider install, or credentials that are unverified.

Canonical pack: `src/lib/llmShells/skillPack.ts`.
Cost / UoM brief: `docs/product/FORENSIC_COST_UOM.md`.
Install matrix: `docs/llm-shells/INSTALL.md` and `GET /api/llm-shells` (not a crawler/LLM index URL).
