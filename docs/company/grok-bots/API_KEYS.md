# API key and connector notes — Grok shareable swarm

**State:** notes drafted. No new secret was created, rotated, pasted, or stored in Git.

Shareable bots copy prompts and routines, not keys. Official rule: strip API keys, internal URLs, and customer data before sharing ([x.ai Create and manage Bots](https://docs.x.ai/grok-bot/bots)). All of Myke's Grok Bots share one cloud computer — that is not a security boundary between bots.

## Already live (do not re-issue)

| Connector | Where | Auth | Status |
|---|---|---|---|
| Never86 Operator System | `https://www.never86.ai/api/mcp` | Public read-only | live-verified |
| Never86 Cursor Factory | `https://www.never86.ai/api/orchestrator/mcp` | OAuth 2.1 / PKCE | live-verified in the Grok hub |

Cursor Factory env names (values stay in approved Vercel/secret storage):

- `NEVER86_ORCHESTRATOR_TOKEN`
- `NEVER86_OAUTH_CLIENT_ID`
- `NEVER86_OAUTH_CLIENT_SECRET`
- `CURSOR_API_KEY`
- `CURSOR_AUTONOMOUS_DISPATCH_ENABLED`
- `CURSOR_ALLOWED_STARTING_REFS`
- `CURSOR_MAX_ACTIVE_AGENTS`

Do not put any of those in a shareable bot, chat, PR, or this file's examples as real values.

## Drafted — human setup only

| Need | Env / click | Setup |
|---|---|---|
| Optional Grok model API (not Grok Bot) | `XAI_API_KEY` | xAI console → approved secret storage → `https://api.x.ai/v1`. Default model `grok-4.6` (`XAI_MODEL` override is public, not a secret). Grok Bot is a separate product. YouTube desk seats do not need this key unless a later server-side worker calls completions. |
| grokbot.dev discovery MCP | none | Grok Bot Plugins → `https://mcp.grokbot.dev/mcp`, credentials empty. Tools: `search_directory`, `whats_new`, `get_entry`, `list_collections`. Never auto-install. |
| Gmail / Calendar / X | Cursor desktop Connect | Myke clicks Connect. Cloud agents cannot finish OAuth. |
| Composio / Bland / Telnyx (only if a later job needs them) | vendor dashboard | Auth in the vendor UI. Never paste the key into bot chat. |

## Cursor / Never86 MCP in this repo

`.cursor/mcp.json` points at the public operator system only. grokbot.dev is optional on the Grok Bot desk, not required for Cursor cloud factory jobs.

## Forbidden

- Inventing or rotating credentials
- Putting a key in a shareable template
- Treating a third-party bot as authorized for production, CRM, or send
- Using Apollo
