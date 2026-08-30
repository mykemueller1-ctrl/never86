# Shareable Grok Bot catalog — Never86 cut

**Researched:** 2026-08-30  
**Worker swarm:** `bc-16edf4c0` (bots.new / Grokyard), `bc-ed7a0a8a` (gbt.grok.me / Grokcamp), `bc-a564c62a` (grokbot.dev / ShareGrokBots / 86 hunt)

Adding a share link copies config, skills, and routines. It does **not** copy the creator's computer, logins, API keys, or chat history. Strip secrets before anyone publishes a Never86 bot.

## Catalog sizes

| Source | Count | Notes |
|---|---:|---|
| [bots.new/grok/shareable](https://bots.new/grok/shareable) | 157 | Live `x.ai/bot` links |
| [bots.new/grok/templates](https://bots.new/grok/templates) | 110 | Named roles (Marlowe, Atlas, …) until packed |
| [gbt.grok.me](https://gbt.grok.me) | 36 | Community “on the desk” list |
| [sharegrokbots.com](https://sharegrokbots.com) | 162 | Scored listings; no prompt text |
| [grokyard.com](https://www.grokyard.com) | 10 | Paywalled share links |
| [grokbots.space](https://grokbots.space) | 5 | Gallery: Cursor Event Planner, Presenter, Gymmie, Nova, Quill |
| [grokbot.dev templates](https://grokbot.dev/api/v1/templates.json) | 253 | JSON API + MCP |

## 86 / Never86 matches

**None.** No shareable bot name or description is Never86 or a branded 86 operator.

False positives: grokbot.dev `awesome_score: 86`; hospitality slang “86 a dish.” ShareGrokBots has a Restaurants waitlist and zero verified restaurant bots.

## Most useful for the Never86 operator system

| # | Name | Description | Why we keep it | Share |
|---|---|---|---|---|
| 1 | Master (Orchestrator) | Routes every task to a specialist and never does the work | Grok hub / one-owner routing | https://x.ai/bot/j7B5LHnEIPTuPQZxxQwpx |
| 2 | TheFounder | Holds the shared machine; loads after you tap send | Command center + send gate | https://x.ai/bot/Bt48h63v32_q_shWVlEBb |
| 3 | Alfred (Bot Chief Advisor) | Designs and restructures the bot roster | Swarm hygiene | https://x.ai/bot/KZ9xav0Qad1U5QigEn7rh |
| 4 | Projects Manager | Runs Grok bots as a project org | Product lane / claim a row | https://x.ai/bot/FU-Ev6_Ju4lFGWwWRD0GD |
| 5 | Chief (Router) | Assigns one owner per job, then stays out | Matches factory cap-1 | https://x.ai/bot/JugVUSPe_wSZg-in69owM |
| 6 | Invoice Hunter | Gmail invoice PDFs → monthly CSV | Vendor intake; invoice ≠ COGS | https://x.ai/bot/-kO6HrXokJZANVwUOMZO9 |
| 7 | Cursor Agent (Local) | Runs `cursor-agent` CLI on the shop floor | Local loop; cloud stays on the Never86 bridge | https://x.ai/bot/z4r7D8iILsTQDf7r7DwKR |
| 8 | Google Agent | Read-first Gmail / Drive / Calendar | Daily handoff calendar refresh | https://x.ai/bot/tttQVA2UtlNwCzITNCIr0 |
| 9 | Index (SEO/AEO Teammate) | Writes SEO/AEO briefs | Issue #122 drafts only | https://x.ai/bot/Viv2NbC5skPslV1WH9Fs7 |
| 10 | Lurk (Reddit Researcher) | Reddit quotes → pain pack | Hunter Scanner | https://x.ai/bot/12Gbp1lPVsfTVAHPXKd3B |
| 11 | Socials (Short-Form Scout) | Hourly filmable short-form kits | X clip factory input | https://x.ai/bot/bjsbaj_a2ds2pQY1YiXqE |
| 12 | Vet | Audits a bot before it touches the account | Add-to-desk gate | https://x.ai/bot/9Vmfeck_zr6jo9dO-xEBT |
| 13 | Grant (General Manager) | Trades back-office command center | Closest shop-desk pattern | https://x.ai/bot/fkM4b8n4RqZTbrq5fw5L_ |
| 14 | Agent Looper | Loops a coding agent until the test passes | Isolated Cursor jobs | https://x.ai/bot/AETdGbRRNWfckrRGv22LD |
| 15 | Spark (Onboarding) | Five-minute questionnaire → starter bots | Spawn only mapped seats | https://x.ai/bot/_2vi1lOY4oiBaJDA3S8l1 |

## Swarm / team / API / Cursor hits (recommended set)

| Tag | Bots |
|---|---|
| swarm | Master, Alfred, Chief, Spark |
| team | Master, TheFounder, Alfred, Projects Manager, Chief, Google Agent, Index, Lurk, Vet, Grant, Spark |
| api | TheFounder, Invoice Hunter, Cursor Agent, Google Agent, Vet, Agent Looper |
| orchestrator | Master |
| cursor | Cursor Agent (Local), Agent Looper |

## Also watched, not in the first harness

- **Kirk (Enterprise Crew)** — demo crew spawn  
- **Grok Bot Coach** — tune existing bots  
- **Box Inspector** — second share-link gate  
- **Thoth** — research archive  
- **Clark Kent** — daily shop diary  
- **Clip Bot / Shorty** — extra clip cutters  
- **Marlowe + Atlas** (bots.new templates) — fleet router + project tracker  
- Grokyard paid listings — skip until a free share URL exists  

Full recommended rows live in `config/grok-shareable-swarm.json`.
