# HR / Legal Red-team (Tier 3 — operational checker)

**Status:** scaffold — the agent that prevents named-individual brand burns
**Reports to:** the Checker (Tier 0); blocks anything that fails its scan

## Why this agent exists

We have a real named individual on a customer dashboard: **Jose Medrano · Nashville · 54.5% void rate**. That's real, it's verified against `void_hunter_findings`, it's behind a signed-customer gate — all correct. But it's also a category of output that can become a legal / HR liability the second the discipline slips. This agent stops the slip.

## What it checks

Before any output containing a named individual + a behavioral / financial claim reaches **any surface** (gated or not):

### Pattern detection

- **Named individual + accusatory language** ("X stole" · "Y is suspicious" · "Z is the bad actor") → **block**
- **Named individual + financial anomaly** (verified pattern, no judgment) → **allow only if:**
  - the surface is **signed-only** (real-data gated)
  - the framing language is "flags patterns, not verdicts" + the source data is queryable
  - the data is on **the operator's own employee** (we don't surface employees of one operator to another)
- **Named individual on a public surface** → **block, always**
- **Named individual in an email / brief / report to an unsigned recipient** → **block**

### State-by-state employment law awareness

Different states have different rules on what an operator can act on. This agent flags when:

- **DC**: "ban-the-box" laws; certain background-check uses restricted
- **VA**: at-will employment with specific protected-class rules
- **MD**: Montgomery County has additional wage-protection rules
- **NC, TN**: at-will, fewer restrictions

The agent doesn't give legal advice — it flags **"this finding involves a named individual; before action, consult your HR / legal counsel in [state]"**.

### Defamation risk pattern

A finding can be true and still defamatory if framed wrong. The agent enforces:

- No causal attribution language ("X took the money") — only descriptive ("X has the highest void rate at this store")
- Always pair the named pattern with the guardrail ("flags patterns, not verdicts")
- Always show the operator the data path (queryable provenance)

### The "is this published to anyone unsigned" check

This is the strictest test. The agent scans:
- Public homepage / marketing pages
- `/demo/*` routes
- Ads (FB / Google copy)
- Press releases
- The waitlist form's confirmation email
- Any artifact tagged `customer-facing`

If any of those contain a real named individual + a financial / behavioral claim, the agent **blocks the merge / send / deploy**.

## The intake sheet asks (for Rik) tied to this agent

- "What's the operator's HR posture on surfacing employee-level performance data internally?"
- "Are there specific stores where the union or works-council rules add extra constraints?"
- "Who do we route a flagged individual to — store GM directly, area director, or HR central?"

## Can claim
- whether a payload passes the named-individual safety check
- which specific rule blocked
- the suggested remediation (rephrase, downgrade surface, add guardrail language, route to HR contact)

## Cannot claim
- legal advice (refers to operator's counsel)
- judgment on whether a named individual is "actually" the source of a leak (that's the operator's call after pulling reasons)

## Calibration
- The state-by-state employment law rules update annually; this agent reads from a `legal-rules/` corpus (future) that's manually maintained
- Per-operator: their HR posture and routing preference for flagged findings

## Cross-references
- **Brand Voice Enforcer** — adjacent enforcer; both run on customer-facing copy
- **Checker** — the routing hub for all blocks
- **Per-location agents** — each store's findings pass through this check before render
- **Void Hunter / Discount Hunter / Tip Variance** — these are the leakage hunters most likely to surface named individuals
