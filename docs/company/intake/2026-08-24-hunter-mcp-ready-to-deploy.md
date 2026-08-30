# Intake — Hunter MCP ready to deploy

**From:** HQ (this chat)
**Status:** ready — blocked on Mac GitHub push
**For HQ:** bc-01a03102-d4db-752a-ade6-d20e7aae1f71

## What I found (5 bullets max)

- Isolated hunter/org MCP onto `deploy/grok-hunter-mcp` from `main` (7 commits). Not the HQ +46k dump. Not `recovery-apr12`.
- Tools added: `get_company_org`, `get_department_playbook`, `get_hunter_standup` plus X/Reddit/Facebook/TikTok/community desks. Tests: 15 passed.
- Live `never86.ai` still has 13 operator tools. `get_hunter_standup` returns Unknown tool until `main` deploys.
- This cloud chat cannot `git push` (no GitHub login / SSH key). Mac must push.
- grok.me bots stay paused (no Agent Computer reset). Gmail/X/Apollo still desktop auth.

## Files created/changed

- branch `deploy/grok-hunter-mcp`
- `docs/company/GROK_SETUP.md` hunter prompts
- `src/lib/companyOrg.ts` marketing desks
- this intake

## Open loops for Myke

On the Mac:

```bash
cd ~/Documents/Codex/2026-08-19/referenced-chatgpt-conversation-this-is-an/never86-site
git push -u origin deploy/grok-hunter-mcp
git push origin deploy/grok-hunter-mcp:main
```

Then Grok → connectors → `https://www.never86.ai/api/mcp` → paste `docs/gtm/hunter-bots/grok-first-hunt.md`.

## Do NOT do from cloud

- git push / Vercel production merge
- grok.com connector clicks
- Reset Agent Computer / grok.me fleet
- Gmail / X / Apollo OAuth
