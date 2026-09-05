# 2026 logic pack — specialist skills

Six specialists that sit on top of the prime-cost desks (`src/lib/primeCostDesks/`)
as a reasoning layer. Each reads one or more desks' own evidence-backed
numbers plus a 2026 operator-complaint benchmark from `src/lib/benchmarks2026/`
and proposes a flag — never a verdict, never an invented dollar. Registry:
`src/lib/logicPack2026/`.

| Specialist | Reads | First job |
|---|---|---|
| [labor-analyst.md](labor-analyst.md) | Labor | Labor % drift vs. the store's own trailing average, with 2026 turnover context |
| [vendor-scout.md](vendor-scout.md) | Food, Liquor, Beer, Inventory | Vendor directory + photo intake; POS/processing fee-drag flag |
| [void-tracker.md](void-tracker.md) | Sales | Void/comp/discount rate vs. the 2026 comp-void-abuse band |
| [cash-closeout.md](cash-closeout.md) | Sales (night close) | Till variance vs. the 2026 cash-variance band |
| [prime-cost-coach.md](prime-cost-coach.md) | Board (Food + Labor) | Synthesizes prime cost %, rolls specialist flags into ≤3 actions |
| [menu-mix.md](menu-mix.md) | Menu | Channel-adjusted margin flag for 3P/"dashtax"-exposed items |

## Rules every specialist follows

- Missing Evidence is not $0. A flag prompts a look; it is never a verdict.
- Benchmarks are reference ranges from public 2026 sources, not per-store
  targets — a store's own trailing numbers are always the baseline.
- No specialist writes production data or invents a dollar, a yield, or a
  pour spec. Draft-only, same as the prime-cost sub-agents.
- No real client name appears in any skill file or benchmark.

This directory is distinct from `skills/prime-cost/` (repo root), which holds
the 2025-era terminal skills for the prime-cost desks themselves. The 2026
logic pack sits one layer above those — it is the *reasoning* layer, not a
replacement for the desks' own MVP contracts.
