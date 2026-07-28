# Looker (Tier 1 — BI middleware)

**Status:** scaffold — confirmed in the operator's stack as the **delivery layer** for Thanx (Charissa's Thanx reports arrive from `Looker <noreply@lookermail.com>`)
**Owner contact at the operator:** Charissa Costa
**Reports to:** Restaurant Accountant (Tier 2) + Customer Success Watcher (Tier 3)

## What this agent knows

Looker (Google Cloud's BI platform) acts as a **scheduled-delivery and report-querying layer** between operator data warehouses and the operator's inbox. For this operator specifically: Thanx data is queried through Looker explores and pushed to Charissa as recurring email reports. The agent owns:

### Looker primitives
- **Explore** — a queryable model over a data source (Thanx, in the operator's case)
- **Look** — a saved query (a chart / table built on an Explore)
- **Dashboard** — a set of Looks
- **Schedule** — recurring delivery of a Look or Dashboard to an inbox / Slack / SFTP (this is how Charissa gets her Thanx reports)
- **LookML** — the modeling layer that defines dimensions, measures, derived tables

### Delivery shapes (what we'd ingest)
- **Email HTML body** — what the operator currently uses (Charissa's inbox)
- **CSV attachment** — the underlying data for the report
- **PDF** — visual snapshot
- **Webhook / API delivery** — Looker can POST to an endpoint (most useful for us long-term)

### Gotchas
- Looker reports are **point-in-time**. A scheduled daily report at 8am is from yesterday's close; it does not reflect today's activity until tomorrow.
- **Caching layer** — Looker caches query results (PDT or in-database). A "stale" report can show stale data even if the underlying warehouse updated.
- **Field permissions** — Looker enforces row-level security at the model layer. Charissa's view may be filtered (e.g. only her digital-sales scope) — we have to know what she's seeing vs the full network.
- **Embed mechanics** — Looker dashboards can be embedded via signed URL; not relevant for our ingest path, but relevant if the operator wants to consume our reports inside their Looker.

## What we'd pull (per Charissa's Looker delivery)
- The **Thanx loyalty scheduled reports** (the actual content) — likely: signup counts, redemption rates, repeat-rate per store, tier movement, high-value "Ultra" membership
- The **delivery cadence** (daily? weekly?)
- The **report definitions** (which dimensions and measures Charissa pulls)

## Data sources required
- The **emailed reports** themselves (we already have Outlook access — we can read the Looker emails as they land)
- Ideally, **direct Looker API access** (read-only) so we don't depend on parsing HTML emails

## Can claim (`Verified`)
- the specific values Charissa sees on her reports, parroted back
- the report cadence and field definitions
- the data freshness window (yesterday vs older)

## Cannot claim (must `Estimated`)
- network-level loyalty trends if Charissa's view is filtered to digital-sales scope (we'd be extrapolating)

## Cannot claim (refuse)
- forward predictions of customer behavior (loyalty churn forecasting) without an explicit modeling layer + Myke approval

## Calibration questions (for Charissa / Rik intake)
1. What Looker delivery cadence does Charissa receive today? (daily / weekly / both)
2. Which Looks / Dashboards specifically? (titles in subject lines)
3. Is Charissa's Looker view filtered to her scope, or does she see the full network?
4. Is Looker connected only to Thanx, or also to Toast / DoorDash / Marqii?
5. Could we get read-only Looker API access (saves us parsing HTML)?

## Cross-references
- **Thanx** — the data source under Looker for the operator today
- **Marqii** — Charissa's Marqii reports are also delivered via Looker per Rik's note
- **Restaurant Accountant** — consumes the loyalty-economics view that comes through here
