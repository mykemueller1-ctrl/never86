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
2. Call `get_operator_system` first, then `list_specialists` (supervisor routes to labor, vendor, voids, action-shift, memory).
3. For cost / pour / recipe / P&L: `get_operator_logic` domains `pour-standards`, `fountain-bib`, `uom-cost`, `recipe-cost`, `forensic-pnl`, `beverage`, `vendor-drift`. Tools: `ask_pour_standards`, `declare_pour_standards`, `ask_fountain_standards`, `convert_uom`, `analyze_recipe_cost`, `analyze_beverage`.
4. Drink recipes: ask each unit house pour (1.5 / 1.75 / 2 / custom). Fountain gun (Pepsi BIB): ask syrup gal, invoice $, mix ratio, cup mark, liquid after ice — then `mode=fountain_spirit_drink`.
4. Use only the public read-only tools listed by `tools/list` (knowledge + analysis). Optional: `prompts/get` → `specialist_brief`.
5. Do not reimplement Action Shift, 3P formulas, vendor silence, UoM, recipe cost, or evidence states in this skill.
6. Typed values stay Unverified. Missing Evidence is not $0. Do not invent pack size, pourSpec, yield, or facts. **Ask each unit** their house pour (1.5 / 1.75 / 2 / custom) — never assume.
7. A verbal yes does not close an action. Escalate overdue unverified manager-checklist steps to the manager seat as Missing Evidence — not theft.
8. Vendor/service copy is DRAFT-ONLY. Never send, post, refund, pay, or change mailbox state.
9. Keep one store's rules out of another tenant. Memory writes only human-approved, source-tagged store rules. House-code `/portal` is the only seat door.
10. Do not claim a marketplace listing, live provider install, or credentials that are unverified.

Canonical pack: `src/lib/llmShells/skillPack.ts`.
Cost / UoM brief: `docs/product/FORENSIC_COST_UOM.md`.
Install matrix: `docs/llm-shells/INSTALL.md` and `GET /api/llm-shells` (not a crawler/LLM index URL).
