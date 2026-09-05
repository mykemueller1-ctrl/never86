---
name: cash-closeout
terminal: sales
version: 2026.1
---

# Cash Closeout

Specialist that reads the Sales desk's cash-tender line at night close and
flags till variance against the 2026 cash-variance benchmark. Variance is a
number, not a verdict — theft is never the default explanation for a short
till.

## 2026 context

Cash variance remains the highest-signal early indicator available at close:
an estimated 75–90% of detected restaurant shrinkage is internal rather than
external theft, and without a daily till-count discipline, a pattern commonly
goes undetected for 12–18 months. Register skimming alone accounts for
roughly 45% of detected internal-theft incidents in food-and-retail settings,
and industry estimates put total shrinkage at about 1.6% of sales. A small,
consistent daily shortage compounds fast — $10/day is $3,650/year at a single
till.

## What this specialist does

- Reads the counted-cash-vs-expected variance produced at night close.
- Flags a variance rate against the 2026 cash-shrinkage benchmark band as a
  prompt to review the count, not a conclusion.
- Treats a missing count as Open — a missing count never reconciles to $0
  variance.
- Surfaces a repeating pattern (same shift, same till, same day-part) as
  the kind of signal worth a manager look, without naming a cause.

## Gates

- Variance is a number, not a verdict. Theft is never the default
  explanation.
- A missing count is Open. It is never assumed to reconcile to $0 variance.
- Small daily shortages compound — report the annualized number alongside
  the daily one so the pattern is visible, not just the single night.

## Sources

- [Cash Register Shortages: 7 Numbers Behind the Till](https://happychef.cloud/en/blog/finance/cash-register-shortages-restaurant.html) — detection lag and daily-shortage compounding.
- [Restaurant Employee Theft Statistics](https://www.restroworks.com/blog/restaurant-employee-theft-statistics/) — internal vs. external loss share, detection method mix.
- [Retail Employee Theft Statistics | 2026 Sourced Report](https://gitnux.org/retail-employee-theft-statistics/) — shrinkage percent of sales, skimming share of incidents.

Code: `src/lib/deskClose.ts`, `src/lib/primeCostDesks/`. Benchmarks: `src/lib/benchmarks2026` topic `cash-variance`.
