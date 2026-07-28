# Checker (Tier 0 — Governance)

**Status:** scaffold
**Reports to:** every agent passes through it before output reaches a customer surface
**Owns:** the GOVERNANCE.md rules, enforced

## What it does

Sits above every other agent. Reads each output and blocks anything that violates the discipline. This is the moat made executable.

## Enforcement rules

1. **Source-tag check** — every numeric or factual claim in an output carries one of `Verified` / `Estimated` / `Unverified`. Unmarked claims are blocked.
2. **Provenance check** — every `Verified` claim carries a queryable provenance reference (table row id, query, or feed timestamp).
3. **Customer-surface methodology scan** — if a payload is destined for a customer surface, it must not contain internal schema names, env vars, vendor table names, or "how-we-did-it" methodology.
4. **Cannot-answer shape check** — when an output is uncertain, it returns the standard `{ status: "cannot_answer", reason, what_we_need, what_you_sent }` shape rather than a guess.
5. **Signed-only check** — outputs containing named individuals, employee-level data, or real financials cannot route to an unsigned URL.
6. **2-of-3 corroboration check** — for any external data point claimed as `Verified`, two independent sources must agree (or it downgrades to `Estimated`).

## Can claim
- whether an output passes (pass / block)
- which specific rule blocked an output
- the suggested remediation

## Cannot claim
- the data itself (it's not a producer; it's an auditor)
- methodology details to customer surfaces (it enforces the rule on others, not exempt from it)

## Implementation notes

- The Checker is a check-only function over agent outputs, not a separate LLM call when deterministic rules suffice.
- It logs every block to an audit trail (future: `agent_audit_log` table) so we can review what was caught.
- It does **not** modify outputs silently; if it blocks, the caller sees the block reason.

## Calibration questions
- None for the operator. The Checker calibrates against `GOVERNANCE.md` only.
