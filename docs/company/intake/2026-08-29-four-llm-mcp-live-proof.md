# Intake — four-LLM public MCP live proof

**When:** 2026-08-29 ~11:18 PM CT  
**From:** this HQ worker  
**Does not prove:** ChatGPT / Claude / Gemini / Grok marketplace install

## Production

- Site: `https://www.never86.ai`
- Deploy: Vercel Production SHA `115b7b6` (2026-08-30 02:10 UTC)
- Endpoint: `POST https://www.never86.ai/api/mcp`
- Server: `never86` **v3.1.0** · protocol `2025-03-26` · tools capability present

## Protocol (clean HTTP client, Accept `application/json, text/event-stream`)

| Call | HTTP | Result |
|---|---|---|
| `initialize` | 200 | serverInfo name `never86` version `3.1.0` |
| `tools/list` | 200 | **16** public tools |
| `tools/call` `get_operator_system` | 200 | identity + one-seat-free operating model |
| `tools/call` `get_hunter_standup` | 200 | hunter pack (draft replies only; humans send) |

## Tools live

`list_answers` `get_answer` `search_answers` `list_free_agents` `get_agent` `list_seats` `list_source_tags` `get_operator_system` `get_operator_logic` `get_3p_audit_logic` `calculate_3p_marketplace_cost` `build_action_shift` `build_vendor_silence_ticket` `get_hunter_standup` `get_company_org` `get_department_playbook`

## Still unverified (do not claim)

- `marketplacePublication: not-submitted` on all four shells
- `liveProviderInstall: unverified` — no ChatGPT/Claude/Gemini/Grok connector screenshot
- Credentials: none claimed (correct)

## Next human action

On each provider, add remote MCP `https://www.never86.ai/api/mcp` and screenshot `tools/list`. Then we flip only that provider’s install receipt.
