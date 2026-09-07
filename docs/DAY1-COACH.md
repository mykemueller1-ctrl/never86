# Day-1 coach locks — Community Tap seat 1

**Surface:** `/operator` · Seat 1 · Community Tap  
**Auth:** existing email + store magic link (PR 222). Do not rebuild login.

## Review Fail (includes the 10-minute hook)

Fail the review if any of these break. Stream A locks live in `STREAM_A_LOCKS` (`src/lib/day1Coach.ts`).

1. **10-minute hook** — first win is one folder Ready from a photo. Prefer Order guide. No dashboard-first. No module tour.
2. **Silo names are optional cues only** — 7shifts / Toast may be named as “that print is fine.” Never86 does **not** replace them on day 1. No hardcoded vendor path.
3. **Order guide OCR is outside the POS** — paper / photo / MarginEdge-class print. Do **not** assume a native Toast order guide.
4. **Ask system-of-record** for schedule, labor cards, and menu: POS, app, Sheets, or paper. Never invent usage %.

## 10-minute hook (do not miss)

First session must feel human and quick. Not a SaaS tour.

1. Operator lands on `/operator`.
2. One ask is already filled: **snap this week’s order guide** — paper, a photo, or the print they hang (liquor / truck ticket counts).
3. They tap **Snap photo** (or a coach chip). Camera opens.
4. One paper lands. Chip flips Ready. Copy says **you’re winning**.
5. That is the win. Stop. No module map. No KPI tiles.

Prefer Order guide for the first photo. Schedule → Labor cards → Menu stay chips, not a walkthrough. After the first snap, those folders ask **where the paper lives** (POS, app, Sheets, paper).

## LOM

One screen. Ask → one action before dinner.

- Home is the ask + Snap photo / Add file.
- Prime Cost Coach / “3 of 3 ready” stays off this screen (dashboard creep).
- Labor / food trays are progressive disclosure after the first snap.

## Folder coach (operator words)

| Folder | Chip | Ask |
|---|---|---|
| Order guide | Snap the order guide | Snap this week’s order guide — paper, a photo, or the print you hang. Liquor / truck ticket counts. One photo and you’re winning. |
| Schedule | Snap the week schedule | Can you snap this week’s schedule? Where does that live — POS, an app, Sheets, or the paper on the wall? |
| Labor cards | Snap labor cards | Got labor cards, or is it shift / role specific? Snap how this shop runs the seats — POS, app, Sheets, or paper. |
| Menu | Snap the menu | Picture of the menu — top money plates first. Paper, POS print, Sheets, or the app — wherever it lives. |

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
| Hook + folder asks + Stream A locks | `src/lib/day1Coach.ts` |
| LOM UI | `src/components/FreeOperatorPhone.tsx` |
| Vendor cadence | `config/ctap-vendor-cadence.json` · `src/lib/vendorCadenceConfig.ts` |
| Dedup | `src/lib/invoiceIdentity.ts` |
| Ask copy | `src/lib/simpleOwnerDemo/compose.ts` |

## Anti-patterns (cut)

Fee portals. Apps that own you. Multi-dashboard. Modules tour before papers-in. KPI tiles on day 1. Native Toast order-guide scrape. “We replace 7shifts.” Invented “73% of Toast shops” usage. One hardcoded silo path.
