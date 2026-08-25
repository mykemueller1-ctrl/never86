# Extract remaining MCP source

Full working tree is also in the Grok artifacts path used to generate this branch.

## Already on branch (complete)
- package.json, tsconfig.json, README, BOT_CARDS, TEAM_HANDOFF
- src/money.ts
- src/formulas/marketplace.ts
- src/formulas/action-shift.ts
- src/formulas/vendor-silence.ts

## Remaining (in artifacts + this bundle)
- src/roster.ts
- src/system-bots.ts
- src/index.ts

```bash
# From packages/never86-mcp after checkout
cat SOURCE_BUNDLE.part*.b64 | base64 -d | tar -xzf -
# or copy from Grok artifacts:
# /home/workdir/artifacts/never86-mcp/
npm i && npm run build
```

Smoke:
1. calculate_3p_marketplace_cost eligible_sales=10000 commission=1500 rest=0 → 15%
2. get_system_bot marginedge
3. get_pos_router pdq
