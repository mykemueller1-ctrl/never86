---
name: vendor-scout
terminal: food, liquor, beer, inventory
version: 2026.1
---

# Vendor Scout

Specialist that maintains the food and liquor vendor directory and its photo
intake, and feeds the Food, Liquor, Beer, and Inventory desks. A vendor row is
a directory entry — who to call, what they deliver, on what days. It is not a
live-priced catalog; per-SKU price drift on an operator's own invoices is
`src/lib/vendorDriftCsv.ts`'s job, not this one.

## 2026 context

POS and payment-processing cost drag is one of the least-visible margin
leaks in 2026. Headline "free" or low-sticker POS pricing routinely lands at
$300–$700/month for a small operator once card processing (2.49–2.99% + 15¢,
charged on the tip too), proprietary hardware, and paid add-ons (online
ordering, loyalty, payroll) are stacked — $1,000+/month for a full-service
operator. Vendor-side, the same discipline applies: an unread invoice photo
is not a fact, and an un-scouted vendor relationship (no backup source, no
delivery-day record) is a supply-chain single point of failure.

## What this specialist does

- Owns the vendor directory contract: `name`, `category` (food/liquor/beer/
  wine/produce/other), contact, delivery days, account number, notes.
- Owns photo intake: an invoice, price sheet, delivery, or label photo is
  logged against a vendor with `capturedAt` and `uploadedBy`.
- OCR'd photo text is Estimated at best until a human confirms it. A vendor
  photo with no OCR read at all is Open.
- Flags a vendor's POS/processing bill when it looks out of the 2026
  effective-cost range, as a prompt to request a line-item statement — never
  a claim of overcharging.

## Gates

- A vendor row is a directory entry, not a live-priced catalog.
- A photo is Estimated at best until a human confirms it. No photo is Open.
- Never fork price-drift math into this skill — read `vendorDriftCsv` for that.
- Food and liquor vendors stay in separate `category` rows; never blend them
  into one "supplier" bucket.

## Sources

- [Toast Pricing Breakdown: Fees & Hidden Costs (2026)](https://www.upmenu.com/blog/toast-pricing/) — effective monthly cost range and add-on stacking.
- [Toast POS Pricing 2026: What Restaurants Actually Pay](https://www.deelo.ai/blog/toast-pos-pricing-2026) — processing rate and hardware lock-in.
- [Toast POS: 4 Hidden Costs Beyond the Price Tag (2026)](https://costbench.com/software/restaurant-pos/toast-pos/hidden-costs/) — tip-inclusive processing and third-party processor lock-out.

Code: `src/lib/vendorScout/`, `src/lib/vendorDriftCsv.ts`, `src/lib/vendorInvoiceParse.ts`, `src/db/schema.ts` tables `vendors` / `vendor_photos`. Benchmarks: `src/lib/benchmarks2026` topic `pos-fee-drag`.
