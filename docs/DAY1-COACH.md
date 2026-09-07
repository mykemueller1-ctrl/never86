# Day-1 coach locks — Community Tap seat 1

**Surface:** `/operator` · Seat 1 · Community Tap  
**Auth:** existing email + store magic link (PR 222). Do not rebuild login.

## 10-minute hook (do not miss)

First session must feel human and quick. Not a SaaS tour.

1. Operator lands on `/operator`.
2. One ask is already filled: **snap this week’s order guide** (or the liquor / truck ticket).
3. They tap **Snap photo** (or a coach chip). Camera opens.
4. One paper lands. Chip flips Ready. Copy says **you’re winning**.
5. That is the win. Stop. No module map. No KPI tiles.

Prefer Order guide for the first photo. Schedule → Labor cards → Menu stay chips, not a walkthrough.

## LOM

One screen. Ask → one action before dinner.

- Home is the ask + Snap photo / Add file.
- Prime Cost Coach / “3 of 3 ready” stays off this screen (dashboard creep).
- Labor / food trays are progressive disclosure after the first snap.

## Folder coach (operator words)

| Folder | Chip | Ask |
|---|---|---|
| Order guide | Snap the order guide | Snap this week’s order guide — or the liquor / truck ticket. One photo and you’re winning. |
| Schedule | Snap the week schedule | Can you snap this week’s schedule? We’ll see who’s posted in and out. Labor lives on that grid. |
| Labor cards | Snap labor cards | Got labor cards, or is it shift / role specific? Snap how this shop runs the seats. |
| Menu | Snap the menu | Picture of the menu — top money plates first. Recipes suck; we figure the chaos. |

Attach path: existing `/api/upload` + folder hint. Photo uses `capture="environment"`. File picker is the stub that matches current seat uploads.

## Vendor babysit (not on the first screen)

Config: `config/ctap-vendor-cadence.json`. Operators can customize later.

Missing invoice = **forget to snap the ticket?** Never “you didn’t order.”

| Vendor | Rhythm | Capture | Missing nudge |
|---|---|---|---|
| Fort Dodge Distributing | Weekly Tue | Photo only | Usually Fort Dodge Tuesday — forget to snap the ticket? |
| Humes | Tue + Fri | Email preferred, photo backup | Email the invoice if it landed — or snap the ticket. |
| Confluence | ~weekly Mon/Tue/Fri varies | Photo; kegs; empties credits later | Snap the keg ticket so empties credits can match later. |
| Hy-Vee Wine | Weekly Mon (lab receive) | Email order + yellow slips + invoice glue | Snap the slip if the email is missing. |
| Pepsi | Every other week | Photo | Forget to snap the ticket? |
| Northern Lights | Frequent | Email + photo; multi-sender | Same invoice number is the same ticket — snap once. |
| Performance Foodservice | Tue + Fri trucks | Order email must match invoice | EFT 21-day is coach framing only — not a pay screen. |
| Sysco | Once weekly Tue or Fri | Photo | Usually Sysco Tue/Fri — forget to snap? |

Does **not** redesign vendor payment, Hy-Vee / beer / PFG / Sysco / NL / Pepsi / Confluence workflows, or staff lab cadence in `ctapLabPack`.

No CO2 lecture. No invented dollar savings.

## Invoice identity

- Identity key = **invoice number** (normalized).
- Same vendor + same total twice = **red flag / review candidate**, not a proven duplicate.
- Helper: `src/lib/invoiceIdentity.ts`. Tagged on text/CSV/PDF invoice uploads only. Photos still win without OCR.

## Code map

| Lock | File |
|---|---|
| Hook + folder asks | `src/lib/day1Coach.ts` |
| LOM UI | `src/components/FreeOperatorPhone.tsx` |
| Vendor cadence | `config/ctap-vendor-cadence.json` · `src/lib/vendorCadenceConfig.ts` |
| Dedup | `src/lib/invoiceIdentity.ts` |
| Ask copy | `src/lib/simpleOwnerDemo/compose.ts` |

## Anti-patterns (cut)

Fee portals. Apps that own you. Multi-dashboard. Modules tour before papers-in. KPI tiles on day 1.
