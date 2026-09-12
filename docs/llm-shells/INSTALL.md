# Never86'd AI connector paths

One provider-neutral skill pack. Five provider guidance shells. The public MCP backend owns the restaurant logic.

## Status (honest)

| Claim | State |
|---|---|
| ChatGPT Plugin Directory publication | **not submitted** |
| Claude marketplace / featured publication | **not claimed** |
| Grok featured or preconfigured catalog listing | **not claimed** |
| Consumer Gemini generic custom-MCP connector | **not claimed** |
| Public remote-MCP paths documented | **ChatGPT, Claude, Perplexity, Grok; Gemini via compatible API/model flow** |
| Live Never86'd connection tested in every provider/account/plan | **no — each account still needs verification** |
| Provider secrets or restaurant-tenant OAuth clients for this public MCP | **none claimed** |
| READ-ONLY certified in repo | **yes** |
| DRAFT-ONLY certified in repo | **yes — no live external writes** |

Directory publication is separate from custom remote-MCP availability. Do not claim a directory listing until the provider approves it.

## Shared source

- Skill pack: `src/lib/llmShells/skillPack.ts` (`never86-operator-skill` v1.0.0)
- Tool contracts: `src/lib/mcpPublicContract.ts`
- Thin skill file: `skills/never86/SKILL.md`
- Machine-readable matrix: `GET /api/llm-shells`
- Per-shell JSON: `GET /api/llm-shells/{chatgpt,claude,perplexity,grok,gemini}`
- Human page: `/llm-shells`
- Publisher packet: `/store-listing` (noindex)

## Public MCP

`https://www.never86.ai/api/mcp`

This is the public read-only Never86 MCP. It is not the authenticated tenant-private Never86'd Operator app and it is not the private orchestrator. Do not mix those surfaces.

## Provider paths

1. **ChatGPT** — Create a custom app from the remote MCP in ChatGPT Apps; enable Developer Mode when the plan/workspace requires it. Plugin Directory publication is a separate OpenAI review step.
2. **Claude** — Customize → Connectors → Add custom connector → enter the remote MCP URL. Workspace controls can apply on Team/Enterprise.
3. **Perplexity** — Account settings → Connectors → Custom connector → Remote → enter the public MCP URL. Use no application credentials for this public read-only connector.
4. **Grok** — `grok.com/connectors` → New Connector → Custom → enter the public MCP URL. Business/Enterprise may require admin provisioning. No featured-catalog listing is claimed.
5. **Gemini API** — Use a compatible Gemini API/model flow with remote MCP over Streamable HTTP. Configure the public endpoint with a server name that contains no hyphens. This is an API/developer path, not a consumer Gemini custom-connector claim.

Every compatible client should call `get_operator_system` first.

## Do not

- Fork Action Shift, 3P math, vendor silence, or tenant rules into a provider prompt
- Send mail, post, refund, pay, or write CRM from the public shell
- Put restaurant-private numbers, PINs, credentials, or staff identifiers in these files
- Claim marketplace/directory publication or provider credentials that have not been verified
- Describe the public connector as the authenticated Never86'd Operator app
