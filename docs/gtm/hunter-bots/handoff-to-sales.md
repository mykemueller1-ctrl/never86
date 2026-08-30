# Marketing → Sales handoff

When a hunted lead **responds**, **clicks /audit**, or **submits** — Sales Head owns the rest.

---

## Trigger → owner

| Event | Owner | Next action |
|---|---|---|
| Myke sent hunter reply | Marketing logs ledger | Wait |
| They reply "how?" / "link?" | Sales Reply Desk | Short answer + /audit |
| They hit /audit (UTM in ledger) | Sales Intake Router | Track source |
| Form / email with statement | Audit Evidence Gate | Evidence check |
| Statement audit ready | Audit Head → Receipt | Deliver receipt |
| They give permission to share | GTM Proof-to-Content | Draft posts |

---

## Handoff record (copy per lead)

```
HANDOFF — [date]
- source: reddit | facebook | x | tiktok
- utm_content: [id from utm-links.md]
- platform_url: [thread if safe]
- pain_tag: 3p_fees | payout | promos | marginedge | labor
- icp_score: [NN]
- hunter_reply_sent: Y/N [date]
- operator_response: [quote or "clicked audit"]
- status: replied | clicked | submitted | statement_received | audit_complete
- sales_owner: Reply Desk | Intake Router
- notes:
```

Save in: `docs/gtm/hunter-bots/lead-ledger.template.md` or spreadsheet.

---

## UTM → campaign source ID

Map `utm_content` to hunter row so Agent 8 (Measurement) learns:

| utm_content pattern | Meaning |
|---|---|
| `reddit_r/restaurantowners_20260825_1` | Reddit lead 1 that day |
| `facebook_romg_20260825_1` | Facebook ROMG |
| `x_hunter_20260825_1` | X reply |
| `tiktok_comment_20260825_1` | TikTok comment |

---

## Sales Reply Desk priority (after hunter)

Same as playbook Agent 7:

1. They said AUDIT or asked how
2. They shared a statement question
3. Consultant for client
4. Privacy
5. Ignore marketplace flame wars

---

## What Marketing stops doing

Once `status: submitted` — Marketing does not keep DMing. Sales + Audit own the loop.
