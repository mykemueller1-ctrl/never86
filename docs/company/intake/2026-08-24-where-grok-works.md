# Intake — Where Grok bots actually work

**From:** HQ (this chat)
**Status:** done
**For HQ:** bc-01a03102-d4db-752a-ade6-d20e7aae1f71

## What I found (5 bullets max)

- Company Grok logic lives in this repo (`src/lib/companyOrg.ts`, `hunterMcpPack.ts`, `docs/gtm/hunter-bots/`, `.grok/skills/`). HQ already runs it. SuperGrok is optional, not HQ.
- Live MCP at never86.ai still has 13 operator tools only. `get_company_org`, `get_department_playbook`, `get_hunter_standup` exist in code, not production — that is why Grok.com hunter/sales routing fails.
- grok.me bots (`maple-prism-terra-island.grok.me`) remain hung. Myke already said no Reset Agent Computer / no Mac takeover. Leave paused.
- “Stay in the loop with SuperGrok” = same MCP brain. SuperGrok = store paste lane. This chat = company HQ. Do not bounce.

## Files created/changed

- this intake
- `INBOX.md` status row

## Open loops for Myke

- Say `go hunter` here for drafts. SuperGrok connector is optional after company MCP tools deploy from desktop.
- grok.me fleet stays paused unless Myke reverses the no-reset order.

## Do NOT do from cloud

- git push / Vercel production deploy
- grok.com connector clicks
- Reset Agent Computer / accessibility
