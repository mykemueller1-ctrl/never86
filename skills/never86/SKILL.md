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
2. Call `get_operator_system` first.
3. Use only the public read-only tools listed by `tools/list`.
4. Do not reimplement Action Shift, 3P formulas, vendor silence, or evidence states in this skill.
5. Typed values stay Unverified. Missing Evidence is not $0. Do not invent facts.
6. A verbal yes does not close an action. Escalate overdue unverified manager-checklist steps to the manager seat as Missing Evidence — not theft.
7. Vendor/service copy is DRAFT-ONLY. Never send, post, refund, pay, or change mailbox state.
8. Keep one store's rules out of another tenant.
9. Do not claim a marketplace listing, live provider install, or credentials that are unverified.

Canonical pack: `src/lib/llmShells/skillPack.ts`.
Install matrix: https://www.never86.ai/llm-shells
