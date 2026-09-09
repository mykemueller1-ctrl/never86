# HubSpot CRM spec — Kristin's standard

**Audience:** any operator, founder, or agent who might touch sales records  
**Owner of record:** Kristin Aduna  
**Sales source, not overwrite authority:** Myke Mueller (founder)  
**Stamp:** 2026-09-09  
**State:** drafted in git · not merged · not deployed · **portal not live-verified**

This is the Never86 **product CRM** rulebook. It does not change the product. It does not write, merge, or delete HubSpot records.

---

## Read this in one minute

1. **One person = one contact.** Same human, two emails? Still one contact. Ticket the extra row.
2. **One company = one record.** Two locations of the same group stay on one company, with location notes. Do not mint a second company because the city changed.
3. **Kristin owns the CRM.** Myke can add a real conversation. He does not overwrite Kristin's owner, stage, or merge decision.
4. **No silent deletes.** Wrong record? Ticket it. Archive only if Kristin says so. Agents never delete.
5. **Every note is four lines:** FACT → WHY → OWNER → NEXT ACTION.
6. **On the Line 515 stays off this CRM.** That is Victor's media lane, not a customer company.
7. **Command Center is its own deal lane** for **3–50 unit groups**. Do not drop a multi-unit group onto the 1–3 owner seat lane.

---

## Who may do what

| Seat | May | May not |
|---|---|---|
| **Kristin Aduna — CRM owner of record** | Create, fix, associate, archive, decide merges, set owner/stage | Leave a silent delete; auto-merge duplicates |
| **Myke Mueller — founder / sales source** | Log a real conversation as a note; create a contact/company/deal when the person and company are known | Overwrite Kristin's owner, lifecycle, associations, or merge call; invent a person |
| **Vadim / product** | Read this spec; ask Kristin before any CRM change | Treat a PR as a CRM write |
| **Grok / Cursor / Grok Bots** | Draft a note or hygiene ticket in git | Write HubSpot; send mail; merge records; publish |
| **Marketing / hunter bots** | Hand a qualified lead to Sales / Kristin | HubSpot spray; import commenters; create 515 guests as customers |

Apollo is not used. Agents do not get HubSpot write access from this spec.

---

## Object model

### Contacts — one person, one contact

A contact is a **human**, not an inbox and not a store.

| Rule | Do | Do not |
|---|---|---|
| Identity | One contact per person. Extra emails/phones go on the same record | A second contact because they used a different email |
| Company | Associate to exactly one primary company | Leave a buyer floating with no company, or attach them to two companies as if they were two people |
| Owner | Kristin sets HubSpot owner | Myke overwriting owner to himself “because he took the call” |
| Private store people | Keep Community Tap staff and private lab identities **out** of this public repo and out of product CRM | Paste CTAP names, PINs, or mail into HubSpot or git |

If two rows look like the same person, open a **hygiene ticket**. Do not auto-merge.

### Companies — one company, one record

A company is the **buying organization**.

| Rule | Do | Do not |
|---|---|---|
| Identity | One company per legal/operating group | One company per location “to keep it tidy” |
| Locations | Note unit count and cities on the one company | Split “Store 1” and “Store 2” into two companies |
| 1–3 vs 3–50 | Unit count decides the **deal lane**, not a second company | Put a 12-unit group on the free owner-seat company pattern |
| Media brands | Leave On the Line 515 off this object | Create “On the Line 515” as a Never86 customer company |

### Deals — two lanes, do not mix

Same HubSpot portal. **Two deal lanes.** The product already has two doors (`/` + `/onboard` for 1–3; `/command-center` for multi-unit). CRM follows that split.

| Lane | Who | Product door | Do not |
|---|---|---|---|
| **Owner / Action Shift** | Independent operators, **1–3 units** | `/`, `/onboard`, `/operator`, `/audit` | Promise Command Center rollups |
| **Command Center** | Groups of **3–50 units** | `/command-center` | Drop them on the free one-seat lane |

A 3-unit independent can sit on Owner. A 3-unit **group desk** that wants fleet rollup sits on Command Center. If unsure, Kristin picks the lane. Do not open two deals for the same buying conversation.

### Notes — FACT → WHY → OWNER → NEXT ACTION

Every note, call log, and meeting body uses this shape. No novel. No “touched base.”

```
FACT: [what happened, dated, source if you have one]
WHY: [why it matters to the restaurant or to Never86]
OWNER: [named human — usually Kristin or Myke, never “the team”]
NEXT ACTION: [one move + by when]
```

Example (synthetic — not a live contact):

```
FACT: 2026-09-09 — owner asked for a redacted DoorDash statement check. No file received.
WHY: Without the statement we cannot audit. Empty rail stays Missing Evidence.
OWNER: Kristin
NEXT ACTION: Wait for the file. Do not open a Command Center deal. Do not mail-chase from HubSpot.
```

Banned in notes: recovery guarantees, theft accusations, CTAP private dollars, staff names, portal passwords.

---

## On the Line 515 stays off the product CRM

On the Line 515 is Victor Hatungimana's **field-story / TikTok lane**. It is a media door, not a customer.

| In 515 | In HubSpot product CRM |
|---|---|
| Guests, commenters, Iowa hospitality talk | Never86 buyers and design partners |
| `@ontheline515` threads as **hunt signal** | A contact only after they become a real Never86 sales conversation through `/audit` or a named intro |
| Brand voice in `docs/company/OPERATOR_VOICE.md` | Company + deal on Owner or Command Center |

Do not create a company named On the Line 515. Do not import 515 commenters. Do not use 515 as a HubSpot source tag for product deals.

If a 515 person later becomes a buyer, Kristin creates **one contact** on the Never86 company they operate — not on a 515 media record.

---

## No silent deletes

| Situation | Move |
|---|---|
| Duplicate contact or company | Hygiene ticket. Kristin decides. No auto-merge. No agent merge. |
| Wrong lane (Owner vs Command Center) | Kristin moves the deal. Leave a FACT/WHY/OWNER/NEXT ACTION note. |
| Bad or junk row | Archive only after Kristin says so. Never delete to hide a mistake. |
| Private CTAP / employee row found | Ticket to Kristin. Do not name the person in git. Do not delete from a bot. |
| “Clean up before a demo” | Stop. Demos do not get a wiped CRM. |

Deletes and merges are human gates. This factory job did **not** delete or merge anything.

---

## Portal state as of 2026-09-09

**Live HubSpot was not read.** This worker had no active HubSpot connection. No contact, company, deal, or note was created, edited, merged, or deleted. No customer names are invented below.

| Check | State | Evidence |
|---|---|---|
| HubSpot portal objects listed | **Not live-verified** | Composio toolkit `hubspot` = no active connection. Connection was **not** opened (that would be a human auth click). |
| Named customer contacts in this spec | **None** | Inventing a buyer list would break the job. |
| CRM writes this job | **None** | Docs only. |
| Older company docs | Sentia+ still named as a CRM surface in intake / HQ files | `CHATGPT_HANDOFF.md`, `ONE_SPOT.md`, `AGENT_HQ.md`. Apollo remains unused. |
| Marketing rule already in code comments | “HubSpot spray” is prohibited | `src/lib/companyOrg.ts` Head of Marketing. Not changed this job. |
| Product code | **Unchanged** | This PR is docs only. |

If someone pastes a HubSpot screenshot later, Kristin updates the hygiene table. Do not treat this file as a live roster.

---

## Hygiene tickets — not auto-merge instructions

These are tickets for Kristin. **Do not merge, delete, or import to “fix” them.**

| ID | Ticket | What we know | What we do not do |
|---|---|---|---|
| **HYG-001** | Dual CRM surfaces | Older intake still names **Sentia+** as CRM. This spec names **HubSpot** as the product CRM standard. Same person in both systems is a duplicate *class*, not a proven named pair. | Auto-merge Sentia+ into HubSpot. Delete either side. Claim the cutover is live. |
| **HYG-002** | On the Line 515 bleed | 515 is a media lane. If any 515 guest, commenter, or “On the Line” company exists in the product portal, it is out of place. | Silent delete. Import more 515 people. Use 515 as a customer company. |
| **HYG-003** | Private store / CTAP people | Community Tap is the private lab. Staff and private identities do not belong in the product CRM or in this repo. | Name them in git. Bot-delete the row. |
| **HYG-004** | Unread portal inventory | This worker could not list HubSpot contacts, companies, or deals on 2026-09-09. **Named customer duplicates documented: none.** | Invent “John / Jane” rows. Auto-merge whatever Kristin finds later. |

When Kristin inventories the live portal, she adds rows here with **initials or ticket IDs only** — not private emails, phones, or staff names.

---

## How a lead becomes a record

1. Hunt or intro finds an operator. Marketing drafts. Myke or Kristin approves any send.
2. They hit `/audit` or give a real name and company. **Then** a contact + company may exist.
3. Unit count picks the deal lane: 1–3 Owner, 3–50 Command Center.
4. First note uses FACT → WHY → OWNER → NEXT ACTION.
5. No file / no statement = Missing Evidence. Deal does not fake a win.

Hunters do not write HubSpot. Factory agents do not write HubSpot.

---

## Evidence states for this document

| Claim | State |
|---|---|
| Drafted in git | yes — this file |
| Tested | docs review / required-section checklist (no product tests; no product code) |
| Committed / pushed | this branch, when the factory push lands |
| PR opened | this job |
| Merged | no |
| Deployed | no — docs do not need a product deploy |
| Live-verified against HubSpot | **no** |
| CRM records written | **no** |

---

## Next owner

**Kristin Aduna** — read this spec; inventory the live HubSpot portal; turn any real duplicates into more hygiene ticket rows; do not auto-merge.

**Myke** — keep logging real conversations as notes; do not overwrite Kristin's CRM decisions.

**Codex** — confirm this PR stays docs-only, invents no contacts, and does not merge.
