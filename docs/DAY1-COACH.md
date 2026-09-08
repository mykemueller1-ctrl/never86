# Day-1 coach locks — Community Tap seat 1

**Surface:** `/operator` · Seat 1 · Community Tap  
**Auth:** existing email + store magic link (PR 222). Do not rebuild login.  
**Front screen:** Conversation-first coach. Human open ask + floor-noun branches.

## Conversation first (do not miss)

First session is a stool, not a stack. Decade of POS / SaaS burn. Tasks off the plate. Not a tour.

1. Operator lands on `/operator`.
2. Open ask, floor voice: **What's the problem today?** Energy under it: **What's going on?** (also OK: **What got weird at the shop?**) Chat mouth keeps **How can we help you?**
3. After the open ask, voice onboard: **Trucks, order day, who yells, what sucks.** Then branch by what they say. Floor nouns, not a sitemap.
4. Invoice / truck is **one path after they choose it**. Never the stiff first CTA.
5. Snap photo exists when a path needs a photo. It is not the robotic soft default.

Fail this line as the hero subhead: **Got a truck ticket or invoice? Snap it.**

| Pick | Action |
|---|---|
| Bartender leak | Ask for the name. Drawer and Z stay on that seat. Do not name a thief from a guess. |
| Behind on books | 30-60-90 or a P&L surprise. Conversation. |
| Too many hats | That's why we're here. What's the one thing off the plate tonight. |
| Invoice / truck | Snap when they choose this path. |

Do **not** default to “snap this week’s order guide.” Internal plate id is `invoice-truck`. Leftover `order-guide` normalizes to it.

Quiet identity, not a SaaS tour: **built by Myke Mueller · Never86'd · operator first · was you**

Promise (not a tour): **Find the leak. Assign the fix. Keep the receipt.**

Seat grain: **one store, one login, yesterday's numbers, one move, one receipt**

After first choice, preview contract: **Check the evidence. Name the owner. Draft the fix. Proof step. Nothing sends without you.**

No rip: **We don't rip-and-replace — next action already in the data.** (after they pick a conversational path — not a first CTA)

## LOM

One screen. Ask → one action before dinner.

- Home is the open ask + branches + chat mouth.
- Snap photo / Add file appear when they pick invoice / truck or after the first paper lands.
- Prime Cost Coach / “3 of 3 ready” stays off this screen (dashboard creep).
- Labor / food trays are progressive disclosure after the first snap.
- Bottom chrome is quiet adult ops (Desk / Food / Labor / Pop / Beer / Liquor). Hidden on the empty first screen. Never a consumer emoji bar.

## Folder coach (operator words)

Shown after the first snap — not as the first-screen sitemap.

| Folder | Chip | Ask |
|---|---|---|
| Invoice / truck | Invoice / truck | Truck ticket or invoice — snap it when you want that paper off the plate. |
| Schedule | Week schedule | Can you snap this week’s schedule? We’ll see who’s posted in and out. Labor lives on that grid. |
| Labor cards | Labor cards | Got labor cards, or is it shift / role specific? Snap how this shop runs the seats. |
| Menu | Menu | Picture of the menu — top money plates first. Recipes suck; we figure the chaos. |

Attach path: existing `/api/upload` + folder hint. Photo uses `capture="environment"`. File picker is the stub that matches current seat uploads. Invoice / truck snap files to `invoice-truck` (legacy `order-guide` still maps). Copy says invoice / truck / short — not order-guide ownership.

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
| Open ask + branches + identity | `src/lib/day1Coach.ts` |
| Invoice / truck plate (legacy `order-guide`) | `src/lib/operatorV2.ts` |
| LOM UI | `src/components/FreeOperatorPhone.tsx` |
| Adult tray chrome | `src/lib/freeOperatorDemo.ts` · `src/app/globals.css` |
| Vendor cadence | `config/ctap-vendor-cadence.json` · `src/lib/vendorCadenceConfig.ts` |
| Dedup | `src/lib/invoiceIdentity.ts` |
| Ask copy | `src/lib/simpleOwnerDemo/compose.ts` |
| Resend invalid-recipient → HTTP 400 | `src/lib/email.ts` · `src/app/api/onboard/request/route.ts` |

## Voice

Prefer: problem, going on, bartender, drawer, Z, books, 30-60-90, P&L, hats, invoice, truck, short, credit, DoorDash take, checkout, 86, food cost.

Ban: layer, spine, unlock, insight, orchestration, empower, leverage, holistic, flywheel, north star, ecosystem, Prime Cost Coach, order-guide lead, SaaS tour.

Patterns live in `docs/company/OPERATOR_VOICE.md`. Day-1 open is Wave 0 from the suck-in bank: pain first, not welcome-to-onboarding.

## Anti-patterns (cut)

Fee portals. Apps that own you. Multi-dashboard. Modules tour before papers-in. KPI tiles on day 1. Order-guide-as-first-aha. Stiff truck/invoice hero. Toy emoji bottom nav.

## Hold

PR #224 Stream A locks stay on hold. Do not merge that draft into this conversation-first screen.
