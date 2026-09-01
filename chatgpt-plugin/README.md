# Never86 ChatGPT Plugin UI v1

Native MCP Apps surface for the Never86 operator OS.

## Why this architecture

This plugin uses the `interactive-decoupled` pattern:

1. Read-only data tools return structured operator snapshots without UI.
2. `render_operator_console` attaches one versioned MCP Apps UI resource.
3. Once mounted, the widget calls read-only data tools directly through `tools/call` so changing views does not remount the card.
4. The widget can hand a selected finding back to the conversation with `ui/message`.

This follows the current OpenAI plugin guidance and the official `openai/openai-apps-sdk-examples` MCP Apps patterns.

The existing Never86 public web product can remain Next.js/React. This ChatGPT surface is intentionally a self-contained HTML app so the first plugin has no extra browser runtime, no external assets, and a narrow CSP.

## Product UX

The primary experience is not another dashboard. It is an inline operator card:

- Find the leak.
- Assign the fix.
- Keep the receipt.

The first screen is Action Shift: yesterday -> one action -> night proof.

The same mounted card supports four drill-ins:

- Action Shift
- Vendor Drift
- Item Trace
- Inventory Risk

Every view shows:

- a compact KPI strip
- one prioritized leak
- one next action
- required proof
- the evidence chain
- the signals/baseline that caused the flag

## Tool map

### Public product logic

- `get_operator_system`
- `get_operator_logic`

### Synthetic read-only previews

- `get_action_shift_preview`
- `get_vendor_drift_preview`
- `get_item_trace_preview`
- `get_inventory_risk_preview`

### Render tool

- `render_operator_console`

Only the render tool owns `_meta.ui.resourceUri`. The preview tools are reusable data tools.

## Data and security boundary

This repository is public. The v1 plugin therefore contains synthetic demo data only.

Do not add customer, employee, invoice, email, credential, PIN, or other private tenant data to this codebase.

Before any private tenant data is connected:

1. Prove which repository/deployment actually serves the production Never86 MCP endpoint.
2. Add OAuth/authentication for the plugin connection.
3. Resolve tenant/location server-side.
4. Enforce authorization on every tool request.
5. Connect an authenticated `OperatorDataProvider` to the canonical database.
6. Keep writes in separate tools with accurate annotations and confirmation behavior.

Never use model judgment, widget state, or a location name passed from the browser as authorization.

## Local development

Requirements: Node 18+.

```bash
cd chatgpt-plugin
npm install
npm run typecheck
npm run serve
```

The MCP endpoint will be:

```text
http://localhost:8787/mcp
```

Health check:

```text
http://localhost:8787/health
```

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest
```

Select Streamable HTTP and connect to `http://localhost:8787/mcp`.

Recommended checks:

1. Initialization succeeds.
2. All seven tools are listed with correct read-only annotations.
3. Each preview tool returns a valid `structuredContent.snapshot`.
4. `render_operator_console` renders the inline UI.
5. Tabs update the existing widget by calling the preview tools.
6. Ask ChatGPT posts the view-specific follow-up message.
7. Invalid render payloads fail schema validation.

## Connect to ChatGPT in developer mode

Expose the local MCP endpoint through a development HTTPS tunnel, then add the full HTTPS `/mcp` URL as a ChatGPT plugin connection in Developer mode.

Do not use a temporary tunnel for public submission.

## Production gate

This branch is a build candidate, not a production deployment.

Do not merge or point `www.never86.ai/api/mcp` at this server until the production git/deployment mapping is proven and tenant authentication is implemented.
