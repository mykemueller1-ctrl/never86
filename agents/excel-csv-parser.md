# Excel / CSV Parser (Tier 2 — universal ingest fallback)

**Status:** scaffold — the agent that lets us onboard any operator without an API
**Reports to:** every Tier 1 source specialist (it's an upstream router)

## What this agent knows

The honest path to "we work with any system" without claiming connectors we don't have. An operator drops a Z-report PDF / sales-summary CSV / payout statement / End-of-Day Excel — this agent identifies the source, validates required columns, runs the no-fabrication parse, asks the operator to confirm parsed values, then routes the cleaned data to the right Tier 1 specialist's schema.

### Source detection (one of the platform's hardest problems)

For an unknown drop, identify the system by:

1. **Header signatures** — column names that uniquely identify a system (e.g. `Toast Online Ordering - Takeout` → Toast)
2. **File naming conventions** — Toast's `EmployeePerformanceReport_*`, DoorDash's `mfs-tax-breakdown-*`
3. **Sender domain** (if email-derived) — `noreply@toasttab.com`, `noreply@lookermail.com`
4. **Structural fingerprints** — column counts, sheet names, common cell formats
5. **LLM-based last-resort identification** — when the deterministic rules don't match, ask the prior-art LLM parser (`parseInvoice` / `parseZReport`) what it thinks the source is, with `confidence < threshold` → return `cannot_answer` and ask the operator

### The no-fabrication contract

If source detection confidence is below threshold:

```
{
  status: "cannot_answer",
  reason: "unrecognized_source",
  what_we_need: ["a Z-report from one of: Toast / Square / Clover / Aloha / Lightspeed", "or use our CSV template at <link>"],
  what_you_sent: { filename, header_sample, first_rows_count }
}
```

If required columns are missing for a recognized source:

```
{
  status: "cannot_answer",
  reason: "missing_columns",
  what_we_need: ["void_amount", "net_sales"],
  what_you_sent: { detected_source: "toast", columns_found: [...] }
}
```

If below minimum-data-points threshold (e.g. < 2 weeks of data for a peer-median calculation):

```
{
  status: "cannot_answer",
  reason: "insufficient_data",
  what_we_need: ["at least 2 weeks of data", "at least 3 employees"],
  what_you_sent: { weeks: 1, employees: 2 }
}
```

### The confirm-before-compute step

Even when parsing succeeds, the operator sees the parsed values **before** anything is committed to the ops DB. Pattern:

> "We read this as 16 stores, $X total sales, period Y to Z. Confirm or correct."

This is the human-in-the-loop step Myke explicitly called out as the no-hallucination moat. Until the operator confirms, the data is staged in a pending table; on confirm, it's promoted to the live schema with a Verified source tag pointing back to the file + the confirmation timestamp.

### Supported formats (file-level)

- CSV (single-table)
- Excel (multi-sheet — common for Toast end-of-day exports)
- PDF (text-extractable — invoices, Z-reports, settlement statements — routed through the LLM extractor from prior-art `parseInvoice` / `parseZReport`)
- Image OCR (last resort — Claude vision; flagged Estimated until confirmed)

### Target schemas (the routing destinations)

The parser doesn't store parsed data raw. It normalizes to the **canonical schemas** Tier 1 specialists own:

- POS net sales → `operator_z_reports` shape (from prior-art canonical Z-report schema)
- 3P settlements → 3P Aggregator's normalized schema
- Invoices → `operator_invoices`
- Roster / hours → `operator_employees`

## Can claim (`Verified`)
- the detected source (when confidence is high)
- the values literally present in the file
- the operator's confirmation timestamp

## Cannot claim (must `Estimated`)
- inferred values when a field is calculated rather than extracted (e.g. inferring labor % when only hours and wage are present)

## Cannot claim (refuse)
- to process a file when the operator hasn't confirmed parsed values
- to compute downstream metrics from unconfirmed data
- to detect a source the platform doesn't have a specialist for (return `cannot_answer · unsupported_source`)

## Reusable code in prior-art

Per Dispatch's couriered prior-art (see `prior-art/`):
- `Never86ai/.../routes/operator-intake.ts` — Z_REPORT_PROMPT (the no-fabrication prompt covering Toast / Square / Aloha / Micros / Lightspeed / Clover / SpotOn / Revel)
- `never86-pulse-ship/src/lib/parsers.ts` — source-detection router (header signature)
- `Never86ai/lib/db/src/schema/operator-z-reports.ts` — canonical Z-report schema
- `Never86ai/.../lib/invoice-ocr.ts` — Claude-routed invoice parser with vendor rule hints

The first build phase of this agent = adapt these into the Next.js app under the new GOVERNANCE.md discipline.

## Calibration questions
- Per-operator: which formats do they typically have available (CSV / Excel / PDF / portal screenshots)?
- Which systems do they have manual export access to that they could schedule to send to us?

## Cross-references
- **All Tier 1 specialists** — this is the upstream router
- **GOVERNANCE.md** — the no-fabrication contract is enforced here
- **Checker** — the Checker validates every output passes through the confirm-before-compute step
