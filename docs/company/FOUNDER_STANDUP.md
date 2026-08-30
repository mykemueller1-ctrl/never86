# Founder Standup — Managing the AI Org

Myke routes through **Founder Chief of Staff**. Department heads produce packets; you approve every external action.

Canonical org: `src/lib/companyOrg.ts` · MCP: `get_company_org`, `get_department_playbook`

---

## Daily (5 min)

**Head of Marketing packet (Grok — phone OK)**

- Hunter standup: platforms scanned, leads scored ≥ 60
- Up to 3 draft replies for approve Y/N
- Playbook: `docs/gtm/hunter-bots/grok-first-hunt.md`

**Sales Head packet**

- New intakes (Intake Router): name, marketplace, status
- Replies queued for approval (Reply Desk): draft + platform + priority
- Outbound drafts (Outbound Lead): podcast pitch, accountant request — if any

**Format — approval inbox**

```
{ dept: sales, role: reply-desk, action: social_reply, draft: "...", proof: "AUDIT comment on X", approve: Y/N }
```

---

## Weekly (20 min)

| Head | Packet |
|---|---|
| **GTM Head** | Content queue (Proof-to-Content), per-account distribution (Distribution Queue), funnel metrics (Measurement) |
| **Audit Head** | Audits completed, clean reconciliations vs variances, receipts awaiting permission |
| **Product Head** | Truth/QA blocks, builder ship candidates, research gaps |

### Agent 8 metrics (Measurement and Learning)

Judge the system by qualified operator behavior, not vanity views:

- Form submissions and statements received
- Audits completed; average time request → receipt
- Clean reconciliations vs unexplained variances
- Permissioned case studies
- Repeat audits
- Dollars identified, disputed, recovered, protected
- Paid conversions after proof

### Weekly learning questions

- Which hook produced the most qualified submissions?
- Which proof type produced the most statements?
- Which objection blocked conversion?
- Where did operators drop off?
- What is the next experiment?

---

## Escalation

**Truth/QA Critic** blocks any unsupported dollar claim before GTM publishes.

Flow: Audit Receipt → Truth/QA pass → Myke permission → Proof-to-Content → Myke approval → Distribution Queue

---

## Department heads

| Head | Owns |
|---|---|
| **Head of Marketing** | Hunter Scanner, ICP Scorer, Hook Drafter (Grok daily hunt) |
| Sales Head | Intake Router, Reply Desk, Outbound Lead |
| GTM Head | Proof-to-Content, Distribution Queue, Measurement |
| Audit Head | Evidence Gate, Marketplace Audit, Operator Receipt |
| Product Head | Product Researcher, Builder, Truth/QA Critic |

---

## Hard rules (all departments)

- No auto-send, auto-post, or auto-DM
- No marketplace portal credentials in any channel
- No restaurant-private store data in company GTM work
- No impersonation; no recovery promises without evidence
- Sell the first win — one audit, one leak, one next move
