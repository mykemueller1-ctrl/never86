# CTAP Action Shift — screen map (proof install)

Builds the **same** LLM→DoorDash→free seat→3 seats→full store path.  
Private store data stays out of company GTM.

See: `docs/product/LLM_FIRST_ONBOARDING_WIREFRAME.md`

---

## Information architecture

```
/ctap (or /action-shift) 
├── /desk          Seat 1–3 land here — ONE next move
├── /drop          Paste / upload close, Z, statement
├── /night         Night proof checklist
├── /team          Seats: Owner (free) · GM · Station
├── /3p            DoorDash / marketplace receipt (also LLM entry mirror)
└── /station/[role] Kitchen · Bar · Driver checklists (full in-store)
```

---

## Screen specs (wireframe)

### S2 — Desk (hero of the product)
**One composition.** Not a dashboard.

- Brand: Community Tap / Never86 Action Shift  
- One headline: prior business date + one-line verdict  
- One supporting line: evidence status (Verified / Partial / Missing)  
- CTA group: **Do this** · **Who owns it** · **Proof needed**  
- Max 3 action rows (normally 1) — each: owner · $ observed · claim boundary  
- No cards in hero · no stat strip · no Command Center chrome  

### S3 — Drop
- Big drop zone: photo / PDF / paste numbers  
- Paths: PDQ Z · invoices · DoorDash statement  
- After parse → routes to Desk with source tags  

### S4 — Night
- Checklist from morning actions  
- Done? · Proof attached? · Failed / missing data?  
- Does not rewrite financial truth from a verbal yes  

### B4 — Team (3-seat path)
| Seat | Label | Status |
|---|---|---|
| 1 | Owner | Free · you |
| 2 | Manager / GM | Invite · paid later |
| 3 | Kitchen or Bar | Invite · paid later |

### W2 / 3P — Operator Receipt
Same canonical format as MCP / Esteban wedge story.

---

## Data in (CTAP)

1. PDQ sales / Z (photo or export)  
2. Optional: labor dollars, voids, cash expected vs deposit  
3. Optional: DoorDash statement for 3P path  

Engine already exists: `buildActionShift` + MCP `build_action_shift`.

---

## Build order tonight

1. Desk shell page (S2) — wired to `buildActionShift`  
2. Drop page stub (S3) — paste numbers form first (photos later)  
3. Team seats stub (B4) — 1 free + 2 locked invites  
4. 3P receipt page stub linking LLM story  
5. Station checklists = after Desk works on real PDQ  

Command Center pages already in repo stay **out of scope** for this sprint.
