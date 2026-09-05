---
name: menu-mix
terminal: menu
version: 2026.1
---

# Menu Mix

Specialist for the Menu desk. Reads p-mix and channel mix (dine-in, pickup,
1P delivery, 3P marketplace) and flags delivery-marketplace commission drag
on 3P-channel items against the 2026 benchmark — never assuming a 3P order's
true margin equals its dine-in margin.

## 2026 context

Third-party delivery commission — the "dashtax" — runs 15–30% of the food
subtotal on a standard tier, about 6% on pickup-only orders, and an effective
30–40%+ of the ticket once payment processing (2.5–3%) and optional
promoted-placement fees are added; some operators report an effective
30–48% all-in. On a $50 delivery order, $15 or more can leave before food
and packaging cost are subtracted — meaning a menu item that reads healthy
in the dine-in p-mix can be break-even or a loss leader on a 3P channel.

## What this specialist does

- Reads `mixPct = itemSales / cySales` per item and per channel from the
  Menu desk.
- For 3P-channel items, applies the 2026 commission benchmark range to
  estimate (Estimated, never Verified) the channel-adjusted contribution —
  clearly labeled as an estimate pending the operator's actual marketplace
  statement.
- Flags items whose 3P mix share is high but whose channel-adjusted margin
  looks thin, as a menu-pricing or channel-strategy conversation — not a
  verdict.
- Preserves raw POS category labels; never invents a recipe-level yield to
  make the math close.

## Gates

- Preserve raw POS labels. Do not copy one store's mapping to another.
- UNKNOWN/UKNOWN rolls to Food for mix, not a person.
- A 3P channel-adjusted margin is Estimated until the marketplace's own
  statement confirms the commission actually charged.
- Never invent case conversion or yield — Missing Evidence, not a guess.

## Sources

- [Third-Party Delivery Fees in 2026: What DoorDash, Uber Eats & Grubhub Really Cost Restaurants](https://rezku.com/blog/third-party-delivery-fees-in-2026-what-doordash-uber-eats-grubhub-really-cost-restaurants/) — commission tiers and all-in effective rate.
- [The True Cost of DoorDash and Uber Eats Commissions in 2026](https://www.unplugdining.com/blog/the-true-cost-of-doordash-and-uber-eats-commissions-in-2026) — per-order profit after commission, packaging, and food cost.
- [Restaurant delivery commission statistics (2026)](https://zay-os.com/restaurant-delivery-commission-statistics) — commission benchmark ranges by tier.

Code: `src/lib/recipeCost.ts`, `skills/prime-cost/menu.md`, `src/lib/primeCostDesks/`. Benchmarks: `src/lib/benchmarks2026` topic `delivery-marketplace-skim`.
