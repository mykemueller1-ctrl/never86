# HubSpot CRM spec (drafted contract)

**Status:** drafted in git · not a live HubSpot portal · no records created by this file  
**Owner:** Myke (release / CRM write gate)  
**Companion lanes:** [`CRM-TWO-LANES-AND-LINKEDIN.md`](CRM-TWO-LANES-AND-LINKEDIN.md)  
**Task:** `crm-two-lanes-linkedin`

This file is the field and write-gate contract. It does **not** invent HubSpot contacts, companies, deals, pipeline IDs, owners, or emails. Do not treat a name in this spec as a live CRM row.

Intake still records Sentia+ as a signed-in CRM app with no public MCP. This spec does not claim HubSpot is connected, migrated, or live-verified. No worker may write CRM records from this document.

---

## What HubSpot is allowed to hold

| Object (planned) | Purpose | Not allowed |
|---|---|---|
| Contact / Company | Public-safe identity + lane + relationship type | Portal logins, PINs, CTAP private dollars, staff names as thieves, DM bodies |
| Deal | Only after Myke send-yes on a named packet | Auto-created deals from LinkedIn digest or hunter score |
| Note / Task | Draft packet pointer + evidence status | Pasted Grok transcripts, private mailbox contents |
| Meeting | Calendar-backed only | Invented next-steps |

Every object must carry:

- `n86_lane` — `A_action_shift` · `B_command` · `C_515` · `relationship_not_lead`
- `n86_relationship` — see lanes doc
- `n86_packet_state` — `drafted` until Myke send-yes
- `n86_linkedin_completeness` — `partial` when the source is a LinkedIn email digest

---

## Planned pipelines (names only — not live IDs)

| Pipeline name | Lane | Default first stage |
|---|---|---|
| Action Shift 1–5 | Track A | Draft packet |
| Command 3–50 | Track B | Draft packet |
| On the Line 515 | Track C | Guest / booker hold — not marketing |

Do not put mentor or platform-CEO relationships on a sales pipeline. See the not-a-lead table in the lanes doc.

---

## Write gates

| Action | Who | State after |
|---|---|---|
| Draft lane packet | Grok / Cursor (docs only) | drafted |
| Create or update HubSpot record | Myke only, exact object named | staged / written — only with receipt |
| Send outreach | Myke send-yes | sent + delivery receipt |
| Merge this spec to `main` | Myke | merged (not this PR) |

Workers may draft git. Workers may not open HubSpot, Sentia+, Apollo, or mail and write.

---

## LinkedIn ingest rule (binding)

LinkedIn **email digests are PARTIAL**. They are notifications, not conversation export.

A digest may support: name, headline if shown, notification type, thread/profile URL if present.  
A digest may **not** be treated as: DM body, full comment thread, send-ready copy, or a complete lead.

Daily lead packets stay **DRAFT until Myke send-yes**.

---

## Evidence language

Use drafted · staged · tested · committed · pushed · merged · deployed · live-verified. This spec is **drafted** and **committed** only after the factory push. It is not merged, deployed, or live-verified.
