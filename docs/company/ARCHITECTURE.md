# Never86 architecture — rebuild v2

**Status:** drafted · tested in this PR · not merged · not deployed · not live-verified  
**Resumes:** idle PR `#208` orchestration v1, plus email-first, portal lock, Void Hunter blue.  
**Registry:** [`AGENT_REGISTRY.md`](AGENT_REGISTRY.md)

## One picture

```
email  /onboard  ──►  free owner seat (magic link)
                     │
house  /portal  ──►  operator_id   (only orchestration seat)
                     │
                Supervisor
                     │
      labor | vendor | voids | action-shift | memory
                     │
              live MCP math
        https://www.never86.ai/api/mcp
```

Homepage is the operator OS. Email is the stranger funnel. The CTAP house-code portal is the only seat door. 3P `/audit` stays the Google door, not the company.

## Locked product rules

1. **One location + one seat is free.** Extra seats/locations paid.
2. **POS ≠ payout. Invoice ≠ COGS. No count → no food cost.** Incomplete week stays Open.
3. **LLM ranks. Human sends.** No auto-mail. No auto-post. No marketplace portal passwords.
4. **No names as thieves.** Void Hunter flags a pattern, not a verdict.
5. **One action per screen.** House code. Or email. Not six doors.
6. **Void Hunter is blue `#0066ff`.** No orange/gold on that surface.
7. **SimpleOwnerDemo is real.** `/operator` posts to `/api/ask` and `/api/upload` (merged `#205`).
8. **Tenant key is `operator_id`.** Memory is source-tagged and never deleted.

## Layers

| Layer | What it is | What it is not |
|---|---|---|
| Public site | Email-first home, `/audit`, `/trial`, `/onboard` | Open-play front door |
| Seat door | `/portal` house code, hashed, fail-closed | `/communities` lobby, staff login, play |
| Owner desk | SimpleOwnerDemo ask/upload | Sandbox chat that invents dollars |
| Orchestration | Supervisor + five specialists | Mega-agent, 147 Cursor one-offs |
| Math | Public MCP tools already live | Formula forks inside LLM shells |
| Lake | Map-backed now; `sql/0008` draft | Applied Neon migration |
| Company lane | GTM/social draft recipes | Operator seats |

## UI contract

Calm. One primary action. Receipt beside the move.

- Home: **Claim the free owner seat** → `/onboard`. Secondary: recorded demo.
- Portal: one house-code field. Then the desk.
- Login: one email field. Then the magic link.
- Void Hunter: peer-band table, blue flags, no gold heat.

`/play` and `/operator` remain as URLs so existing links do not 404. They are not the stranger door.

## Evidence states for this rebuild

| Claim | State |
|---|---|
| Drafted in git | yes |
| Tested | this PR |
| Committed / pushed | this branch |
| PR opened | this job |
| Merged | no |
| Deployed | no |
| Live-verified | no |
| Neon `0008` applied | **no** |
| House codes issued | **no** — fail-closed |

## Does not

Merge, deploy, apply SQL, send, publish, write CRM, spend, or archive live Cursor agents remotely.
