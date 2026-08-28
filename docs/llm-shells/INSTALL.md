# Never86'd four-LLM thin shells

One provider-neutral skill pack. Four install wrappers. The public MCP backend owns the restaurant logic.

## Status (honest)

| Claim | State |
|---|---|
| Drafted in this git branch | yes |
| Submitted to GPT Store / Claude directory / Gemini gallery / Grok featured connectors | **no** |
| Live-verified as installed inside ChatGPT, Claude, Gemini, or Grok | **no — unverified** |
| Provider secrets or restaurant-tenant OAuth clients for these shells | **none claimed** |
| READ-ONLY certified in repo | yes (not live-verified on a provider UI) |
| DRAFT-ONLY certified in repo | yes (no live external writes) |
| Merged / production-deployed from this branch | no |

## Shared source

- Skill pack: `src/lib/llmShells/skillPack.ts` (`never86-operator-skill` v1.0.0)
- Tool contracts: `src/lib/mcpPublicContract.ts` (same list the MCP route serves)
- Thin Claude/Cursor skill file: `skills/never86/SKILL.md`
- Machine-readable matrix: `GET /api/llm-shells`
- Per-shell JSON: `GET /api/llm-shells/{chatgpt,claude,gemini,grok}`
- Human page: `/llm-shells`

## Public MCP

`https://www.never86.ai/api/mcp`

This is the existing public read-only Never86 MCP. It is not the private Grok→Cursor orchestrator (`/api/orchestrator/mcp`). Do not mix those.

## Install (human still does this)

1. **ChatGPT** — If the account has Connectors/MCP, add the URL above. Otherwise paste the shared skill instructions into a Custom GPT. Not listed in the GPT Store.
2. **Claude** — Add a remote MCP server named `never86-operator-system` at the same URL. Optional: load `skills/never86/SKILL.md`. Not a marketplace listing.
3. **Gemini** — Create a Gem with the shared instructions. Add remote MCP only if that client actually supports it. Do not re-declare restaurant math as Gemini functions. No Gem gallery ID is claimed.
4. **Grok** — Grok Connectors → New Connector → Custom → paste the MCP URL. This repo does not claim the connector is already installed on grok.com.

Every client should call `get_operator_system` first.

## Do not

- Fork Action Shift, 3P math, vendor silence, or tenant rules into a provider prompt
- Send mail, post, refund, pay, or write CRM from a shell
- Put Community Tap private numbers, PINs, or staff names in these files
- Claim Facebook, marketplace publication, or unverified credentials
