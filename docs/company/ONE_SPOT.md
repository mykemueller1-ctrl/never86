# ONE SPOT — Grok is the command hub

**Chat:** [Cursor agents: You talk, I run](https://grok.com/project/d3f103b5-2add-4fc1-9cd7-aabbc6a3484f?chat=3f690a7c-b2e5-4101-be38-89cc8b5df3f6)
**Rule:** Myke talks only in this Grok chat for ordinary work. Grok holds context and delegates. Cursor builds, tests, and deploys code through isolated agents. Grok Bots run scheduled departments. Codex audits the whole chain and interrupts Myke only for material drift, failure, or a real decision. Myke never shuttles packets or full transcripts between tools.

---

## Say this in Grok

| Command | What HQ does |
|---|---|
| `do this` | Route the job to the correct Cursor agent or Grok Bot and return one evidence-backed result here. |
| `go store` | Call live MCP — Action Shift / operator system / morning close |
| `go 3p` | Call `calculate_3p_marketplace_cost` + audit logic (paste statement numbers) |
| `go hunter` | Run **your** hunter pack (repo) — score leads, draft ≤3 replies, Myke voice |
| `go social` | Run the full Grok Social Command — one board, platform-native drafts, approval packet |
| `go sales` | Sales Head — intake / reply desk drafts for approval |
| `go gtm` | GTM drafts from permissioned proof only |
| `go audit` | Evidence gate → receipt format |
| `standup` | Approval inbox for today |
| `check inbox` | Intake board + daily board |
| `tools` | List live MCP tools |
| `approve` / `no` | Gate sends |
| `stop pings` / `resume pings` | 30-min HQ loop |
| `close the day` | Evening wrap |

---

## What's already here

### A. Live Never86 MCP (`https://www.never86.ai/api/mcp` v3.0.0)
Grok and workers call these for the shared operating logic:

`get_operator_system` · `build_action_shift` · `calculate_3p_marketplace_cost` · `get_3p_audit_logic` · `get_operator_logic` · `build_vendor_silence_ticket` · `list_answers` · `search_answers` · `get_answer` · `list_free_agents` · `get_agent` · `list_seats` · `list_source_tags`

### B. Your company logic
Grok routes it; Cursor reads and maintains the canonical repository:

- `src/lib/hunterMcpPack.ts` + `docs/gtm/hunter-bots/`
- `src/lib/companyOrg.ts` + `docs/company/GROK_SETUP.md`
- `docs/company/GROK_SOCIAL_ORG_CHART.md` — one HQ, departments, social desks, release gate
- `docs/company/OPERATOR_VOICE.md` — Myke voice
- `.grok/skills/` — Head of Marketing + Founder CoS

### C. Grok Social Command (draft → you release)
Social Intelligence · Editorial · X/LinkedIn · TikTok/Reels/Shorts · Facebook · Reddit/forums · Repurposing · Publishing Queue · Performance. One Grok approval packet. **Never auto-post.**

### D. Second brain
`MYKE_MIND_DUMP` · `docs/company/brain/` · `intake/INBOX.md` · daily board

---

## Not wired yet (desktop once)

Myke authorized app/Chrome/desktop use for owned jobs on 28 Aug. Cloud agents still cannot take over local Chrome. Tell Myke the exact click.

| Need | Status (verified 28 Aug 8:35 PM CT on cloud worker `bc-9181f277`) |
|---|---|
| Gmail send | MCP `needsAuth` — Cursor desktop → Settings → MCP → Connect Gmail. Still draft-only until Myke approves the exact send. |
| X live search/post | MCP `needsAuth` — Connect X on desktop. Drafts only until approve. Apollo stays off. |
| Sentia+ CRM | Signed-in app; browser-controlled until Sentia exposes an MCP/API. No CRM write without exact approval. |
| Google Calendar | MCP `needsAuth` — Connect Google Calendar on desktop. |
| Google Drive | **Ready** on this cloud worker. HQ Drive doc ID was not found on the connected account. |
| `get_hunter_standup` on production | Commit ready — deploy without whole +46k dump |
| Grok → Cursor direct launch | Authenticated connector is live per `CHATGPT_HANDOFF.md`; this worker is not the dispatch bridge. Cap remains 1. |

Until X auth: hunter uses web search + your paste leads; drafts still land here.

---

## Hard stops

- Auto-send / auto-post / auto-DM
- Sebes without explicit yes
- CTAP private → company GTM
- Frontier Grok rewriting your operator voice
- Claiming an agent is running, pushed, merged, or deployed without visible evidence
