# End of Night Reports (EONR) (Tier 1 — store-level closing form)

**Status:** scaffold — confirmed in the operator's stack (Rik forwarded a real Shirlington EONR submission on May 20)
**Owner contact at the operator:** Rik Reinhardt (Executive Director of Technology) — system owner
**Reports to:** Restaurant Accountant (Tier 2) + Customer Success Watcher (Tier 3)

## What this agent knows

The **End of Night Report** is the operator's internal store-level closing form — a structured submission a manager fills out at end-of-shift that consolidates ops data the POS doesn't natively roll up. Captured fields from the real submission Rik forwarded (Shirlington, May 20):

### Captured fields (Verified from email body)
- **Daily total food cost**
- **Weekly total food cost**
- **Weekly total cost**
- **Weekly Sales Total** (e.g. `$56,660.53`)
- **Errors** section (free-text)
- **3rd-party complaints** today (free-text)

### Inferred (need Rik confirmation)
- Per-shift labor hours / cover counts likely also captured
- Cash deposit / safe count reconciliation
- Waste / spoilage log
- Refund / void note section (would correlate with `void_hunter_findings`)
- Equipment issues / facility flags

### What this data unlocks
- **Closing food-cost % per store per week** (where Toast doesn't natively give us food cost without invoices)
- **Manager-reported leak signals** — managers see things the POS doesn't (the 3P complaint count is a real signal)
- **Daily cash-vs-POS variance** — the closing form is often where over/under shorts get logged

## Data sources required
- The **submission system** itself — is this a Google Form? a Toast-integrated form? a custom internal app? **Open question for Rik.**
- Per-store EONR exports (likely a daily email like the Shirlington one, or a DB table behind whatever system this is)

## Can claim (`Verified`)
- exact values the manager submitted (food cost, sales total, error log entries)
- per-store / per-day completion rate (did Shirlington submit yesterday?)
- per-store 3P complaint counts as reported by managers

## Cannot claim (must `Estimated`)
- "real" food cost when invoices haven't landed yet — managers report what they think; the agent should mark it `Estimated · manager-reported`
- inferred labor cost without the labor system as a cross-check

## Cannot claim (refuse)
- a manager's free-text "errors" interpreted as causal — surface verbatim, let the operator decide

## Calibration questions (for Rik intake — HIGH PRIORITY)
1. **What is the EONR built on?** (Google Form? Custom app? Toast Forms? Third-party like Jolt / Opsi / Crunchtime?) — drives every downstream design
2. Where do completed submissions live? (Inbox? Sheet? Database?)
3. What's the full field list per submission?
4. Per-store completion rate — is every store submitting nightly, or are there gaps?
5. Does the EONR get reconciled against POS the next day? (Or is it accepted as-reported?)

## Why this matters for the platform

EONR is the **bridge** between what the POS measures (sales, voids, discounts) and what an operator actually needs to manage (food cost %, manager-reported issues, daily reconciliation). It's the cheapest path to a real prime-cost calculation **before** we wire invoice ingestion. Once we know what's in it and how to read it, every store-level finding gets richer.

The "generic" form of this agent: a `store-closing-form` adapter that any operator can attach — the operator's EONR is v1, but the shape is universal.

## Cross-references
- **Toast** — sales / voids / discounts reconcile against EONR's reported sales total
- **Restaurant Accountant** — consumes EONR food-cost % when invoices aren't loaded
- **Void Hunter** — manager free-text "errors" sometimes explains a void spike caught in `void_hunter_findings`
- **Customer Success Watcher** — alerts if a store stops submitting nightly
