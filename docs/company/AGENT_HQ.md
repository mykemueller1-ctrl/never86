# Agent HQ — one brain, one Grok hub

**You are confused because too many chats are open.** This file fixes that.

**Command card:** [`ONE_SPOT.md`](ONE_SPOT.md) — Myke talks in Grok; Grok routes; Cursor and Grok Bots execute; Codex watches. Shared state: [`CHATGPT_HANDOFF.md`](intake/CHATGPT_HANDOFF.md).

**Code governance wire:** [`AGENT_ORCHESTRATION.md`](AGENT_ORCHESTRATION.md) · research synthesis [`GREATEST_OPERATOR_AGENT_OS.md`](GREATEST_OPERATOR_AGENT_OS.md) — one agent · one job; specialist MCP packs; store memory propose/approve.

**Permanent brief (locked 24 Aug 2026):** [`OPERATING_CONTEXT.md`](OPERATING_CONTEXT.md) — who we are, pricing scale play, 3P wedge, Store OS, HQ split, standing orders. **Do not invent, dilute, or soft-pedal.**


## The rule (memorize)

| Chat | What it is | What it can do |
|---|---|---|
| **Grok command hub** — [Cursor agents: You talk, I run](https://grok.com/project/d3f103b5-2add-4fc1-9cd7-aabbc6a3484f?chat=3f690a7c-b2e5-4101-be38-89cc8b5df3f6) | **Talk, context, routing, approvals** | Myke's one daily conversation |
| **Cursor factory** | **Code execution** | Reads code, launches agents, branches, tests, builds, and prepares deploys |
| **Grok Bots** | **Scheduled departments** | Operations, meeting prep, research, social drafts, evidence collection |
| **Codex watchtower** | **Orchestration and audit** | Verifies evidence, detects drift, commands corrections, alerts Myke only when material |

**You talk in Grok.** Grok delegates without making you copy the work into Cursor. You approve exact sends, posts, spending, production changes, and CRM writes.

---

## Where finished work lands

```
docs/company/intake/
  INBOX.md          ← live status board (read this when lost)
  YYYY-MM-DD-*.md   ← one file per finished helper
```

When ANY other agent finishes, it must write:

```markdown
# Intake — [job name]
**From:** [agent name / bcId]
**Status:** done
**For HQ:** [bc-01a03102-d4db-752a-ade6-d20e7aae1f71]

## What I found (5 bullets max)
## Files created/changed
## Open loops for Myke
## Do NOT do from cloud
```

Then update `INBOX.md` status line.

---

## Shareable Grok Bot swarm

Ranked public templates and Never86 seats: [`docs/company/grok-bots/`](grok-bots/README.md). No public bot is branded 86. Adding an `x.ai/bot` link to the live desk is a Myke click after Vet. Intake: [`intake/2026-08-30-grok-shareable-86-swarm.md`](intake/2026-08-30-grok-shareable-86-swarm.md).

---

## What the shared HQ owns

1. Myke founder dossier + operator voice
2. Company org + Grok hunter stack
3. Ops brain (`docs/company/brain/`)
4. 60–90 day mind dump consolidation
5. Routing: Sales / GTM / Marketing / Audit / Product

## Computer and apps (standing order 28 Aug 2026)

Myke authorized workers to use connected apps, Chrome, and desktop computer control for owned jobs, and to tell him the exact click.

| Surface | Who can use it | What Myke still does |
|---|---|---|
| Cursor cloud agent | Code, git, verified MCPs | Cannot drive local Chrome |
| Cursor desktop MCP Connect | After Myke clicks Connect | Gmail, Calendar, X OAuth |
| Grok Bot Agent Computer | Shared Linux Chrome/logins | Password / 2FA / CAPTCHA takeover |
| Sentia+ | Signed-in browser app | No CRM write without exact approval |

**Still forbidden:** agent-typed passwords/2FA/CAPTCHA; auto-send/post/DM; random account creation; Apollo; marketplace portal credentials; Facebook unless Myke asks.

Desktop agent reference: [Ocr evidence intake](https://cursor.com/agents/bc-6f799851-9167-489c-9fff-b564afe20561) (or whatever Composer tab is open on the Mac).

---

## Active helper jobs (auto-tracked)

| Job | bcId | Status |
|---|---|---|
| Harvest Claude 90d | `bc-7b161f26-1ad8-5e24-b3e0-d48c0340a72e` | RUNNING → drop intake when done |
| Harvest Codex/ChatGPT 90d | `bc-3d05da2a-c4d3-5c1b-8563-5e2555d519be` | RUNNING → drop intake when done |
| Harvest Desktop/Downloads 60d | `bc-a1e17d14-b214-557a-8b3d-4716bb3f2c16` | RUNNING → drop intake when done |
| Explore Myke docs | `bc-638908d2-a99f-511f-988f-9d16fc2e949e` | IDLE (already used) |
| Search Codex paths | `bc-6d091865-8ffc-5c78-a33c-7f22adef376f` | IDLE (already used) |

When all three harvests are DONE, HQ merges them into `docs/company/MYKE_MIND_DUMP_60_90_DAYS.md` + `docs/company/brain/`.

---

## Myke: when your head hurts

1. Open the Grok command-hub chat only
2. Say: **"check inbox"**
3. Grok reads the shared status and tells you what is done, waiting, or broken
4. Ignore every Cursor/Codex tab unless Grok or the watchtower identifies a real blocker
