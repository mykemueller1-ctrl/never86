# 100 Statement Audit — Agent Operating Playbook

## Mission

Turn one restaurant marketplace statement into a closed, evidence-backed acquisition loop:

**attention → audit request → statement received → audit completed → receipt delivered → permissioned proof → next post → repeat usage**

The campaign is not judged by impressions. It is judged by:

1. qualified operators who submit;
2. statements received;
3. audits completed;
4. dollars identified for review;
5. dollars actually disputed, recovered, or protected;
6. repeat operators;
7. paid conversions after proof.

## Non-negotiable rules

- Source records remain separate.
- Missing evidence never becomes a made-up answer.
- `Identified`, `disputed`, `reimbursed`, `recovered`, and `protected` are different states.
- Never accuse a marketplace of theft or fraud without direct evidence.
- Never publish restaurant names, statement details, or results without permission.
- A clean reconciliation is a successful audit.
- Use operator language. Lead with money and the next move, not AI architecture.

---

## Agent 1 — Intake Router

### Trigger

A form submission, email reply, comment `AUDIT`, or direct message requesting an audit.

### Required output

- operator name;
- restaurant/group;
- email;
- number of locations if known;
- marketplace;
- campaign source and content ID;
- status: `requested`, `statement_received`, `blocked`, or `ready_to_audit`.

### Response

Ask for one redacted statement. Tell the operator to keep dates, totals, fees, credits, adjustments, and payout details visible. Do not request portal credentials.

---

## Agent 2 — Evidence Gate

### Trigger

A marketplace file is received.

### Checks

1. Supported statement or export.
2. Restaurant/customer identifying data is acceptably redacted.
3. Marketplace and statement period are visible.
4. Sales, deductions, credits, adjustments, and payout totals are readable.
5. Duplicate file detection.

### Output states

- `statement_audit_ready`
- `needs_clearer_export`
- `unsupported_file`
- `duplicate`
- `blocked_missing_statement_totals`

Do not calculate through unreadable or missing fields.

---

## Agent 3 — Marketplace Audit

### Tool behavior

Use deterministic marketplace reconciliation tools. Preserve the source name, period, platform, location, and every supplied amount.

### Minimum output

- eligible sales;
- sales passed to restaurant;
- commission;
- merchant fees;
- restaurant-funded promotions;
- restaurant-funded ads;
- refunds/error charges;
- marketplace credits and reimbursements;
- expected payout;
- reported payout;
- bank deposit if supplied;
- all-in take rate;
- unexplained variance;
- evidence missing for a stronger conclusion;
- ranked next actions.

### Confidence labels

- `VERIFIED` — read directly from supplied evidence.
- `CALCULATED` — deterministic math from verified inputs.
- `MISSING` — evidence not supplied.

---

## Agent 4 — Operator Receipt

### Goal

Return a decision, not dashboard narration.

### Structure

1. **What happened** — one sentence.
2. **Money map** — the material dollars and percentages.
3. **Payout check** — expected, reported, deposited, and variance.
4. **What is proven** — verified and calculated findings.
5. **What is not proven** — missing evidence.
6. **Next move** — owner, deadline, and proof required.

### Trust line

When variance is zero, say: **“The statement math reconciles. The remaining opportunity is cost control, not a payout accusation.”**

---

## Agent 5 — Proof-to-Content

### Trigger

An audit is complete and the operator has explicitly permitted anonymized or named use.

### Produce

- one hard hook;
- one proof graphic brief;
- one LinkedIn post;
- one Facebook post;
- one 20–35 second TikTok script;
- one pinned comment;
- one CTA;
- one internal claim ledger entry.

### Hook priority

1. counterintuitive cost gap;
2. clean reconciliation that proves trust;
3. unusually high promotion/marketing spend;
4. repeat error/refund pattern;
5. payout variance that still needs explanation;
6. contract-rate discrepancy only when contract evidence exists.

Never use an illustrative number as customer proof.

---

## Agent 6 — Distribution Queue

### Account voices

- **Myke Mueller LinkedIn:** founder/operator authority, evidence, strong point of view.
- **Never 86'd Facebook/TikTok:** product proof, trust architecture, direct CTA.
- **515 On The Line TikTok:** operator attention, fast hook, cultural bluntness.
- **Community Tap Facebook/TikTok:** firsthand proof from using the system inside a real restaurant.

### Publishing rule

Each account receives unique opening language and framing. Do not paste the identical caption everywhere.

### CTA

- Clickable platforms: tracked `/audit` URL.
- TikTok: link in bio + comment `AUDIT`.
- Every platform: one conversion only.

---

## Agent 7 — Reply Desk

### Priority order

1. Operator says `AUDIT`.
2. Operator shares a statement or asks how.
3. Consultant/accountant asks about client use.
4. Privacy question.
5. Marketplace accusation or argument.
6. General engagement.

### Response objective

Move qualified operators to the audit page or email intake without starting a long sales conversation.

### Prohibited

- arguing with marketplace employees;
- promising a refund;
- quoting recovery percentages without evidence;
- requesting login credentials in social DMs;
- asking users to post confidential statements publicly.

---

## Agent 8 — Measurement and Learning

### Daily dashboard

- page views by UTM source/content;
- form submissions;
- conversion rate;
- statements received;
- audits completed;
- average time request → receipt;
- clean reconciliations;
- unexplained variances;
- permissioned case studies;
- repeat audits;
- dollars identified, disputed, recovered, protected;
- paid conversions.

### Weekly learning

For each account and content format, identify:

- hook that produced the most qualified submissions;
- proof type that produced the most statements;
- objection that blocked conversion;
- drop-off point;
- next experiment.

The system only learns from verified outcomes. A post with high views but no qualified operator behavior is not a win.
