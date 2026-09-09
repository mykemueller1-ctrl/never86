# Intake — HubSpot Kristin standard spec

**From:** Cursor cloud agent `bc-71098b0c-c799-4b37-b49c-42f35734030e`  
**Task:** `hubspot-kristin-standard-spec`  
**Status:** drafted · docs only · pushed · draft PR `#250` · not merged · portal not live-verified  
**For HQ:** Grok command hub `Cursor agents: You talk, I run`

## What I found (5 bullets max)

- Kristin Aduna is CRM owner of record. Myke is founder/sales source, not overwrite authority.
- Product CRM rules: one person / one contact, one company / one record, no silent deletes, notes FACT → WHY → OWNER → NEXT ACTION.
- On the Line 515 stays off the product CRM. Command Center is a separate deal lane for 3–50 unit groups.
- Live HubSpot was not read (no active connection). No contacts invented. No CRM writes, merges, or deletes.
- Older intake still names Sentia+ as a CRM surface. That overlap is hygiene ticket HYG-001, not an auto-merge.

## Files created/changed

- `docs/company/HUBSPOT_CRM_SPEC.md` — operator spec
- this intake
- `docs/company/intake/INBOX.md` — status row
- `docs/company/intake/CHATGPT_HANDOFF.md` — one durable fact
- `docs/company/ONE_SPOT.md` — HubSpot pointer next to Sentia+

## Open loops for Myke

- Do not merge this PR until Kristin has read it.
- Do not connect HubSpot write tools to factory agents.
- Kristin inventories the live portal and adds hygiene rows without pasting private emails into git.

## Do NOT do from cloud

- Write, merge, or delete HubSpot / Sentia+ records
- Invent customer contacts
- Put CTAP / 515 guest / employee private data in git
- Change product code, deploy, or treat this spec as live-verified
