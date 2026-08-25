# Never86 Operator MCP v3.0.0

Deterministic restaurant math for Grok, Cursor, and Claude.
Prompts may differ. Formulas do not.

## What this is

One MCP server. Tools match Never86 Operator System v3:

- get_operator_system / get_operator_logic
- calculate_3p_marketplace_cost
- build_action_shift
- build_vendor_silence_ticket
- list_pos_bots / get_pos_router
- list_vendor_silos / get_vendor_silo
- list_system_bots / get_system_bot (MarginEdge, R365, MarketMan, etc.)

No portal logins. No auto-send. Typed dollars stay UNVERIFIED.

## Install

```bash
cd packages/never86-mcp
npm install
npm run build
```

## Cursor

```json
{
  "mcpServers": {
    "never86": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/packages/never86-mcp/dist/index.js"]
    }
  }
}
```

## Hard rules

- Money math is integer cents.
- Commission is not total marketplace cost.
- Action Shift never converts variance into theft.
- One bot per system — not a mega-bot.
- First 14 days of a new vendor baseline stay advisory.
