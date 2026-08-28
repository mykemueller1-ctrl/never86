# 1-click store listing

Operators want: search Never86'd inside ChatGPT or Claude, click Install.
That is a directory listing. Paste still works today. Do not claim listed until Published.

## Status

| Directory | Path | Status |
|---|---|---|
| ChatGPT Plugin Directory | https://platform.openai.com/plugins → Create → With MCP | **not submitted** |
| Claude Connectors Directory | https://claude.ai/admin-settings/directory/submissions/new | **not submitted** · needs Team/Enterprise |
| Grok featured catalog | none | no public submit form |
| Gemini consumer connectors | none | partnership-only |

## Paste fields

- Name: Never86'd Operator Intelligence
- MCP: https://www.never86.ai/api/mcp
- Auth: none (public read-only)
- Website: https://www.never86.ai
- Privacy: https://www.never86.ai/privacy
- Terms: https://www.never86.ai/terms
- Support: https://www.never86.ai/press
- Logo: https://www.never86.ai/brand/n86-mark.svg (export PNG if the form rejects SVG)

## Who clicks Submit

A human on the Never 86'd Inc. OpenAI org with Apps Management write + verified identity.
Claude needs a Team or Enterprise org. Grok/Gemini have no form.

## After submit

Review is a queue. Flip `STORE_DIRECTORY_STATUS` in `src/lib/llmShells/storeListing.ts` only when the directory shows Published.
