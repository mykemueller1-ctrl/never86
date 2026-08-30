# Command Center — Marketing & Market Research Packet (Sarvesh / Grok SEO Prompts)

**Source:** https://x.com/bloggersarvesh/status/2090071557590900974  
**Author:** Sarvesh Shrivastava (@bloggersarvesh) — local SEO / GBP specialist, Favikon #1 SEO.  
**Date captured:** 2026-08-30  
**Status:** Research + playbook. Adapt for Never 86'd Command Center. No external sends until Myke approves.

## Goal
Use these 20 Grok prompts as a **market-research and marketing-research engine** for Never 86'd (operator-facing brand) and the Command Center swarm. Goal: find the revenue gaps, competitor patterns, and content that actually moves local operators to try the free audit / Command tier.

**Hard rules**
- Brand name **Never 86'd** stays operator-facing only. Never leak into public marketing surfaces.
- All outputs land in `docs/company/` or Notion Operating Brain. No portal logins, no external posts, no sends without approval.
- Every recommendation must carry impact (high/medium/low) + time-to-result.
- Output competitor comparisons as spreadsheets (CSV) so the swarm can ingest them.

## Business context to load first (paste into Grok every session)
```
BUSINESS BASICS:
Business name: Never 86'd
Address: [Fort Dodge, Iowa]
Phone: [redacted]
Website: https://www.never86.ai
Google Business Profile: [GBP URL]
Years in business: [X]
Team size: small

SERVICES + MARKET:
Primary service: Restaurant margin intelligence / operator OS (DoorDash statement audits, voids, comps, vendor drift, labor)
Secondary services: Multi-unit command center, free leak audit, Charter Operator tier
Service areas: Iowa + multi-unit restaurant groups (US)
Target customer: Independent restaurant operators, 1–16 unit chef-led groups, PE-backed groups
Average job value: $199–$999/mo

SEO GOALS:
Top 5 keywords: restaurant margin leak, DoorDash statement audit, restaurant voids comps, operator OS, never 86'd
Keywords I currently rank for: [fill]
Keywords I should rank for but don't: [fill]

CURRENT STANDINGS:
Google reviews: [X] total, [X] star, [X] new/mo
GBP monthly views: [X]
Monthly website traffic: [X]
Current map pack status: [ranking for X, not for Y]
Biggest SEO problem: [one sentence]

COMPETITORS:
[competitor] - [GBP URL] - [website] - [why beating us]
[competitor] - [GBP URL] - [website] - [why beating us]
[competitor] - [GBP URL] - [website] - [why beating us]

WHAT I'VE ALREADY TRIED: [list]
HOW I WANT YOU TO WORK: Prioritize quick wins. Always state impact + time. Output spreadsheets. Never guess — say when unsure.
```

## The 20 Prompts (grouped)

### Part 1 — Google Business Profile (prompts 1–8)
1. **GBP category audit** — Map competitor primary/secondary categories vs Map Pack for 3 keywords. Spreadsheet. Prioritize missing categories.
2. **GBP attributes audit** — Extract attributes (veteran-owned, free estimates, 24/7, etc.). Table-stakes vs differentiation.
3. **Competitor review teardown** — Last 50 reviews each: velocity, services mentioned, neighborhoods, complaints, keyword phrases to train customers on.
4. **Review response strategy** — Response rate, templates (5★5 / 4★ / 3★ / 1-2★), keyword-rich replies.
5. **GBP posts strategy** — 8-week posting calendar, 2–3 posts/week, neighborhood-specific, image descriptions.
6. **Services section optimization** — Audit vs website, write 40–60 word descriptions with service + area + benefit.
7. **GBP description optimization** — 3 versions under 750 chars (keyword / conversion / trust).
8. **GBP photo audit** — Photo count, velocity, types, 8-week upload plan, naming + geotagging.

### Part 2 — Website (prompts 9–13)
9. **Keyword gap audit** — SEMrush Keyword Gap, filter 100–2,000 vol, local intent, KD<40. Opportunity score spreadsheet.
10. **Money page audit** — GSC last 3 months: page 2 goldmine (pos 4–15), high-impression/low-click, cannibalization. 30-day sprint.
11. **Service + city page builder** — Per-service-per-city pages with full SEO structure, internal links, citations.
12. **Google Search Console analysis** — 90-day export, page 2 keywords, 30-day optimization sprint with exact copy.
13. **Review sentiment analysis** — Top emotional words, outcomes, fears, money phrases. Rewrite GBP + homepage + review script.

### Part 3 — Backlinks + Authority (prompts 14–16)
14. **Competitor backlink audit** — Ahrefs, domains linking to all 3 competitors but not us. 90-day link plan + outreach emails.
15. **Local citation audit** — NAP consistency across 15+ directories. Fix list + monthly checklist.
16. **Local search intent mapping** — 4-stage buyer journey (problem-unaware → ready-to-hire). Prioritize Stage 4 keywords.

### Part 4 — Content + Tracking (prompts 17–20)
17. **Content gap analysis** — SEMrush Content Gap, 20 briefs (problem-awareness first).
18. **Entity optimisation** — Schema (LocalBusiness JSON-LD), Wikidata, knowledge panel, brand mentions.
19. **Competitor GBP posting pattern analysis** — Forensic post history, optimal cadence/format for our market.
20. **Monthly SEO performance report** — GSC + GBP + GA: only metrics that tie to calls/revenue.

## How the Command Center swarm uses this
- **Market Research worker** runs prompts 1, 3, 9, 13, 16, 17 on a weekly cadence against a fixed competitor set.
- **Content worker** turns outputs into GBP posts, service pages, and review templates (prompts 4, 5, 6, 7, 11).
- **Approval loop** — every external-facing artifact (post, page, outreach email) lands in the approval inbox. Zero sends until Myke signs.
- **Memory curator** stores the competitor spreadsheets + sentiment maps so later runs compound.
- **Daily morning routine** includes a one-line SEO/market-research delta.

## First 3 runs (this week)
1. Load business context + run prompt 1 (GBP category audit) + prompt 9 (keyword gap) on 3 competitors. Output CSVs to `docs/company/research/`.
2. Run prompt 13 (sentiment) + prompt 3 (review teardown). Feed into OPERATOR_VOICE.md.
3. Run prompt 16 (intent mapping) + prompt 20 (baseline report). Seed the monthly tracking.

## Success criteria
- 3 competitor CSVs ingested by the swarm within 7 days.
- At least 1 quick-win GBP category or attribute change identified and approved.
- Page-2 keyword list with exact title/H1/meta rewrites ready for approval.
- No external action taken without sign-off.

## Links
- Issue: https://github.com/mykemueller1-ctrl/never86/issues/176
- Next 10 Moves: docs/company/COMMAND_CENTER_NEXT_10_MOVES.md
- Operating Brain (Notion): Never86 Command Center — Next 10 Moves Packet
