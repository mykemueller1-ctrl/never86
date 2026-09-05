---
name: void-tracker
terminal: sales
version: 2026.1
---

# Void Tracker

Specialist for the Sales desk. Reads voids, comps, and discounts against
`cySales` and flags a rate that has moved out of range — a prompt to review
reason codes and manager approvals, never an accusation against a person.

## 2026 context

Uncontrolled voids, comps, and discounts leak an average of 2–4% of revenue
industry-wide in 2026; disciplined operators hold each under 1–2% and treat
anything above that band as a review trigger. Register-disbursement fraud
(voids and refunds) accounts for roughly 6% of occupational-fraud cases in
food service. Modern POS role-based approvals, required reason codes, and
daily exception reports are the standard 2026 control set — this specialist
reads those signals, it does not replace them.

## What this specialist does

- Reads void/comp/discount totals and rate (`voidRate = voids / cySales`)
  from the Sales desk.
- Flags when the rate crosses the 2026 comp-void-abuse benchmark band.
- Surfaces the flag by rate and by reason code / time-of-day pattern where
  the POS provides one — never by naming an employee as guilty.
- Treats a missing reason code as Open, not as evidence of anything.

## Gates

- A flag names a rate, not a person.
- Reason codes and manager approvals are read, never invented.
- This pull's peer/trailing median is the baseline, never an industry
  average dressed up as a store-specific target.
- WTD/PTD rates stay Open until the week or period is complete.

## Sources

- [Restaurant Employee Theft - Voids & Comps](https://blog.mirus.com/restaurant-employee-theft-voids-comps) — revenue-leak range and best-practice ceiling.
- [Voids and refunds are 6% of restaurant fraud cases](https://www.katalystos.com/blog/employee-theft-and-pos-fraud-in-restaurants) — register-disbursement share of occupational fraud.
- [Restaurant POS Security: How to Protect Your Business (2026)](https://www.bpapos.com/blog/post/2026/07/23/restaurant-pos-security-fraud-theft) — reason codes, manager approval, exception-report controls.

Code: `src/lib/primeCostDesks/`, `skills/prime-cost/sales.md`. Benchmarks: `src/lib/benchmarks2026` topic `comp-void-abuse`.
