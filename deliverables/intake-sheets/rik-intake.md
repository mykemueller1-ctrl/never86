# Rik — N86 / Taco Bamba calibration intake

> **For Rik Reinhardt · Executive Director of Technology, Taco Bamba**
>
> We're building a specialist AI per system in your stack, calibrated to **your** team's actual workflows — not a generic restaurant platform. Twelve questions below. Answer in whatever depth + format works for you (bullets, voice memo, single-line replies). What you give us turns into a sharper tool *next* time you log into never86.ai, not next quarter.

## 1 — The leadership map (so each person's agent reports to the right lane)

We have the public-facing roster. Help us with what's not public:

1.1 — **Who's the CFO**, and how much of finance does IMC handle vs. internal?
1.2 — **Who owns supply chain / procurement** (Sysco / PFG / local produce decisions)?
1.3 — **Who owns HR / People** (hiring pipeline, retention, training hours)?
1.4 — **Who owns catering strategy** at the exec level? (Kimberly Taimanglo runs sales — who sets the playbook?)
1.5 — **Area directors for NC and TN** — are those seats filled yet, or are the stores reporting to a central VPO?

## 2 — End of Night Reports (the one we most need to know)

We saw the Shirlington EONR you forwarded. We want to ingest those nightly across all 16 stores.

2.1 — **What's the EONR built on?** Custom app? Google Form? Toast-integrated? Vendor (Jolt / Opsi / Crunchtime)?
2.2 — **Where do submitted EONRs live?** Inbox? A sheet? A DB behind a form? An export we could subscribe to?
2.3 — **What's the full field list per submission?** (We have: daily/weekly food cost, weekly total cost, weekly sales total, errors free-text, 3P complaints. What else?)
2.4 — **Per-store completion rate** — is every store submitting nightly, or do some stores miss?
2.5 — **Is the EONR reconciled to POS the next day**, or accepted as-reported?

## 3 — Systems access (read-only is enough)

For each, who do we ask, and what's the path?

3.1 — **Toast** — Toast IQ export bucket access is wired. Any per-store API credential gaps?
3.2 — **Thanx** — Charissa is point. Looker email delivery is working. Could we get read-only Thanx API access (cleaner than parsing emailed reports)?
3.3 — **Marqii** — Charissa is point. First reports start 6/1. API access, or scheduled CSV / email?
3.4 — **Looker** — Charissa's reports come through here. Is there a Looker workspace we could get read-only access to (vs. parsing the emails)?
3.5 — **DoorDash Merchant Portal** — who has access? Could we get read-only?
3.6 — **Uber Eats Manager** — same question.
3.7 — **GrubHub** — does TB use it at all today?

## 4 — The contract layer (where the leak actually lives)

4.1 — **Current DD commission tier per store** — 15 / 25 / 30? Marketing fee opt-in?
4.2 — **Current UE service fee** — Marketplace only or also Storefront?
4.3 — **Do you have current rate cards** we can compare against effective rates? (PDFs or screenshots are fine.)

## 5 — Scheduling / labor / payroll

5.1 — **What scheduling platform does TB use?** (7shifts / HotSchedules / Homebase / Toast Payroll / something else)
5.2 — **What payroll system?** (ADP / Gusto / Paychex / Toast Payroll)
5.3 — **Who owns the labor-vs-budget conversation** per store?

## 6 — Catering operations

6.1 — **What platform is catering booked through?** (ezCater, EZCater Direct, Tock, internal sales team, mix?)
6.2 — **How is catering revenue separated** from regular orders in your reporting today?
6.3 — **Who owns the catering pipeline** — Kimberly + a team? Solo? Charissa adjacent?

## 7 — The team-side internal calibration (Myke Mueller Logic asks)

7.1 — **What do you wish never86 did automatically** that you currently do by hand every week?
7.2 — **What's the one report Charissa, Pereira, or Chef Victor asks for the most** that lives in your head or in a spreadsheet today?
7.3 — **What's the one number you don't trust today** that you wish someone would just nail down for you?

---

**No deadline; whenever it's clean.** Your answers go into the platform's calibration layer (internal only — never shown to anyone else) and we tune each agent against them.

— Myke
