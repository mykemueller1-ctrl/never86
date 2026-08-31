# Grok shareable swarm — workflows

Owner: Product Head → Grok Shareable Scout. Codex verifies claims. Myke adds bots to the live desk.

## Weekly shareable scout

**Schedule:** Monday 8:30 AM America/Chicago  
**Cursor automation:** `docs/company/CURSOR_AUTOMATIONS.md` §7  
**Also:** optional Grok Bot Routine on a research workspace — not the Facebook bot.

```
Call get_operator_system, then get_company_org.
Read config/grok-shareable-swarm.json and docs/company/grok-bots/SHAREABLE_CATALOG.md.

1. Pull https://grokbot.dev/api/v1/status.json then feed.json (or grokbot.dev MCP if connected).
2. Diff new templates against the recommended ids.
3. Flag any name/description containing 86, Never86, swarm, team, API, orchestrator, Cursor, invoice, restaurant, or operator.
4. Rank at most 5 adds. For each: name, description, share URL, mapped Never86 seat, secret-strip check.
5. Do not open Add to Grok Bot. Do not write CRM. Do not send.

Return one approval card: keep / inspect / ignore.
```

**Stop:** catalog unreachable, share URL missing, or a listing that looks like it embeds secrets.

## Add-to-desk gate

Use before any `x.ai/bot` add.

1. Human opens the preview.  
2. Confirm the copy is config-only (no keys, no CTAP, no customer files).  
3. Map to one seat in [TEAM.md](TEAM.md).  
4. After add: attach `https://www.never86.ai/api/mcp`. Call `get_operator_system` first.  
5. Leave Cursor Factory and xAI model keys in approved secret storage.

## Daily Myke loop (unchanged)

Myke talks in Grok. Grok routes. Cursor writes code on an isolated branch. Grok Bots run scheduled departments. Codex watches. Shareable templates feed those seats; they do not become a second command hub.

## YouTube desk (first-party)

**Schedule:** Hunt daily 8:00 AM America/Chicago. Channel Producer weekly Monday 9:00 AM America/Chicago.  
**Cursor automation:** `docs/company/CURSOR_AUTOMATIONS.md` §8  
**Config:** `config/youtube-desk-swarm.json`  
**Paste recipes:** [YOUTUBE_DESK.md](YOUTUBE_DESK.md)

```
Call get_operator_system, then get_company_org, then get_department_playbook social.

1. YouTube Hunt: public videos/comments, last 72 hours, hunter ICP, keep ≥60, max 3 drafts.
2. Script Cutter: 30–45s from a published /answers page or an Owner-1 permissioned excerpt.
3. Answer Film: talking-head from exactly one never86.ai/answers page.
4. Channel Producer: weekly 3-video slate, caption, pinned AUDIT, UTM to never86.ai/audit.

Do not upload to YouTube. Do not install a public botdirectory bot.
Do not open CTAP, customer, employee, mailbox, or Drive files — Owner-1 is the only private-file door.
Optional model API: XAI_API_KEY at https://api.x.ai/v1, default grok-4.6. Never paste the key.

Return one approval card. Myke approves every publish.
```

**Stop:** missing public source, unpublished private numbers, or any attempt to upload.

## Native Never86 template

Draft job for a first-party shareable bot: [templates/never86-operator-command.md](templates/never86-operator-command.md). Publishing that `x.ai/bot` link is a later human gate. YouTube seats use the first-party recipes under [templates/](templates/) and are not published to the public catalog from this job.
