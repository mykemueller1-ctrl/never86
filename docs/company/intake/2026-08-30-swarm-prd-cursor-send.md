# Send packet — swarms, PRDs, Cursor chats

**When:** 2026-08-30 8:20 AM CT  
**Order:** Myke — push all agent swarms, PRDs, PRs, and Cursor chats ASAP  
**Rule:** facts/decisions only. No raw chat dumps. No store-private dollars. No secrets.

## Swarm PRs (sent / undrafted this morning)

| PR | Title | Branch | What it is |
|---|---|---|---|
| [#172](https://github.com/mykemueller1-ctrl/never86/pull/172) | Harness shareable Grok Bots into the Never86 operator swarm | `cursor/never86-grok-shareable-86-swarm-e264` | Grok Bot catalog, team, workflow, shareable swarm config |
| [#173](https://github.com/mykemueller1-ctrl/never86/pull/173) | Document xAI/Grok keys access + no-secret probe | `cursor/never86-keys-access-env-v1-5c5a` | Keys *access* docs + probe. **No live keys in git.** |
| [#174](https://github.com/mykemueller1-ctrl/never86/pull/174) | Command-center specialist swarm v1 (CSV-first, no send) | `cursor/never86-command-center-swarm-v1-9c7e` | 10-agent command-center swarm + sample CSVs + `/command-center/swarm` |

These were drafts. This packet marks them ready for review. **Not auto-merged.** `#162` / `#167` stay closed.

## PRDs / product contracts already in repo (`docs/product/`)

| File | Job |
|---|---|
| `LLM_FIRST_ONBOARDING_WIREFRAME.md` | LLM → DoorDash → free owner seat |
| `CTAP_ACTION_SHIFT_SCREENS.md` | Store Action Shift screens |
| `ACTION_SHIFT_WORKFORCE_FOUNDATION.md` | Workforce / checklists |
| `ONE_SEAT_CLAIM.md` | Email/Google → pending → Myke/Tom roster |
| `STAFF_SEAT_LOGIN_READINESS.md` | Fail-closed staff login |
| `STAFF_WORKER_HOME.md` | Worker home |
| `STAFF_SCHEDULE.md` | Schedule / time-off |
| `STAFF_ROLE_DAY_DESK.md` | Role-day desk |

Also on the swarm PRs: `docs/company/COMMAND_CENTER_SWARM.md`, `COMMAND_CENTER_NEXT_10_MOVES.md`, marketing research packet, `docs/COMMAND-CENTER-NEXT-10.md`.

Bolt concept PRD: `docs/company/intake/2026-08-30-never86-bolt-social-to-order.md` (this send). Concept only. Not live Shop checkout.

## Cursor chats we can prove (index, not transcripts)

Do **not** commit raw `.jsonl`. Handoff rule: no full AI conversations in git.

| Surface | Id / path | Topic |
|---|---|---|
| Grok HQ (master) | `3f690a7c-b2e5-4101-be38-89cc8b5df3f6` | Cursor agents: You talk, I run |
| This Cursor HQ | current cloud/desktop worker | #122 GTM, Esteban SENT, MCP v3.1.0, this send |
| Local transcript | `6b0bfcb6-ce4b-4913-a4a1-83974732a76c` | 24 Aug — Grok HQ down / keep HQ alive |
| Local transcript | `8bc56961-813c-483d-a5e0-71b1f695f6e8` | 24 Aug — where Grok bots actually work |
| Local transcript | `fbb07250-4bd1-41bd-a71f-5c44dac4facb` | 24 Aug — MCP connect test |
| Local transcript | `78250e95-7cab-41a2-ad0c-8ccd9210073c` | 26 Aug — Grok hub merge packet / #122 |
| Local transcript | `6ddbba64-126b-4906-83f5-b3ef751cd243` | 22 Aug — implementation from main |
| Cloud (stale) | `bc-01a03102-d4db-752a-ade6-d20e7aae1f71` | Grok sales organization — do not relaunch |
| Cloud (archived) | `bc-01a02cef-b406-736e-a0fe-f92c5383ceda` | Wrong Agent-ctap-marketing repo |

**Limit:** this machine cannot export every Cursor Cloud Agent chat. The five local transcripts + HQ + the swarm PRs are what we can send today. Codex/Claude/Downloads harvests already live in intake.

## Already on production (do not re-push)

`#155` four-LLM try doors · `#159` listing packet · `#160`/`#164`/`#165` staff desk · `#168` inbound mail · `#169`/`#170` hunter MCP · `#171` HQ board

## Not sent / not claimed

- Raw Cursor Cloud chat export (needs desktop Cursor / you)
- Four LLM *store* submissions
- Neon `0005` / staff login enable
- `#162`/`#167` (closed on purpose)
