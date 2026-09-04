# Accountant handoff — ICP onboard cost: SaaS vs Never 86'd gamified tribal capture

**For:** Aunt / accounting team (unit economics + operator cash cost)  
**From:** Operator OS pack (MCP v3.1.0) + public pricing + competitor public pages  
**Date:** 2026-09-04  
**Job:** Show why the 1–5 unit path is cheaper **at scale** — for the restaurant **and** for Never 86'd delivery cost.

---

## 0. How to read the dollars

| Tag | Meaning |
|---|---|
| **Verified** | Quoted from a primary public page or the Never86 MCP / live pricing page in this run. |
| **Community-reported** | Third-party / operator forums. Treat as a range, not a contract. |
| **Estimated** | Modeled from Verified bases × named assumptions. Say the assumption. |
| **Unverified** | Illustrative only — not a census, not a guarantee. |

Do **not** promise recovery dollars. Do **not** put Community Tap / private store numbers here. Do **not** say we already onboarded 100k shops.

---

## 1. Where we are (philosophy + product)

### Consumer = the small operator (ICP)

| Frame | Locked language | Tag |
|---|---|---|
| **Who** | Independent **1 store → ~5 units**. Hustler owner. Not a COO with a BI wall. | Founder ICP (`docs/COMMAND_DRILLDOWN.md`, `docs/TWO_TRACKS.md`) |
| **Public pricing page today** | Leads with **1–3 unit** Owner path | Verified — https://www.never86.ai/pricing |
| **What they hate** | Another $299+/mo tax + implementer + six-week onboard before a next action | Founder ICP |
| **Promise** | Find the leak. Assign the fix. Keep the receipt. | Verified — MCP `get_operator_system` |
| **Offer** | **One location + one owner seat free.** Extra seats / locations paid. | Verified — MCP + live site |
| **Desk name** | **Action Shift** (not “Command Center” for this buyer) | Locked in `docs/TWO_TRACKS.md` |
| **Google door** | `/audit` (3P statement in ~60s). Company is the OS, not a fee calculator. | Issue #122 |

### The “game-fire” way (gamified tribal capture)

Usual SaaS onboard = **big bang workshop**: discover vendors, map recipes, connect APIs, train staff, then maybe value.

Never 86'd onboard = **Load Day + suck-in**:

1. **60-second win** without login (paste / CSV / PDF / photo / forward).  
2. **One chat, one prompt** — yesterday’s close → one morning move → night proof.  
3. **Left rail names what’s Missing** (void reasons, schedule, menu, invoice…).  
4. **One evidence-triggered tribal question per loop** (not a 40-question survey).  
5. **Memory only after human approve** (vendor cadence, owners, mappings, pours, targets).  
6. **No portal passwords. No auto-mail.** LLM ranks; human sends.

That is how tribal knowledge enters the system: **piece by piece, paid for by usefulness**, not by an implementation invoice.

MCP Load Day output (Verified): *source map, approved store rules, first Action Shift, missing-evidence list, owner map.*

---

## 2. What usual companies charge the restaurant

### A. Subscription (cash out the door)

| Product | Published / reported price | Tag | Source |
|---|---|---|---|
| **MarginEdge** | **$350 / location / mo** (≈$315/mo if annual, 12-mo commit) | Verified | https://www.marginedge.com/pricing/ |
| **MarginEdge + Freepour** | **$500 / location / mo** | Verified | same |
| **Toast API pass-through** (if Toast + ME) | **+$50 / location / mo** Restaurant Management Suite | Verified (ME FAQ) | MarginEdge pricing FAQ |
| **MarketMan** | ~**$239–$299+ / location / mo** + **~$500 onboarding fee** | Community / vendor FAQ | MarketMan + inventory cost roundups |
| **Restaurant365** | Quote-only; listings often **~$435–$749 / location / mo**; implementation often **$2k–$10k+** (partners cite **$25k–$30k** white-glove for ~15 units) | Community-reported | R365 pricing page (no numbers) + operator/partner writeups |

### B. Onboarding / implementation (the hidden first-year line)

| Vendor pattern | What the restaurant pays | Time before useful loop | Tag |
|---|---|---|---|
| **MarginEdge** | No “setup fee”; **paid onboarding packages** for 1–4 locs (prices not public); bespoke for 5+ | Days → weeks depending on package + recipe/invoice hygiene | Verified structure; $ amounts Unverified |
| **MarketMan** | ~$500 onboard + **2–4 weeks** recipe/ingredient library work | 2–4 weeks before food-cost reporting is meaningful | Community / vendor FAQ |
| **R365** | Separate professional services; weeks → **months** for multi-unit | 3–6 months cited for 5-unit migrations | Community-reported |

### C. Soft cost (owner / GM hours — always Estimated)

Assumption used below: **owner opportunity cost = $50 / hour** (label it; swap to your loaded rate).

| Path | Hours before first trusted daily loop | Soft $ @ $50/hr | Tag |
|---|---|---|---|
| Full back-office SaaS (recipes + invoices + POS map) | **40–80 hrs** over 4–8 weeks | **$2,000–$4,000** | Estimated |
| Light invoice tool with CS calls | **15–30 hrs** | **$750–$1,500** | Estimated |
| Never 86'd Action Shift free seat | **≤1 hr** to first labeled action (often minutes) + **~5 min/day** tribal/file suck-in | **~$50 first day**; **~$100–150 / mo** habit | Estimated |

---

## 3. Never 86'd published price (operator cash)

From https://www.never86.ai/pricing (Verified this run):

| Tier | Price | Who | Onboard method |
|---|---|---|---|
| **Action Shift · Beta** | **$0** — Seat 1 (owner), one store | 1–3 unit independents (public page); founder story still **through ~5** | Email / upload — **no POS API key required** |
| **Owner (Charter)** | **$199 / mo** — first 100 operators, 30-day refund | Same ICP when they want seats 2–3 + deeper history | Same file path |
| **Command** | **$499 / location / mo** | Multi-unit track (separate product) | Dedicated call with Myke |
| **Enterprise** | Custom | 10+ / multi-brand | Scoped |

**Seat math (Verified):** Seat 1 owner free for one store. Seats 2–3 (GM / station) and extra stores = paid expansion.

---

## 4. Side-by-side — one location, year one

### Operator cash + soft cost (illustrative)

Assumptions (Estimated): ME onboarding package midpoint **$1,250** (range often cited $750–$2,000 in secondary writeups — **not on ME public page**); owner hours as in §2C; Toast +$50 only if applicable.

| Line | MarginEdge-style | R365-style (single loc) | Never 86'd free seat → Charter |
|---|---|---|---|
| Software (12 mo) | **$4,200** ($350×12) Verified | **~$5,200–$9,000** Community | **$0** beta, or **$199×12 = $2,388** Charter Verified |
| Vendor onboard / PS | **$750–$2,000+** Unverified $ | **$2,000–$10,000+** Community | **$0** Verified (email/upload) |
| Toast API (if Toast) | **+$600/yr** Verified FAQ | varies | **$0** (CSV/export path) |
| Soft cost (owner hrs) | **$2,000–$4,000** Est. | **$3,000–$6,000** Est. | **~$50–$1,800** Est. (first win + light daily) |
| **Year-1 all-in (1 loc)** | **~$7k–$11k** Est. | **~$10k–$25k** Est. | **~$50–$4.2k** Est. (free→Charter) |

**Delta vs MarginEdge cash subscription alone:** free seat saves **$4,200/yr** Verified. Charter at $199 saves **$151/mo ($1,812/yr)** vs $350 Verified.

### What you are *not* buying with the free seat

Be honest with the aunt team: MarginEdge includes heavy invoice processing + US bill pay humans. Never 86'd Seat 1 is the **operator job** (yesterday → one action → night proof; voids, labor spawn, vendors, 3P, shift) — **not** a full AP/GL replacement. We are **not** R365’s GL. Invoice ≠ COGS. No count → no food cost.

---

## 5. Scale math — why *our* way stays cheap

### A. Restaurant side (1–5 units paying the usual tax)

| Units | ME @ $350/loc/mo (Verified) | Soft onboard Est. ($3k/loc once) | Never86 Seat 1 free | Charter $199 (1 login, ≤3 locs on Owner plan) |
|---|---|---|---|---|
| 1 | $4,200/yr | +$3,000 | $0 | $2,388/yr |
| 3 | $12,600/yr | +$9,000 | $0 (1 free seat / 1 store; extra stores paid) | $2,388/yr Owner plan* |
| 5 | $21,000/yr | +$15,000 | Free only for **one** store seat; extras paid | Moves toward Command $499/loc if multi-unit desk |

\*Owner plan is published for **1–3 location independents** at $199/mo — not “$199 × locations.” Extra seats/stores are paid expansion; model seat 2/3 prices when you lock them.

### B. Never 86'd company delivery cost (the aunt-team slide)

This is the scale argument: **usual SaaS grows CS headcount with customers. We grow file-ingestion + memory approvals.**

| Onboard model | Human touch per new store | Cost driver | At 100 stores | At 1,000 stores |
|---|---|---|---|---|
| **Classic SaaS** | 10–40 CS / implementer hours + training calls | People | **1,000–4,000 hrs** ≈ **$75k–$360k** @ $75/hr loaded Est. | **10k–40k hrs** ≈ **$0.75M–$3.6M** Est. |
| **Gamified tribal (ours)** | Automated Load Day questions + missing-file pills; human only for **approve memory / outbound** | LLM + sparse founder/ops review | **~50–150 human hrs** Est. (approvals, edge cases) | **~300–800 human hrs** Est. if approval UX holds |

**Named assumptions (Estimated):**  
- Classic: 15 hrs median CS touch × $75 loaded.  
- Ours: average **0.5–1.5 human hours** per store in first 90 days (approvals + stuck files), not 15.  
- Compute/LLM cost exists but is **orders of magnitude below** a CS team; keep it as a separate OpEx line when you have invoices — do not invent it here.

**Ratio to show:** if classic costs **~$1,125** CS delivery per store (15×$75) and ours costs **~$75** (1×$75), delivery is **~15× cheaper** at the same volume — **before** counting that the restaurant also paid $0 for Seat 1.

---

## 6. What “tribal knowledge” we capture (and when it becomes an asset)

From MCP `get_operator_system` / `proof-memory` (Verified allowed memory):

- Vendor cadence · order day · delivery day  
- Who owns cash / labor / food / service / marketplace  
- Inbox / source route for close, invoices, statements, schedules, counts  
- POS category mapping · recipe/pack/yield · business-day cutoff · operator targets · exceptions  

**Rules that keep the accountant safe:**

- Model guess ≠ memory.  
- Store-scoped only — never promote one shop into a universal rule.  
- Verbal yes ≠ verified action.  
- Incomplete week stays Open.

That memory is the **moat asset** built without a six-week PS invoice.

---

## 7. One-page talk track for the aunt team

1. **Buyer:** burnt 1–5 unit owner. Won’t fund another implementer.  
2. **Usual stack:** $350+/loc/mo (ME Verified) or heavier R365; weeks of setup; owner hours on top.  
3. **Our wedge:** Seat 1 free; 60s labeled proof; Action Shift gamifies the *next* file and *one* tribal question.  
4. **Restaurant year-1:** thousands less cash + soft cost (table §4).  
5. **Our scale:** CS hours stay flat-ish; classic SaaS CS hours grow ~linear with logos (table §5B).  
6. **Honest limit:** not their GL; not bill-pay humans; not guaranteed recovery. Extra seats/locations pay the company.

---

## 8. Sources used this run

| Source | What we took |
|---|---|
| MCP `get_operator_system`, `get_operator_logic` (load-day, action-shift, evidence, proof-memory, safety) | Loop, Load Day, tribal memory rules |
| MCP `get_3p_audit_logic`, `list_free_agents`, `list_answers` | Door / agents context (not the cost core) |
| https://www.never86.ai/pricing | Free seat, $199 Charter, $499 Command |
| https://www.marginedge.com/pricing/ | $350 / $500, onboard packages structure, Toast +$50 |
| `docs/COMMAND_DRILLDOWN.md`, `docs/TWO_TRACKS.md`, issue #122 | ICP philosophy, Action Shift vs Command |
| Third-party roundups (DishCost, RestaurantTools, inventory cost blogs, partner R365 writeups) | Onboarding $ ranges, R365 community prices — **Community-reported** |

---

## 9. Open items for the accountant workbook

1. Lock **Seat 2 / Seat 3 / extra-location** published dollars when ready (today: “paid expansion”).  
2. Replace soft-cost **$50/hr** with your loaded owner/GM rate.  
3. Replace CS **$75/hr** with actual Never86 ops loaded cost when payroll exists.  
4. Add real LLM/infra $ per active seat from invoices (leave blank until Verified).  
5. Keep Charter **first 100** scarcity explicit in any forecast.

**Bottom line:** Usual companies sell a **paid integration project**. We sell a **free owner seat that earns the next file**. Same tribal knowledge; different cost curve — cheaper for the ICP, and cheaper for us at volume.
