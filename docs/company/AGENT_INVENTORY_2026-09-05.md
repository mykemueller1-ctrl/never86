# Agent and automation inventory — 2026-09-05

**Repo scanned:** `mykemueller1-ctrl/never86` (this checkout) + read-only `mykemueller1-ctrl/grok-bot-restaurant-scout`.  
**Cursor cloud:** 148 accessible agents on never86, 1 RUNNING (this resume), 3 archived, 0 killed.  
**Human registry:** [`AGENT_REGISTRY.md`](AGENT_REGISTRY.md) · **Architecture:** [`ARCHITECTURE.md`](ARCHITECTURE.md)  
**Subscriptions this run:** none.  
**Private CTAP names, PINs, and dollars are omitted.**

Dispositions: **keep** · **kill** · **replace** · **archive** · **freeze**.  
Remote Cursor archive is a recommendation only. This PR does not kill live agents.

## Canonical v1 (keep)

| Name | Repo | Purpose | Status |
|---|---|---|---|
| Supervisor | never86 | Route one intent. No dollars. | drafted |
| Labor | never86 | Schedule vs clock. | drafted |
| Vendor | never86 | Invoice / silence / pour truth. | drafted |
| Voids | never86 | Peer-band void/comp pattern. | drafted |
| Action Shift | never86 | Yesterday → one action → proof. | drafted |
| Memory | never86 | Source-tagged forever, `operator_id`. | drafted |
| Public MCP `/api/mcp` | never86 | Read-only knowledge + analysis. | live |
| Free-agent CSV catalog | never86 | 10 `/agents` product hunters. | live |
| Company GTM org | never86 | Sales/GTM/social drafts. | live-in-git |
| Bamba Lane C swarm | never86 | Isolated 16-store desk. | live-in-git |
| GitHub CI + IndexNow | never86 | Verify + AEO ping. | live |
| Vercel `/api/briefing` cron | never86 | Daily briefing path. | configured |
| House-code `/portal` | never86 | Only orchestration seat door. `/communities` redirects here. | drafted-fail-closed |
| Email-first funnel | never86 | Homepage claims the free owner seat by email. | drafted |
| SimpleOwnerDemo | never86 | `/operator` posts to `/api/ask` and `/api/upload`. | merged-on-main `#205` |

## In-repo seats (replace / archive / kill)

| Name | Disposition | Note |
|---|---|---|
| Old 7 specialists (beverage, food-invoice, recipe-cost, human-coach, design-qa, truth-qa + overlapping labor) | replace | Now labor / vendor / voids / action-shift / memory. `design-qa` killed. |
| Old store team of 6 | replace | Supervisor + Action Shift + Memory absorb the jobs. Sample swarm runner kept. |
| `agents/*.md` four-tier manifests | archive | Moved to `archive/agents-v0/`. |
| `/communities` open-play lobby | replace | Redirects to `/portal`. |
| `/command-center/swarm` | archive | Redirects to `/action-shift/swarm`. |
| Overnight coordinator | kill | Handoff already obsolete. |
| Grok sales organization | kill | No SHA/PR. Do not relaunch. |
| Current system context | kill | Wrong repo. Already archived. |

## Cursor cloud (148)

All listed agents resolve to `github.com/mykemueller1-ctrl/never86`. None are on grok-bot-restaurant-scout.

| Bucket | Count / examples | Disposition |
|---|---|---|
| This resume | `Never86 · never86-rebuild-resume-v2` RUNNING (`bc-f77c70d0-…`) | keep (this job) |
| Prior rebuild writer | `Never86 · never86-orchestrator-rebuild-v1` IDLE (`bc-aa5eb7e0-…`) | archive — do not relaunch; this PR continues that work |
| Named factory writers | youtube-desk, command-center-swarm, four-llm-shells, monday-gate, ctap-manager-proof-ui, bamba-*, staff-desk, neon-persist, keys-access, … | archive (history; do not relaunch) |
| Privacy / leak workers | rebase-162, ctap-close-bundle-162 | kill / do not reopen |
| Idle browser / video / secret testers | ~100 internal one-offs (Vercel login, xAI 2FA, demo videos, click tests) | archive |
| Already archived | pr163-schedule-timeoff-repair, llm-shells-discovery-repair, Unclear task subject | keep archived |

Full name dump is in the cloud-agent list for this run (`bc-aa5eb7e0-…` is this worker). Do not paste secrets from those transcripts.

## Automations

| Automation | Schedule / trigger | Disposition |
|---|---|---|
| Cursor recipe 1 Sales Head morning intake | Daily 7:00 AM CT (doc only) | keep — company lane, approval inbox |
| Cursor recipe 2 Reply Desk X/LinkedIn | Daily (doc only) | keep — no auto-post |
| Cursor recipe 3 GTM weekly content | Monday 8:00 AM CT | keep |
| Cursor recipe 4 Measurement funnel | Friday 4:00 PM CT | keep — read-only |
| Cursor recipe 5 Outbound Lead | Wednesday | keep — Apollo mention is stale; Sentia+ is CRM |
| Cursor recipe 6 Audit Head | On demand | replace → supervisor routes to voids/vendor |
| Cursor recipe 7 Grok Shareable Scout | Monday 8:30 AM CT | keep |
| Cursor recipe 8 YouTube Channel Producer | Monday 9:00 AM CT | keep — no upload |
| Vercel cron `/api/briefing` | `0 11 * * *` | keep |
| Vercel cron `/api/cron/send-followups` | `0 14 * * *` | freeze — auto-send risk; not disabled here |
| GitHub CI | PR + selected branches | keep |
| GitHub IndexNow | workflow | keep |
| Grok Bot LinkedIn hourly | Active (handoff) | keep — draft/research; human publish |
| Grok Bot Facebook | Deferred by Myke | freeze |
| Grok Bot TikTok | Paused | freeze |
| Grok Bot X daily clip | Spec built, enablement unverified | keep as draft-only |
| This run’s Cursor subscriptions | none | — |

Live Cursor Automations dashboard IDs were not readable from this run (`get-automation` needs a UUID). Recipes above are the repo source of truth.

## External repos

| Repo | Purpose | Disposition |
|---|---|---|
| grok-bot-restaurant-scout | Love→buy scout, 238 pain-shopper agents, report-ops, 3 routines | **freeze** — do not import into never86 OS |
| Agent-ctap-marketing | Wrong-repo marketing | **kill** |
| restaurant-social-commerce-engine / never86-dip-day-agent / never86-action-shift-live | Adjacent experiments | freeze — do not start a fourth Never86 product repo |

Scout layout (read-only): `agent/restaurant-scout.json`, `agent/pain-shoppers/`, `agent/report-ops/`, `routines/*.json`, `mcp/`, `render.yaml`.

## Typed catalog

`src/lib/orchestration/inventory.ts` · `listInventory()`.
