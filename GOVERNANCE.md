# GOVERNANCE

**The thesis.** Pure ML flags numbers in milliseconds. Only a 20-year operator's brain knows the question that actually matters behind any anomaly. Our job is to encode that brain into the platform **one rule at a time**, and to never call something settled when the operator-truth is still *"depends."* The platform doesn't replace the operator's brain — it scales it.

This file is the company's non-negotiable discipline. Every feature, every screen, every agent passes through it.

---

## The four non-negotiables

1. **Source-tag every figure.** Every number rendered to a user carries a tag — `Verified` (re-pullable primary source), `Estimated` (modeled / benchmark), or `Unverified` (scrape / stale / not-yet-wired). If we can't tag it, it doesn't ship.
2. **Real data only behind a signed gate.** `/command-center`, `/tools/*`, `/reports/*` are gated for signed operators viewing their own data. Cold / public traffic gets `/demo/*` with sample data. No named individual or real financial ever appears on an unsigned URL.
3. **Cannot-answer is a first-class return.** When the data isn't enough, the agent returns `"I don't know — here's what we'd need"`, not a guess. This shape is part of every output schema.
4. **Show the work, never the methodology.** On a customer screen, sources are described in user-language ("from your POS data") — never internal table names, API endpoints, view names, env vars, or how-we-did-it. The discipline is visible (tags, "flags patterns not verdicts", honest gap notes); the methodology stays in this repo.

## Provenance is queryable

Every figure on a screen must trace to a row, a query, or a feed. The `void_hunter_findings` table is the model: a number you see on `/command-center` maps to a row id. Same shape applies to every future agent.

## The data-source approval gate

Nothing external gets wired without Myke's explicit sign-off — even free sources. Each new source lands as a PR titled `data-source: <name>` with:
- what it returns
- cost (free / paid)
- refresh rate
- how it'll be source-tagged
- which existing sources it cross-checks against

The bar for `Verified`: either (a) a primary source we own and can re-pull, OR (b) **two independent sources agreeing**. A single external source = `Estimated` until corroborated.

## Myke Mueller Logic — the veto

Even if 3 sources agree, the operator's judgment overrides. The `myke-mueller-logic` agent (`agents/myke-mueller-logic.md`) holds the veto. Its rulings get encoded back into the platform over time. The platform learns from him; he doesn't learn from it.

## The signed-only rule

The **depth** of the platform — methodology, agent architecture, the discipline — is shown only to signed customers, never on a public URL. We demonstrate the discipline through its application (clean numbers, source tags, honest gaps); we don't broadcast the rules. The moat IS the discipline.

## The brand-burn rule

The single failure that ends the company is **a wrong number a customer can prove wrong**. Every guardrail in this file exists to prevent that. If a rule conflicts with speed, the rule wins.

---

*Operator-turned-founder native AI. Built by an operator, for operators.*
