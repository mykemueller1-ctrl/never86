# Day-1 coach locks — Community Tap seat 1

**Surface:** `/operator` · Seat 1 · Community Tap  
**Auth:** existing email + store magic link (PR 222). Do not rebuild login.  
**Front screen:** Option C hybrid. Open ask + soft default physical artifact.

## Option C hybrid (do not miss)

First session is a stool, not a stack. Decade of POS / SaaS burn. Tasks off the plate. Not a tour.

1. Operator lands on `/operator`.
2. Open ask, floor voice: **How can we help you?**
3. Soft default under it: **Got a truck ticket or invoice? Snap it.** Liquor / distributor invoice, truck ticket, or a handwritten short.
4. They tap **Snap photo**. Camera opens. One paper lands.
5. That is the win. Stop. Home hero stays **How can we help you?** plus the Ready line. Do not jump to Food or auto-ask the week schedule. No module map. No KPI tiles. No order-guide ownership as the first aha.

Secondary choices stay floor nouns only. One pick → one action.

| Pick | Action |
|---|---|
| DoorDash statement | Snap the statement |
| Fee line | Ask the DoorDash take on the fee line |
| What's 86'd | Ask what's 86'd |

Do **not** default to “snap this week’s order guide.” Order guide is a later folder, not day-1 ownership.

## LOM

One screen. Ask → one action before dinner.

- Home is the open ask + soft default + Snap photo / Add file.
- Prime Cost Coach / “3 of 3 ready” stays off this screen (dashboard creep).
- Labor / food trays are progressive disclosure after the first snap.
- Bottom chrome is quiet adult ops (Desk / Food / Labor / Pop / Beer / Liquor). Hidden on the empty first screen. Never a consumer emoji bar.

## Folder coach (operator words)

Shown after the first snap — not as the first-screen sitemap.

| Folder | Chip | Ask |
|---|---|---|
| Invoice / truck | Invoice / truck | Got a truck ticket or invoice? Snap it. |
| Schedule | Week schedule | Can you snap this week’s schedule? We’ll see who’s posted in and out. Labor lives on that grid. |
| Labor cards | Labor cards | Got labor cards, or is it shift / role specific? Snap how this shop runs the seats. |
| Menu | Menu | Picture of the menu — top money plates first. Recipes suck; we figure the chaos. |

Attach path: existing `/api/upload` + folder hint. Photo uses `capture="environment"`. File picker is the stub that matches current seat uploads. Soft-default snap files to the invoice / truck folder (`invoice-truck` id). Legacy `order-guide` folder hints still land there. Copy says invoice / truck / short — not order-guide ownership.

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

No CO2 lecture. No invented dollar savings. No extra magic-link sends.

## Invoice identity

- Identity key = **invoice number** (normalized).
- Same vendor + same total twice = **red flag / review candidate**, not a proven duplicate.
- Helper: `src/lib/invoiceIdentity.ts`. Tagged on text/CSV/PDF invoice uploads only. Photos still win without OCR.

## Code map

| Lock | File |
|---|---|
| Open ask + soft default + floor picks | `src/lib/day1Coach.ts` |
| LOM UI | `src/components/FreeOperatorPhone.tsx` |
| Adult tray chrome | `src/lib/freeOperatorDemo.ts` · `src/app/globals.css` |
| Vendor cadence | `config/ctap-vendor-cadence.json` · `src/lib/vendorCadenceConfig.ts` |
| Dedup | `src/lib/invoiceIdentity.ts` |
| Ask copy | `src/lib/simpleOwnerDemo/compose.ts` |

## Voice

Prefer: invoice, truck, short, credit, DoorDash take, checkout, 86, food cost.

Ban: layer, spine, unlock, insight, orchestration, empower, leverage, holistic, flywheel, north star, ecosystem.

## Anti-patterns (cut)

Fee portals. Apps that own you. Multi-dashboard. Modules tour before papers-in. KPI tiles on day 1. Order-guide-as-first-aha. Toy emoji bottom nav.
