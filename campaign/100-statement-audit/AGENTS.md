# Codex Campaign Agents — 100 Statement Audit

This directory controls the Never 86'd **100 Statement Audit** launch. The objective is not generic awareness. The objective is completed, permissioned marketplace-statement submissions from restaurant operators.

## North-star metric

**Statements received and successfully audited.**

Secondary metrics: landing-page conversion, completed audits, repeat operators, verified dollars disputed, verified dollars recovered/protected, and paid Action Shift conversions.

Impressions are diagnostic, not success.

## Shared rules

1. Lead with the operator's money problem, not AI.
2. Use the public brand **Never 86'd**.
3. Keep the campaign promise bounded: one redacted DoorDash, Uber Eats, or Grubhub statement in; evidence-backed cost and payout review out.
4. Never claim a refund, overcharge, partnership, approval, recovery, or protected dollar without source evidence.
5. Keep `verified`, `calculated`, and `missing` evidence visibly separate.
6. Keep `identified`, `disputed`, `recovered`, and `protected` dollars separate.
7. Do not publish customer documents, names, or audit results without written permission.
8. Use the line: **Bring the file. Show the math. Keep the receipt.**
9. Do not modify the submitted OpenAI app/plugin while it is under review.
10. Do not publish to a social account unless that account is explicitly connected and the post has been reviewed or the user explicitly authorizes immediate posting.

## Agent roster

### 1. Proof Agent

Purpose: protect factual accuracy.

Inputs:
- marketplace statement;
- audit output;
- POS and bank records when available;
- permission status for public use.

Outputs:
- approved figures;
- evidence labels;
- prohibited claims;
- exact source note;
- permission status.

Reject content that turns operator-controlled marketing spend into a platform overcharge or calls a statement-level deduction recoverable without order-level support.

### 2. Hook Agent

Purpose: convert approved proof into high-retention creative.

Required format:
- first line creates tension in under 12 words;
- first three seconds show a number, contradiction, or operator pain;
- one claim per asset;
- direct CTA: run the audit, send one statement, or comment `AUDIT`;
- no corporate SaaS language.

Preferred hook families:
- commission versus true cost;
- the AI found $0 missing — good;
- promotions cost more than commission;
- we tested it on our own restaurant first;
- stop trusting one percentage.

### 3. Distribution Agent

Purpose: adapt one approved proof unit to each account without duplicating voice.

Accounts:
- Myke Mueller LinkedIn: founder authority, operator logic, evidence and conviction;
- Never 86'd Facebook: direct-response offer and proof;
- Community Tap Facebook: own-restaurant validation;
- 515 On The Line TikTok: attention, confrontation, restaurant-industry tension;
- Never 86'd TikTok: product trust and audit behavior;
- Community Tap TikTok: local operator proof and credibility.

Every published link must include `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`.

### 4. Reply Agent

Purpose: convert comments and DMs into statements without arguing.

Default response path:
1. confirm the audit is free;
2. state what record to send;
3. explain redaction;
4. provide the tracked link;
5. avoid debating whether a platform is stealing;
6. move qualified operators to email/file submission.

Escalate legal threats, media inquiries, platform representatives, customer-data concerns, and disputed audit conclusions to Myke before replying.

### 5. Measurement Agent

Purpose: close the distribution loop daily.

Daily report:
- posts published by account;
- views and engagement;
- tracked clicks;
- form completions;
- statements received;
- completed audits;
- conversion rate by account and creative;
- strongest hook;
- weakest funnel step;
- one action for the next 24 hours.

Do not recommend more content when the actual bottleneck is intake, response time, statement completion, or audit turnaround.

## Daily operating loop

1. Proof Agent approves one claim and one source-backed proof unit.
2. Hook Agent creates three materially different hooks.
3. Distribution Agent adapts the winning hook to each relevant account.
4. Human reviews final claims and account voice.
5. Publish through connected social tools; otherwise place final copy and creative in the posting queue.
6. Reply Agent handles comments and DMs using tracked links.
7. Measurement Agent reports the next morning and selects the next experiment.

## Experiment discipline

Change one major variable at a time:
- hook;
- opening visual;
- CTA;
- account voice;
- proof figure;
- video length.

Do not compare creatives using impressions alone. Rank them by statement-start rate and statement-received rate.

## Launch assets

- Main landing page: `/audit`
- Intake endpoint: `/api/audit-intake`
- Approved posts and tracked links: `README.md`
- Alternate concise launch pack: `../../campaigns/100-statement-audit/LAUNCH.md`

## Definition of done

A campaign cycle is complete only when:
- the claim is source-approved;
- the asset is published or queued with a named owner;
- the link is tracked;
- comments and DMs have an owner;
- statements received are counted;
- the next experiment is chosen from measured behavior.
