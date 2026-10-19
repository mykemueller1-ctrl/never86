# Stack map (public — no store PII)

Logic lives in the MCP, not in ten chats. **One door:** https://www.never86.ai

| What | Where |
|---|---|
| Operator OS + MCP | https://www.never86.ai/api/mcp |
| Public site + free seat | https://www.never86.ai |
| Alias hosts | `app.never86.app` → 308 to `.ai` (`docs/ONE-DOOR.md`) |
| This repo | `mykemueller1-ctrl/never86` |
| Product branch | **`main`** (not `recovery-apr12`) |
| GTM job | GitHub issue #122 · `docs/CURSOR-GTM.md` |
| Seat paths | `docs/GROK-ONE-SEAT.md` · `docs/ONE-DOOR.md` |

## Repos (do not spawn more)

- **never86** — this one. Live www.never86.ai Command/Audit/One Seat match **`main`**.
- never86-desk / never86x / never86-action-shift-live — historical or demo. Do not become a second free seat.
- never86d-beta-ctap — private shop beta. Not public marketing.
- ChatGPT Sites / `app.never86.app` — alias or archive. Operators onboard on `.ai` only.

## Grok vs Cursor

| | Grok | Cursor |
|---|---|---|
| Role | Phone hub, explain voice after formulas | Code, tests, PRs on **main** |
| Cannot | Start Cursor Cloud Agents by itself | Invent store math (call MCP) |
| Deploy | Does not own Vercel production | Confirm git SHA = www.never86.ai |

## Vercel

Production must be the project whose domains include `www.never86.ai`, deploying from **`main`**.  
Do not create a new Vercel project that forks the brand.
