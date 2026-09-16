# CRM two lanes + LinkedIn (operating overlay)

**Status:** drafted in git · not HubSpot records · not sent  
**Points at:** [`HUBSPOT_CRM_SPEC.md`](HUBSPOT_CRM_SPEC.md)  
**Task:** `crm-two-lanes-linkedin`  
**Owner after merge review:** Grok command hub; Myke is the only CRM-write and send gate

Field names, write gates, and planned pipeline labels live in `HUBSPOT_CRM_SPEC.md`. This file encodes **who goes on which lane** and what LinkedIn mail is allowed to prove. Do not invent HubSpot contacts, deals, or IDs from these names.

---

## Three tracks (do not collapse)

| Track | Product motion | Unit band | Owner / door | HubSpot lane value |
|---|---|---|---|---|
| **A — Action Shift** | Yesterday → one action → night proof. Free one-location / one-seat door. | **1–5** independents | **Kristin owns Grill / Max** (New American Grill = Max Grill = one seat; not Community Tap) | `A_action_shift` |
| **B — Command** | Multi-unit exception desk. Not the free Action Shift seat. | **3–50** | **Rik / Bamba**, **Markham**, **Red Door** | `B_command` |
| **C — On the Line 515** | Iowa operator show. Book → host → guest. Not a marketing blast list. | Media / guest | **Spencer = booker** · **Victor = host** · **Kayla = guest first** | `C_515` |

Track A is the independent Action Shift product. Track B is the command-center / multi-unit motion. Track C is 515 booking, not sales marketing.

A Grill/Max file job stays Track A. A Bamba / Markham / Red Door command job stays Track B. A 515 guest ask stays Track C.

---

## Track A — Action Shift 1–5

- Motion: one store, one seat, one labeled next action, night proof.
- Door: `/` OS, `/trial` seat, `/audit` 3P proof. No merchant-portal login.
- **Kristin owns Grill / Max.** Same seat. Do not split Max Grill and New American Grill into two CRM companies.
- Community Tap is the private lab. Keep CTAP dollars, PINs, and staff names out of this public git and off GTM packets.
- Hunter replies and `/audit` clicks can *feed* Track A. They do not auto-create HubSpot deals.

---

## Track B — Command 3–50

- Motion: fleet exceptions, sales/labor command, prime-cost terminals when evidence exists.
- Named doors in this overlay: **Rik / Bamba**, **Markham**, **Red Door**.
- Not Action Shift 1–5. Do not drop a 16-unit command conversation onto Kristin’s Grill/Max seat.
- No invented food, labor, or inventory dollars. Incomplete week stays Open.

---

## Track C — On the Line 515

| Seat | Role | Not |
|---|---|---|
| **Spencer** | **515 booker** | Not marketing. Not hunter. Not Track A closer. |
| **Victor** | **515 host** | Not the CRM write gate. |
| **Kayla** | **Guest first** | Not a lead until Myke says the relationship changed. |

515 is the Iowa operator conversation. Booker schedules. Host runs the room. Guest is a guest. Do not file Spencer as Head of Marketing or put 515 guests on Track A because they appeared on a show.

---

## Not a lead

| Person | Relationship | CRM treatment |
|---|---|---|
| **Christopher Sebes** | **Myke mentor** | `relationship_not_lead` · mentor. Not Track A. Not a hunter packet. No outreach without explicit Myke yes (same hard stop as `ONE_SPOT.md`). |
| **Noah Glass** | **Olo CEO relationship** | `relationship_not_lead` · platform-CEO. **Not Action Shift.** Not Track A 1–5. |

Do not score mentors or platform-CEO relationships as Action Shift leads. Do not invent companies, emails, or deal stages for them.

---

## LinkedIn digest = PARTIAL

LinkedIn **email digests are PARTIAL**. No DM bodies.

| Digest can support | Digest cannot support |
|---|---|
| That a notification fired | The text of a LinkedIn DM |
| Public name / headline if the mail shows it | A complete conversation |
| A profile or thread URL if present | Send-ready copy |
| A draft research note | A HubSpot deal or “replied” stage |

If the only source is the digest, set `n86_linkedin_completeness=partial` and stop. Do not reconstruct DMs. Do not paste private InMail into git.

---

## Daily lead packets stay DRAFT

| Packet | State | Unlock |
|---|---|---|
| Daily lead packet (any track) | **DRAFT** | Myke **send-yes** on the exact recipients, channel, and copy |
| LinkedIn reply / DM | drafted | same |
| HubSpot create / update | not started | Myke names the object; workers do not write CRM |
| 9/5 or 9/7 lead packets (hard-truth lock) | not approved outbound | still not approved |

LLM ranks. Human sends. No auto-mail. No portal logins.

---

## Factory states for this job

| State | This packet |
|---|---|
| drafted | yes — these two docs |
| staged | git add on the isolated Cursor branch |
| tested | docs-only; no product tests added |
| committed / pushed | factory evidence on this branch |
| merged | no |
| deployed | no |
| live-verified | no — no HubSpot rows, no sends |

---

## Hard stops

- No product code in this job.
- Do not invent HubSpot records.
- Do not write Sentia+, HubSpot, Apollo, Gmail, or social.
- Do not merge. Draft PR only.
- No CTAP private numbers, PINs, or staff names on this public site.
- Spencer is 515 booker, not marketing.
- Sebes is mentor, not a lead.
- Noah Glass is Olo CEO relationship, not Action Shift.
