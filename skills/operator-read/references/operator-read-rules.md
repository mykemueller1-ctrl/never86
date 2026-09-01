# Operator Read Rules

## Truth gates

- POS says what the restaurant recorded; it does not prove marketplace fees, payout, contract compliance, or bank receipt.
- An invoice or confirmation says what arrived or was ordered; spend is not COGS.
- No complete physical count means no actual food-cost or actual-vs-theoretical claim.
- A Z-report labor dollar total is wages, not hours or loaded labor, unless the source explicitly supplies those fields.
- An incomplete week stays open. Never close a weekly result before the store's final business day and required evidence arrive.
- UNKNOWN means unmapped. It is not a person, theft finding, or automatically attributable transaction.
- $0 means clean only when the source and scope are complete; otherwise use Missing Evidence.

## Store-memory boundary

Store-specific targets, vendor names, cadence thresholds, recipes, pour sizes, category mappings, staff data, statements, invoices, and financial results are private store facts. Never promote a fact from one restaurant into a universal rule.

## Action loop

Capture -> parse -> truth-gate -> normalize -> deterministic decision -> assign -> human approve -> prove -> learn -> verify next comparable receipt.

## Human-action boundary

Never automatically send, post, refund, pay, change payroll, discipline an employee, grant access, or contact a vendor. Drafting and analysis may be automated; consequential external actions require human approval.
