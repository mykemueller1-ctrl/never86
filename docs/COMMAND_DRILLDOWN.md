# Command Center drill-downs — operator + engineering brief

**For:** Myke (sales story + product path)  
**Date:** 2026-09-03  
**Quality bar:** same as the 1P–3P / Audit path already done with Codex — honest labels, no vapor, no invented dollars.  
**Status of this file:** map of what is in git and on the live site, plus the LLM-style Command desk Myke asked for next. Not a deploy. Not a savings claim.  
**Try-it on this branch:** `/demo/command.html` — plug-and-play box + left-rail “you’re missing this” chips. Sample pizza group only.

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

## 1. Who we play for — then Audit → Action Shift → Command

**Do not forget the little guy again.** SaaS sold integrations and onboarding lifts the 1–2 unit owner cannot staff. They are burnt. Never 86'd is the brand that gives **one location + one seat free** and makes that seat so easy they get a quick win and stay — the same hook every LLM uses.

| Frame | How to say it | Honesty |
|---|---|---|
| **ICP Myke named** | The independent owner who will not pay another $299+/mo tax for a portal, an implementer, and a six-week onboard. | Founder ICP. `$199` Charter / free seat is the product offer already on brand pages. |
| **“~400k under $299”** | Sales name for that pile of US independents. | **Unverified as a census.** Do not put “400,000 stores” on a public page as a counted fact. Use “the independents SaaS priced out.” |
| **“100,000 stores / I’m in the game”** | Founder stance: one owner who actually uses LLMs, building the brand they were never sold. | **Not a scale claim.** We have not onboarded 100k shops. Do not say we did. |
| **LLM comfort** | Operators are being trained on ChatGPT / Claude / Grok *now*. Jump in as the first operator OS that feels like that, not like R365. | Familiar pattern. Not “we shipped a ChatGPT store app to production.” |

**ChatGPT door (exists, gated):** `https://action-shift-operator.never86-d-9722.chatgpt.site/` — Action Shift operator shell on ChatGPT Sites. Probe 2026-09-04: **401, “Sign in with ChatGPT.”** That is the comfortable seat for the owner already living in ChatGPT. It is not a public try-it and not a claim we invented a new ChatGPT app. Public rock stays `/audit` + the sample desk on this branch.

Same loop. Different seat count. The **first** seat is the forgotten owner. Command is the same desk when they have a handful of shops — not the homepage.

```
capture → parse → truth-gate → normalize → decide (formulas first)
  → assign (≤3, usually 1) → human approve → prove → learn → repeat
```

| Seat | Who | What they get | Public try-it today |
|---|---|---|---|
| **Audit** | Google door. Owner fighting DoorDash. | One redacted statement → labeled math in ~60 seconds. | Live `/audit` (200). Codex 1P–3P / 3P-acquisition path. |
| **Action Shift** | One location + one free seat. | Yesterday → one next action → night proof. | Live `/action-shift` on main; public-safe demo repo `never86-action-shift-live`. |
| **Command** | Same owner, 3–50 shops later. | **The same next-action loop, ranked across shops.** Not another dashboard. | Gated `/command-center` (307 → `/reports/login`). Sample LLM desk: `/demo/command.html` on this branch. |

The forgotten owner (1 shop) is Action Shift. Command is the group seat: one network miss, one shop, one line, one owner, one due. Extra seats / locations are paid. **One location + one seat stays free and has to hook.** If the free seat is heavy, we became SaaS.

**What this is not**

- Not R365’s GL.
- Not MarginEdge per-location invoices.
- Not Voosh (no merchant-portal login).
- Not a fee calculator pretending to be the company.
- Not a mailbox ingest product.
- Not “we forgot the little guy, Command is only 16-unit chef groups.”
- Not a new ChatGPT app we invent in this PR. **It should feel like an LLM** (drop one thing, get coached on the next hole). The ChatGPT Site above is the familiar door for people already signed in there.

The live answer page already says this: [A restaurant command center without another dashboard](https://www.never86.ai/answers/restaurant-command-center-without-another-dashboard). Operating unit = the **exception**, not a chart wall.

### The rock (how Command should feel)

Same as Claude / ChatGPT / Grok: one plug. No setup. No portal password.

| Surface | Job |
|---|---|
| **The box** | Drop or paste a Z, a statement, a void log. That’s the rock. |
| **Left rail** | Small chips: “You’re missing last night’s Z.” “Fees stay Estimated until the statement is here.” “No count → no food cost.” |
| **The suck-in** | The missing chip *is* the next prompt. Operators don’t hunt a dashboard. They plug the hole the rail named. |
| **The receipt** | One miss → shop → line → owner → due. LLM ranks. Human sends. |

This is already how Action Shift names `missingEvidence[]` and how the swarm truth-gate returns `missingEvidence` instead of guessing. Command’s public face should be that rail, not the CEO/CFO/COO long-scroll.

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

- Network miss → shop → **statement / Z line** → owner → **due** wired into gated `/command-center` (the live long-scroll still has no left rail).
- Store-level Command URL (`/command-center/store/[id]` or hash pane).
- Command MCP tool.
- Wired Thanx / Marqii / Looker / EONR (scaffolds in `agents/`, not Command UI).
- `never86-command-center-v2` and `taco-bamba-command-center` as GitHub repos (see §6).

**Now on this branch (static, sample only):** `public/demo/command.html` — the LLM rock + left-rail missing chips. Not wired to ops DB. Not Bamba.

---

## 3. Intended drill-down — operator language

Tell it like an LLM close, not like a BI tool.

0. **Plug.** One box. Paste or drop. No account for the sample desk.
1. **Left rail names the hole.** “You’re missing last night’s Z.” “You’re missing the DoorDash statement — fees stay Estimated.” “You’re missing the void reason log.” “No count → no food cost.” Each chip is a coach, not a status widget.
2. **Network miss.** After a Z lands: the group number that is off. One miss. Ranked. Source-tagged.
3. **Shop.** Which unit is carrying it. Compare to the network’s own median — not a national benchmark you don’t have.
4. **Statement / Z line.** The actual line. If it isn’t on a Z or a statement, the chip stays Missing and the rail asks for it.
5. **Owner.** Store GM / Area / COO from `coachCards.ts`. LLM ranks. Human sends.
6. **Due + proof.** Tonight / this week / next period. Verbal yes does not close. The next missing chip *is* the proof object.

**1P–3P is already one miss type, not the whole product.** `/audit` is the Google door. Command’s left rail should *pull* the same statement: “Fees are Estimated — drop the finalized payout.”

**What the operator should hear in a demo**

> “SaaS wanted a six-week onboard. You drop last night. The left side already said the Z was missing. Now it wants the void reasons. You own tonight. We don’t invent the save. We don’t mail anyone. One seat is free. That’s Never 86'd.”

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
| `public/demo/command.html` | LLM-style Command try-it: composer + left-rail missing chips. Sample only. |

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

**Shipped on this branch (static HTML):** `public/demo/command.html`

That *is* the smallest Command try-it: one plug box + left-rail missing chips. Sample Downtown voids / 1P% / 3P fee range come from the same fictional 5-unit pizza numbers already on `/demo/3p-fee-finder` (`demoData.ts`). Count chip refuses to invent food cost.

**Next slice on `main` (when you want it live next to `/audit`):**

1. Move this rail to `/demo/command` in the full app (noindex, sample banner).
2. Drive chips from `actionShift.missingEvidence` + source-tag registry — not hardcoded copy.
3. Then, only then, put the same left rail on gated `/command-center` so the long-scroll dies as the first impression.

The suck-in order (safe):

1. Missing Z → plug Z → Verified sample miss (shop + line + owner + due).
2. Missing void reason log → still no verdict.
3. Missing DoorDash statement → 3P revenue Verified, fees Estimated.
4. Missing count → food cost stays Missing. Stop.

---

## 8. Command drill-down one-pager outline (sales)

Sections only. No dollars invented in the room.

1. **Promise.** Find the leak. Assign the fix. Keep the receipt. Same loop as Action Shift; Command is the group seat.
2. **Who it’s for.** First: the independent owner SaaS priced out (under another $299 tool). One free seat. Then: the same desk at 3–50 shops. Not a 200-unit BI replacement. Not “we forgot the little guy.”
3. **What it is not.** Another dashboard. Not R365. Not Voosh portal login. Not a fee calculator.
4. **The rock.** One drop box, like every LLM. Left rail chips say “you’re missing this.” That chip is the next paste.
5. **The ladder.** Miss → shop → line → owner → due. Demo on sample data first (`/demo/command.html`).
6. **1P–3P as one miss type.** Mix from POS is Verified. Take-rate dollars are Estimated until the statement or written rate card is in. `/audit` remains the Google door for one statement.
7. **Honesty pills.** Verified / Estimated / Unverified / Missing. Incomplete week stays Open.
8. **What we will not say.** Guaranteed recovery. Named thieves. Bamba or CTAP private figures. “We saved you $X” without a proof object.
9. **Proof of method.** `/audit` + `/demo/command.html` (this branch) + `/demo/3p-fee-finder`. Gated Command stays gated.
10. **Seat math.** One location + one seat free. Extra shops / seats paid.
11. **Ask.** Plug the sample Z. Watch the left rail ask for the void log. That’s the product.

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

“SaaS forgot the owner who won’t pay $299 and six weeks of onboarding. Never 86'd is that owner’s brand. One seat free. It feels like ChatGPT because that’s what they’re already being trained on. You drop last night. The left side names the hole. You get one win tonight. Command is the same desk when you have more shops. We never invent food cost. We never mail anyone for you.”

---

## 10. Pointers

- Issue #175 — Command Center Next 10 Moves (move 10 = multi-unit desk).
- Issue #122 — GTM / SEO (3P answers + OS pages; do not duplicate the command-center answer).
- Live answer: `/answers/restaurant-command-center-without-another-dashboard`
- ChatGPT Action Shift site (401 sign-in): `https://action-shift-operator.never86-d-9722.chatgpt.site/`
- Swarm PR #174 — CSV-first, no send.
- This file: `docs/COMMAND_DRILLDOWN.md`
- LLM-style try-it (this branch): `public/demo/command.html`
