# Command Center drill-downs — operator + engineering brief

**For:** Myke (sales story + product path)  
**Date:** 2026-09-03  
**Quality bar:** same as the 1P–3P / Audit path already done with Codex — honest labels, no vapor, no invented dollars.  
**Status of this file:** map of what is in git and on the live site. Not a deploy. Not a savings claim.

---

## Honesty first

| Label | Meaning on Command |
|---|---|
| **Verified** | Re-pullable primary source we own (Toast dining-option / employee-performance rows, a written rate card on file). |
| **Estimated** | Modeled from a Verified base × an assumption (take rate, ×12 annualization, COMPASS recovery surface). |
| **Unverified** | Scrape, stale, not wired, or a July note the Compass build itself marked unverified. |
| **Missing** | Incomplete week stays Open. No count → no food cost. Invoice ≠ COGS. POS ≠ payout. |

Do not invent savings. Do not guarantee recovery. Do not name staff as thieves. Flags patterns, not verdicts.

**Taco Bamba / Rik is another operator’s labeled work.** It is not Community Tap. Do not mix Bamba store names, staff names, or private numbers onto the public site or into CTAP stories. The public demo already has a fictional 5-unit pizza group for that job.

**This checkout is not what deploys www.never86.ai.** Default branch `recovery-apr12` is the thin email-only operator launch (PR #187, 2026-09-03). Live `/audit`, `/demo/3p-fee-finder`, `/demo/void-hunter`, `/answers/restaurant-command-center-without-another-dashboard`, and gated `/command-center` match **`origin/main`**, not this tree. Command application code lives on `main`. This brief is the map; it does not ship UI.

Public MCP (`https://www.never86.ai/api/mcp`, Operator System v3.1.0) currently exposes `analyze_labor`, `analyze_vendor_prices`, `build_action_shift`. There is no Command drill-down tool on the MCP yet.

---

## 1. Product placement — Audit → Action Shift → Command

Same loop. Different seat count.

```
capture → parse → truth-gate → normalize → decide (formulas first)
  → assign (≤3, usually 1) → human approve → prove → learn → repeat
```

| Seat | Who | What they get | Public try-it today |
|---|---|---|---|
| **Audit** | Google door. Owner fighting DoorDash. | One redacted statement → labeled math in ~60 seconds. | Live `/audit` (200). Codex 1P–3P / 3P-acquisition path. |
| **Action Shift** | One location + one free seat. | Yesterday → one next action → night proof. | Live `/action-shift` on main; public-safe demo repo `never86-action-shift-live`. |
| **Command** | Multi-unit ICP (about 3–50 shops). | **The same next-action loop, ranked across shops.** Not another dashboard. | Gated `/command-center` (307 → `/reports/login`). No public click-through try-it yet. |

Owner (1–2 shops) is Action Shift. Command is the group seat: one network miss, one shop, one line, one owner, one due. Extra seats / locations are paid. One location + one seat stays free.

**What Command is not**

- Not R365’s GL.
- Not MarginEdge per-location invoices.
- Not Voosh (no merchant-portal login).
- Not a fee calculator pretending to be the company.
- Not a mailbox ingest product.
- Not a ChatGPT app.

The live answer page already says this: [A restaurant command center without another dashboard](https://www.never86.ai/answers/restaurant-command-center-without-another-dashboard). Operating unit = the **exception**, not a chart wall.

---

## 2. Exists vs stubbed vs missing

### Exists (code on `main`, some of it live)

| Piece | Where | What it actually does |
|---|---|---|
| Unified Command (CEO/CFO/COO/CTO/Data long-scroll) | `src/components/UnifiedCommandCenter.tsx`, `/command-center` | Network KPIs, ≤3 coach cards, exception list, void findings, store table (net / 1P% / 3P $). Hardcoded `operatorId={3}`. |
| Older store-table Command | `src/components/CommandCenter.tsx`, `/reports/command-center/[operatorId]` | Per-operator net / 1P% / 3P / catering. No coach cards. No click-through. |
| Void Hunter findings | `src/lib/voidFindings.ts`, `VoidFindingsSection.tsx` | Network rollup → location rows → top-offender row → data-gap note. Every figure traces to `void_hunter_findings.id`. |
| Void Hunter live run | `src/lib/voidHunter.ts` | Peer-median void rate by store; top employees from `toast_employee_performance`. Patterns, not verdicts. |
| Coach cards | `src/lib/coachCards.ts` | Exception → why → **who owns it** → **one next action**. Playbooks: `void_excess`, `discount_excess`, `first_party_below_network`, `catering_under_index`. |
| Source tags | `src/lib/sourceTags.ts` | Verified / Estimated / Unverified registry. Recovery surface and 3P fees are **Estimated**. Food cost / SEC / BLS are **Unverified**. |
| 3P Fee Finder | `src/lib/threePFees.ts`, `/demo/3p-fee-finder` (live 200), `/tools/3p-fee-finder` (gated) | 3P **revenue** Verified from Toast. Fee = revenue × 20–25% **Estimated**, unless a written rate card is on file. 1P% is the lever. |
| Public 5-store sample | `src/lib/demoData.ts` | Fictional pizza group (Downtown / University / Riverside / Midtown / Airport). Banner: “this isn’t a real restaurant.” |
| Action Shift engine | `src/lib/actionShift.ts` | One store, ≤3 actions, proof object, `verbalYesCloses: false`. Used by the swarm as the first morning move. |
| Command swarm v1 | `src/lib/commandCenterSwarm/` (PR #174, merged to main) | CSV-first, Sample Store One only. 10 free agents + 6 store specialists + company router. **Never sends.** |
| Admin confirmation | `src/app/admin/confirmation/page.tsx` | Side-by-side **Bamba-labeled** Void Hunter vs **CTAP** daily sales. Admin-gated, noindex. |
| Compass static (operator 3) | `public/reports/op-3/` **on this branch** | Built “CEO Command” bundle (Rik enrichment, ingest `op_3_ingest_2026_07_02`). Gated on live (`/reports/op-3` → login). |
| Operator login isolation | PR #105 | `/dashboard` scoped to one `operator_id`. `/command-center` stays admin/reports. |
| Issue #175 | GitHub | “Next 10 Moves” packet. Move 10 is **ship the multi-unit desk (read-only)**. Still open. |

Live probes (2026-09-03, this run):

- `/audit` → 200
- `/demo/3p-fee-finder`, `/demo/void-hunter` → 200
- `/command-center` → 307 `/reports/login`
- `/reports/op-3` → 307 login
- `/reports/taco-bamba` → 307 login (route leftover; **page source was scrubbed from `main`**)

### Stubbed (renders, does not drill)

| Piece | What’s missing |
|---|---|
| Store table rows | Display only. No click → shop pane. |
| Exception / coach cards | Owner + action exist. No `due` field. No proof close. No store deep-link. |
| Void location table | Network → shop list. Stops there. No Z / statement line pane. |
| CFO 3P fee range | 20–25% assumed take unless rate card attached. |
| CFO prime cost / food cost | `Pending` card: invoices & recipes not loaded. |
| COO wage benchmark | `Pending`: BLS OEWS. |
| CTO integrations | SEC / BLS / FRED / NOAA / USDA listed as unverified / pending. |
| Data Lead exports | CSV/Parquet `Pending`. |
| `/command-center` operator id | Hardcoded `3`. Confirmation page still *labels* “Operator 1 · Bamba” while calling `getVoidHunter(3)`. **IDs conflict — do not treat “Bamba = 1” as settled in sales copy.** |
| Swarm “multi-unit” | Explicitly one store (`storeScoped: true`). Next-10 move 10 is unread. |
| `/reports/taco-bamba` | Historical live report (May). Brand-protection scrub removed the page from `main`. Login still catches the URL. |

### Missing (not in this repo as a working click-through)

- Network miss → shop → **statement / Z line** → owner → **due** as one demoable path.
- Store-level Command URL (`/command-center/store/[id]` or hash pane).
- Public `/demo/command` at the same quality as `/audit` / `/demo/3p-fee-finder`.
- Command MCP tool.
- Wired Thanx / Marqii / Looker / EONR (scaffolds in `agents/`, not Command UI).
- `never86-command-center-v2` and `taco-bamba-command-center` as GitHub repos (see §6).

---

## 3. Intended drill-down — operator language

Tell it like a close, not like a BI tool.

1. **Network miss.** The group number that is off: voids above the pack, first-party digital below the house, catering under the median, 3P fee load up. One miss. Ranked. Source-tagged.
2. **Shop.** Which unit is carrying it. Compare to the network’s own median — not a national benchmark you don’t have.
3. **Statement / Z line.** The actual line: void dollars and event count, 1P% of digital, 3P revenue (not “fees” until the take rate is written), catering dollars, labor $ ÷ net for that week. If the line isn’t on a Z or a statement, it stays Missing.
4. **Owner.** The seat that can move it tonight or this week: Store GM, Area Director, COO — from the escalation tier already in `coachCards.ts`. LLM ranks. Human sends. No auto-mail.
5. **Due.** When proof is due: tonight (Action Shift), this week (void log + reason codes), next period (re-check). Verbal yes does not close. Attach the object (void log, deposit slip, payout ID, invoice).

**1P–3P is already one miss type, not the whole product.** Codex already built the Google door: paste a DoorDash statement on `/audit`. Command reuses that honesty on a group: “this shop’s digital is mostly 3P” is Verified mix from Toast; “this is what they take” is Estimated until the statement / rate card is in.

**What the operator should hear in a demo**

> “Sixteen shops, one miss. This shop is above the house on voids. Here’s the line. Here’s the GM. Here’s this week’s proof. We don’t call it theft. We don’t invent the year-one save. If the week isn’t complete, it stays Open.”

---

## 4. File map and sample data

### On `origin/main` (the live Command tree)

| Path | Role |
|---|---|
| `src/lib/commandCenter.ts` | Reads `v_network_overview`, `v_first_party_digital`, `v_operator_3p_economics`, `v_governance_exceptions`, `v_latest_weekly_by_location`. |
| `src/lib/voidFindings.ts` / `voidHunter.ts` / `voidAnalysis` | Network → shop → employee pattern. |
| `src/lib/coachCards.ts` | Owner + one action. |
| `src/lib/sourceTags.ts` | Tag registry. |
| `src/lib/threePFees.ts` | 1P/3P economics; optional written rate card. |
| `src/lib/demoData.ts` | Public-safe 5-store sample (use this for any public Command try-it). |
| `src/lib/actionShift.ts` | Single-store morning loop Command should call per shop. |
| `src/lib/commandCenterSwarm/*` | CSV workers + specialists. Sample Store One. |
| `src/components/UnifiedCommandCenter.tsx` | Role long-scroll. |
| `src/components/VoidFindingsSection.tsx` | Closest existing drill: network KPI → store table. |
| `src/app/command-center/page.tsx` | `operatorId={3}`. |
| `src/app/admin/confirmation/page.tsx` | Bamba-labeled vs CTAP (admin). |
| `src/app/demo/3p-fee-finder/page.tsx` | Live public 1P/3P store table. |
| `src/app/demo/void-hunter/page.tsx` | Live public void store table. |
| `docs/COMMAND-CENTER-NEXT-10.md` | Intent packet (~40% to governed orchestration). Multi-unit is a **non-goal** in the short packet; move 10 in the company packet contradicts that — treat multi-unit **desk** as the next product slice, not the swarm. |
| `docs/company/COMMAND_CENTER_SWARM.md` | Activate swarm locally. |
| `docs/company/COMMAND_CENTER_NEXT_10_MOVES.md` | Issue #175 source. |
| `GOVERNANCE.md` | Source-tag, signed-gate, cannot-answer. |
| `agents/per-location-template.md` | 16-store digital-twin **template**. Contains **staff names and store-level figures**. Do not copy those names or dollars onto the public site or into this sales brief as current facts. |
| `public/samples/swarm/*.csv` | Synthetic CSVs for the ten free agents. |

### On this branch (`recovery-apr12`)

| Path | Role |
|---|---|
| `public/reports/op-3/` | Static Compass “CEO Command” (Rik enrichment). Built JS, not the React source. |
| `docs/STACK-MAP.md` | Lists `never86-command-center-v2` as a private repo. **GitHub cannot resolve that repo under this account.** |
| `MYCHAEL_LOGIC_OS_ARCHITECTURE.md` | operator → brand → concept → store schema (additive). No UI. |
| `src/` | Waitlist / Z / invoice / briefing stubs only. **No Command routes.** |

### Sample / labeled datasets (keep them separate)

| Dataset | What it is | Public? | Use in sales |
|---|---|---|---|
| **5-unit pizza demo** | Invented, internally consistent. `demoData.ts`. | Yes (`/demo/*`) | Default. Say “sample.” |
| **Sample Store One** | Synthetic close + swarm CSVs. | Noindex `/action-shift/swarm` on main | Engineering receipt, not a logo. |
| **Bamba / Rik / operator-3 Compass** | Another operator’s Toast + contract-rate work. 16 stores. Ingest id `op_3_ingest_2026_07_02` in the static bundle. | Gated / noindex | **Labeled case only, with permission.** Do not quote annualized leak or fee totals as current Never86 proof. Re-pull or stay quiet. |
| **CTAP daily sales** | Community Tap, operator 2 in the confirmation page. Single-unit. | Admin only | Never on the public Command story. No names, PINs, or private numbers. |
| **Historical `/reports/taco-bamba`** | May 2026 live Toast report. Page removed from `main` in the brand-protection scrub. | URL still login-gated | Do not revive the customer name on a public URL. |

STATE.md on main (dated 2026-05-28) is **stale**. It still says `/reports/taco-bamba` is live and quotes a reconciled net. Treat it as a May snapshot, not today’s production inventory.

---

## 5. Bamba / Rik work — what the drill-down *was* built to do

Claude/Codex already encoded the ladder. Public sales must describe the **ladder**, not replay private figures.

**May–June (git history, Claude):**

- Live Toast report by location (later scrubbed off the public name).
- Void Hunter on `toast_employee_performance`: network rollup + per-location rows + data gap (PR #9, PR #33).
- Coach cards + 1P% chips on the store table.
- Admin confirmation: Bamba-labeled network vs CTAP daily ladder.
- Weekly tracker HTML for digital/loyalty (Charissa lane) — later removed from `main`.

**July (this repo’s `public/reports/op-3` bundle, Rik enrichment):**

The compiled Compass talks in operator language and already *thinks* in drill-downs:

- Network ranked summary, source pills on every figure.
- Voids + comps ranked by store (Toast IQ, 30d ending 2026-07-01).
- 3P fee load at **written contract rates** (DD / UE / GH) — still **Estimated** (Verified 3P revenue × contract %).
- Catering ceiling vs network median.
- Labor % vs network median (Toast Weekly Overview).
- Unknown-employee POS config (one shop clean; treated as a **network config** problem, not a one-store bug).
- Findings tied to ingest `op_3_ingest_2026_07_02`.

That bundle is the closest thing in *this* git to “Taco Bamba Command drill-downs.” It is a **built artifact**, not editable source. Click-through behavior (if any) is inside minified JS — there is no store-route in the Next app that matches it.

**Do not put on the public site from this work**

- Customer brand name as a live URL.
- Staff or “top offender” names.
- Private contract rates as if they were Never86’s published benchmark.
- Annualized recovery / fee headlines from the July bundle without a fresh Verified re-pull and operator permission.

---

## 6. Mac folders / other repos — not in this GitHub account

`gh` cannot resolve:

- `mykemueller1-ctrl/never86-command-center-v2`
- `mykemueller1-ctrl/taco-bamba-command-center`

STACK-MAP still lists `never86-command-center-v2` as private. If those trees only live on a Mac, they are **not** in this agent’s git.

**Pull from the Mac if you want the source behind the July Compass / weekly tracker:**

| Local folder (historical) | Why pull it |
|---|---|
| `never86-command-center-v2` | Likely the Compass source that compiled to `public/reports/op-3`. Need the React routes, not the minified bundle, to rebuild click-through. |
| `taco-bamba-command-center` | Likely the named operator shell + Charissa weekly tracker. Confirm it is not a fourth Never86 repo you would publish. |
| Anything still holding `deliverables/taco-bamba-weekly-tracker/` | Removed from `main` after the brand-protection scrub. Offline HTML, local storage. |

**Already public, do not duplicate:** `never86-action-shift-live` (Build Week demo). Focus Command here; don’t start a fourth brand repo.

---

## 7. Smallest next build (demoable like `/audit` / DoorDash try-it)

**Do not build:** mailbox ingest, ChatGPT app, live Bamba reconnect, fake savings, auto-mail, a new repo.

**Build one public-safe click-through on `main`:** `/demo/command` (noindex, sample banner).

Reuse only what already exists:

1. **Network miss** — compose `DEMO_VOID_HUNTER` + `DEMO_THREE_P` (already public). One ranked miss: e.g. “Downtown voids above the house” *or* “Downtown first-party digital below 50%.”
2. **Shop** — click the store row (the missing piece on today’s tables).
3. **Line** — show the measured cells for that shop only: void $, void rate vs sample median, 1P%, 3P revenue. Tag Verified (sample) vs Estimated (fee = revenue × 20–25%).
4. **Owner + due** — run `buildCoachCards` on a hand-built sample exception (`void_excess` or `first_party_below_network`). Add an explicit `due` (`tonight` / `this week` / `next period`) copied from the playbook sentence that is already there.
5. **Proof** — one line: “Void reason log” or “DoorDash finalized payout + this shop’s Toast 3P $.” `verbalYesCloses: false`.

Ship rule: if `/demo/3p-fee-finder` can stay up with a sample banner, `/demo/command` can too. No ops DB. No operator 3. No Bamba name.

**Even smaller if you want a one-PR slice:** make rows on the existing `/demo/void-hunter` and `/demo/3p-fee-finder` open a shop pane (owner + due + line). Same math, less chrome.

Then, and only then, point gated `/command-center` store rows at the same pane component with live `getCommandCenterData` / `getVoidFindings`. That is the design-partner path, not the Google door.

---

## 8. Command drill-down one-pager outline (sales)

Sections only. No dollars invented in the room.

1. **Promise.** Find the leak. Assign the fix. Keep the receipt. Same loop as Action Shift; Command is the group seat.
2. **Who it’s for.** 3–50 shop ICP. Chef-led / multi-unit. Not a 200-unit BI replacement.
3. **What it is not.** Another dashboard. Not R365. Not Voosh portal login. Not a fee calculator.
4. **The five clicks.** Network miss → shop → statement/Z line → owner → due. Demo on sample data first.
5. **1P–3P as one miss type.** Mix from POS is Verified. Take-rate dollars are Estimated until the statement or written rate card is in. `/audit` remains the Google door for one statement.
6. **Honesty pills.** Verified / Estimated / Unverified / Missing. Incomplete week stays Open.
7. **What we will not say.** Guaranteed recovery. Named thieves. Bamba or CTAP private figures. “We saved you $X” without a proof object.
8. **Proof of method (not a case-study claim).** Public `/demo/void-hunter` + `/demo/3p-fee-finder` today; `/demo/command` next. Design-partner Command stays gated.
9. **Seat math.** One location + one seat free. Extra shops / seats paid. Free seat goes past MarginEdge (Action Shift), not a fake Command.
10. **Ask.** Walk one sample miss in five clicks. If they want their shops, they paste files — no portal password.

### Math that is safe to say in the room

| Claim | Tag | Formula / rule |
|---|---|---|
| Shop net sales, 1P% of digital, 3P **revenue** from Toast dining options | Verified | Leaf channel, de-duped. Each order once. |
| Void $ and void events from employee-performance / findings rows | Verified | Trace to row id. Pattern, not verdict. |
| “Above the house” | Verified | Shop rate vs **this network’s** median — not a national norm. |
| 3P **fees** | Estimated | `3P revenue × take rate`. Default 20–25% if no card. Contract % only if written. |
| Annualize a 30-day read | Estimated | `period × 12` — say so. |
| Recovery / leak surface | Estimated | COMPASS / modeled. Never “recovered.” |
| Food cost / prime cost | Missing / Unverified | No count → no food cost. Invoice ≠ COGS. |
| Payout vs POS | Unverified until both sides | POS ≠ payout. Need finalized payout ID + bank. |
| Action Shift cash/labor/payout lines | Unverified observations | Operator-supplied targets only. Proof object required. |

---

## 9. Suggested talk track (no numbers)

“Audit is the DoorDash door — one statement, labeled math. Action Shift is last night at one shop — one action, night proof. Command is that same close across the group. We don’t add a dashboard. We rank one miss, open the shop, show the line, name the owner, set the due. If we don’t have the line, we say Missing. If the fee isn’t on a statement, we say Estimated. We never mail the GM for you.”

---

## 10. Pointers

- Issue #175 — Command Center Next 10 Moves (move 10 = multi-unit desk).
- Issue #122 — GTM / SEO (3P answers + OS pages; do not duplicate the command-center answer).
- Live answer: `/answers/restaurant-command-center-without-another-dashboard`
- Swarm PR #174 — CSV-first, no send.
- This file: `docs/COMMAND_DRILLDOWN.md`
