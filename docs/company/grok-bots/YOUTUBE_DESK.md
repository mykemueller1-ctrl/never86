# YouTube desk — Never86 first-party Grok seats

**Task:** `youtube-desk-swarm-v1`  
**State:** drafted in Git. Not added to the live Grok Bot desk. Not published. Not uploaded.  
**Machine source:** `config/youtube-desk-swarm.json`  
**Shareable swarm pointer:** `config/grok-shareable-swarm.json` → `youtubeDesk`

This is a **first-party** desk. Do **not** install public grokbot.dev / bots.new / ShareGrokBots / Grokyard listings for these seats. Paste the recipes below into empty Grok Bot workspaces.

## Seat map

| Seat | Job | Sources | Queue | Stop |
|---|---|---|---|---|
| **YouTube Hunt** | Public operator-pain videos and comments | YouTube search + public comments only | Last **72 hours**, hunter **ICP score**, keep ≥60, max 3 drafts | Draft finds. No comment posted. |
| **Script Cutter** | 30–45s Shorts | Published [`/answers`](https://www.never86.ai/answers) **or** Owner-1 permissioned proof | One source → hook, beats, on-screen text, caption | Script only. No upload. |
| **Answer Film** | Talking-head | **Exactly one** `never86.ai/answers/{slug}` page | One page in, one film brief out | No private store footage. No upload. |
| **Channel Producer** | Weekly slate | Hunt + Cutter + Answer Film drafts | **3 videos**, caption, pinned **AUDIT**, UTM to `never86.ai/audit` | Approval card. Myke publishes. |
| **Owner-1** | Private-file door | CTAP / customer / employee / mailbox / Drive | Releases a public-safe excerpt when a YouTube seat needs permissioned proof | YouTube seats never open the private file. |

Owner-1 is Myke. It is the **only** private-file door. YouTube seats stay on public web, published answers, and Owner-1-released excerpts.

## Publish gate (drafts-only)

- Mode: **drafts-only**
- Auto-upload to YouTube: **no**
- Auto-post, auto-pin, auto-caption: **no**
- Approver: **Myke** on every exact asset (`social_post`)
- Public botdirectory install: **no**

Distinguish **drafted** (this pack) from staged, tested, committed, pushed, merged, deployed, and live-verified. Pasting a recipe into Grok Bot desktop is a human click, not a live-verified channel.

## xAI model API (optional)

Grok Bot desktop does **not** need a model key. If a later server-side worker must call completions:

- Secret env: `XAI_API_KEY` only — never Git, chat, or a shareable bot
- Base: `https://api.x.ai/v1`
- Model default: `grok-4.6` (`XAI_MODEL` may override; it is not a secret)

See [API_KEYS.md](API_KEYS.md) and `docs/company/KEYS_ACCESS.md`.

## Desktop paste (Grok Bot)

Create four **empty** first-party Grok Bots. Do not tap Add on a public `x.ai/bot` directory listing for this desk.

For each seat:

1. Grok Bot → New bot → name it exactly as the seat title.
2. Paste the recipe file in [templates/](templates/).
3. Plugins → custom connector `https://www.never86.ai/api/mcp`. Call `get_operator_system` first.
4. Do **not** paste `XAI_API_KEY`, `CURSOR_API_KEY`, or any customer file.
5. Leave Routines draft-only. No YouTube upload plugin. No auto-send.
6. Owner-1 stays on Myke's existing private workspace. Do not copy private files into these four bots.

| Seat | Paste recipe |
|---|---|
| YouTube Hunt | [templates/youtube-hunt.md](templates/youtube-hunt.md) |
| Script Cutter | [templates/youtube-script-cutter.md](templates/youtube-script-cutter.md) |
| Answer Film | [templates/youtube-answer-film.md](templates/youtube-answer-film.md) |
| Channel Producer | [templates/youtube-channel-producer.md](templates/youtube-channel-producer.md) |

Cursor factory recipe for the weekly slate: `docs/company/CURSOR_AUTOMATIONS.md` §8.

## MCP first calls

`get_operator_system` → `get_company_org` → `get_department_playbook` `dept_id: social`  
Hunt also calls `get_hunter_standup`. Script / film seats call `list_answers` (and `get_answer` for one slug).

## Hard stops

- POS ≠ payout. Invoice ≠ COGS. No count → no food cost.
- No Community Tap private numbers, PINs, or staff names.
- No portal logins. No names as thieves. No guaranteed recovery.
- LLM ranks. Human sends. Myke approves every YouTube publish.
