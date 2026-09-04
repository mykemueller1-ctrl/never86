# Onboard baseline → LLM suck-in question bank

**For:** Myke + product (Action Shift Load Day)  
**Date:** 2026-09-04  
**Job:** Steal the *information map* from MarginEdge / R365 / 7shifts / xtraCHEF / Ottimate / MarketMan / Toast — then ask it like a human LLM that **sucks them in** (one useful receipt) and **sucks tribal knowledge out** (one approved memory line).

**Rule:** We need their checklist. We do **not** copy their six-week CS call.  
**Safety:** Never ask portal passwords, bank routing/account, EIN/SSN, guest PII, or employee PII for “setup.” Share receipts, not logins.

---

## 0. How to use this

| Column | Meaning |
|---|---|
| **They ask** | What the vendor’s public onboard / prep guide actually requires |
| **We need?** | Yes = Action Shift / memory. Later = Command / paid seats. Never = we refuse |
| **Evidence unlock** | Which file makes this Verified vs keeps it Missing |
| **LLM suck-in** | Exact operator-voice ask after a win |

**Sources (this run):**  
MarginEdge `ob-overview` / `ob-phase-1` / `ob-phase-2` / `ob-phase-3` / `ob-inventory` / `ob-recipes` / `ob-billpay` / `ob-accounting` · R365 docs onboarding dashboard + Preparation for Operations · 7shifts KB first-30-days / account structure (SERP; KB 403 to bots) · Toast xtraCHEF setup checklist · Ottimate onboarding prep · MarketMan setup 101 · Toast business setup · Never86 MCP Load Day + proof-memory (`get_operator_system` v3.1.0).

---

## 1. Competitor checklists (compressed)

### MarginEdge — 90-day journey

| Phase | Their checklist | Timing they publish |
|---|---|---|
| **1 Get set up** | Connect POS · Connect accounting (QBO/etc.) · Send invoices (broadliner, up to 7 days back) · Invite team · Prep Bill Pay (bank) · Notification config | Week 1 |
| **2 Know your numbers** | New Item Review · Sales Forecasting · Controllable P&L · Budgets · Price Movers & Alerts · Purchase Report | Weeks 2–4 |
| **3 Unlock one module** | Inventory (2 counts, top ~20) **or** Recipes (top ~30, conversions/yields) **or** Accounting exports/mappings **or** Bill Pay (vendors, terms, statement recon) | Months 2–3 |

**Hidden info they extract from you:** product names, UOMs, categories, vendor items, count-sheet layout (walk-in/dry/bar), recipe types, plate/pour costs, GL mappings, remittance/payment terms.

### Restaurant365 — dashboard then coach

| Stage | Their checklist |
|---|---|
| **Onboarding Dashboard (required)** | Legal entities (name, address, EIN) · Locations (name, address, legal entity, timezone) · Fiscal + operational calendars · Start of business day (POS reset) · POS setup per location |
| **Optional early** | Vendor EDI (top 3 vendor contact + account) · Users |
| **Implementation homework** | Chart of accounts · Vendor lists · POS summaries · 2–4 hrs/week + 1-hr weekly call |
| **Ops Power User prep** | Order guides · Item # / description / pack size · Inventory count templates · Recipe book · POS button uniformity · Job codes · Pay rates · Vendor add/drop · POS change plans · ~5 hrs/week |

### 7shifts — first 30 days (structure before schedule)

| Phase | Their checklist |
|---|---|
| **Days 1–4** | Locations · Departments (FOH/BOH/Bar…) · Roles (Server, Line, Bartender…) · Address + timezone · Start-week-on day · Labor & compliance (OT daily/weekly, jurisdiction, breaks, minors, wages) · Connect POS · (optional) Employee onboarding add-on needs legal name + EIN |
| **Days 5–7** | Assign staff to depts/roles · Invites · Publish first schedule |
| **Days 8–30** | Payroll connection · Time tracking accuracy · Mobile adoption |

### xtraCHEF (Toast) — AP / invoice

| Checklist | Detail |
|---|---|
| Activate | Legal name, address, phone · Goals · Users · Accounting software · Locations |
| Unlock | Upload **10+ invoices** (they push 20 before next call) · Create purchase category · Categorize / map ≥1 item to GL · COGS groups · Sales setup for JE sync |

### Ottimate (ex–Plate IQ) — AP prep

| Prep | Detail |
|---|---|
| Roles | Executive sponsor · Project manager · Day-to-day users · Tech contact |
| Data | Entity list · Vendor list export · Chart of accounts · Dimension lists · ≥20 invoices · EDI vendor candidates (entity name, address, customer #) · Bank link review · Map current vs future invoice/payment workflow · 4–12 week cadence |

### MarketMan — items before recipes

| Setup | Detail |
|---|---|
| Items | Name, product code, price, UOM, unit qty, pack count, category (bulk or one-by-one) |
| Suppliers | Rep email/cell · CC emails · **delivery days + cutoff times** |
| Storage | Categories + storage areas |
| POS | Connect or upload sales · Map menu items → recipes/sub-recipes/preps |
| Reality | Toast notes **4–6 weeks** implementation; prep a printed/Excel ingredient list of daily buys |

### Toast POS — business + house setup (context, not our product)

FEIN · owners · bank · hours/services · service areas · jobs/employees · payments · menu. We **read** Toast exports; we do **not** become their POS onboard.

---

## 2. Unified information baseline (what every stack is really after)

Grouped by **family**. This is the master list the suck-in must eventually cover — not on day one.

### A. Store identity & clock (structure)

| Info | ME | R365 | 7s | xC/Ott | MM | We need? |
|---|---|---|---|---|---|---|
| Store / location name | ✓ | ✓ | ✓ | ✓ | ✓ | **Yes** |
| Address / timezone | | ✓ | ✓ | | | **Yes** (timezone + cutoff) |
| Legal entity / EIN | | ✓ | (onboarding add-on) | ✓ | | **Never** (not for free seat) |
| Fiscal / ops calendar | | ✓ | week-start | | | **Yes** — week start + business-day cutoff |
| Start of business day / POS reset | | ✓ | | | | **Yes** — memory: cutoff |
| Seats / users / roles | ✓ | ✓ | ✓ | ✓ | ✓ | Later (Seat 2/3 paid) |

### B. Sales / POS evidence

| Info | They | We need? | Unlock file |
|---|---|---|---|
| Nightly sales / close | ME POS sync, R365 POS, Toast | **Yes — first** | Prior-day POS close / Z / sales export |
| Voids / comps / discounts | implied in POS | **Yes** | Same close + void detail |
| 1P vs 3P mix | POS dining options | **Yes** | Close + (later) marketplace statement |
| Job codes / employee performance | R365 ops, Void Hunter | Pattern only | Employee-performance export — **no names as thieves** |

### C. Labor / schedule

| Info | They | We need? | Unlock file |
|---|---|---|---|
| Departments / stations | 7s | **Yes** — how *this* shop runs | Schedule paste |
| Roles / seats on the floor | 7s | **Yes** | Schedule |
| Posted in / out | 7s schedule | **Yes** | Schedule |
| Punches / OT rules / jurisdiction | 7s | Punches **Yes** for late drift; OT law **Later** | Time-clock CSV |
| Wages / payroll connection | 7s, R365 | Labor $ only with wage on file — else Estimated | Optional wage column |

### D. Purchasing / invoices / vendors

| Info | They | We need? | Unlock file |
|---|---|---|---|
| Vendor list | All AP/inventory | **Yes** | Invoices + tribal cadence |
| Delivery days / order days / cutoffs | MarketMan suppliers | **Yes — tribal core** | Load Day answer → memory |
| Invoice lines (SKU, qty, UOM, price) | ME, xC, Ott, MM, R365 | **Yes** for SKU drift | Invoice PDF/photo/CSV |
| Pack size / conversions | ME recipes, MM, R365 | **Yes** when costing | Invoice + operator confirm |
| Categories / GL / COA | ME, R365, xC, Ott | **Later** (not Seat 1 blocker) | Paid / accountant path |
| EDI / bill pay / bank | ME, Ott, R365 | **Never** for free seat | — |
| Remittance / payment terms | ME Bill Pay | **Never** free seat | — |

### E. Recipes / menu / beverage

| Info | They | We need? | Unlock file |
|---|---|---|---|
| Menu prices + what’s in the plate | ME recipes, MM, R365 | **Yes** | Menu paste / photo |
| Top ~30 recipes / yields | ME, MM | Progressive | Menu + invoice + ask |
| Pour standards (shot / wine / draft) | beverage tools | **Yes** per unit | `ask_pour_standards` — never invent 1.5 |
| Allergens / kitchen PIN device | ME | Later / Never | — |

### F. Inventory / counts

| Info | They | We need? | Unlock file |
|---|---|---|---|
| Count sheet layout (walk-in/dry/bar) | ME, R365 | When food-cost claimed | Count sheet |
| Two counts of same items | ME | Required for actual food cost | Two closed counts |
| Pars / storage areas | MM | Later | — |

### G. Marketplace / cash

| Info | They | We need? | Unlock file |
|---|---|---|---|
| DoorDash/UE/GH statement | (weak in ME/R365) | **Yes** — Google door | Redacted statement → `/audit` |
| Payout ID / bank deposit | recon tools | When claiming cash | Payout + bank — **no full account #** |
| Who owns cash / deposit | tribal | **Yes** | Load Day owner map |

### H. Targets & pain

| Info | They | We need? |
|---|---|---|
| Food / labor / prime targets | budgets (ME), goals (xC) | **Yes** — operator’s own only |
| Recurring money/time leak | kickoff goals | **Yes** — first Action Shift rank |

---

## 3. Never86 Load Day (already locked) → expand

MCP Load Day conversation (Verified):

1. Which trucks and vendors show up, and on what cadence?  
2. Which days do you order, separately from delivery days?  
3. Who owns cash, labor, food, service, and marketplace follow-up?  
4. Where do the nightly close, invoices, statements, schedules, and counts arrive?  
5. What recurring problem wastes the most manager time or money?

**Preferred baseline files:** last 4 closes · last 4 labor periods · same-period invoices · marketplace statements/payouts · current schedule · one count if food-cost asked.

**Allowed memory (MCP):** vendor cadence · order day · delivery day · owner · inbox/source route · POS category mapping · recipe/pack/yield · business-day cutoff · operator target · exception handling.

---

## 4. Suck-in order (game-fire sequence)

Do **not** dump the baseline. Earn each ask with a receipt.

```
0. DROP → prior-day close (or /audit statement)
1. WIN  → one labeled action (sales / voids / promos)
2. PILL → “void reasons still Missing — drop that export?”
3. PILL → “schedule unlocks labor cards — paste this week”
4. TRIBAL→ one owner or vendor question tied to the miss
5. APPROVE memory → show the line, human yes
6. LATER → menu → invoice → SKU drift → pours → count → 3P statement
```

**Hard stops (Missing Evidence, not fake numbers):**  
No count → no food cost. Invoice ≠ COGS. POS ≠ payout. Punch ≠ schedule. Incomplete week stays Open.

---

## 5. LLM suck-in question bank (operator voice)

Voice: short. Concrete. Iowa plain. After a win. One ask. Offer paste/photo/forward. Never “please complete your implementation worksheet.”

### Wave 0 — first box (no account)

| Trigger | LLM ask | Captures |
|---|---|---|
| Empty desk | “Drop last night’s close from the POS — sales summary is fine. No login needed.” | Sales family |
| DoorDash pain | “Got a redacted DoorDash statement? Paste page 1 — we’ll label the math in about a minute.” | 3P family |
| They type pain | “What’s burning cash or time this week — voids, labor, beef price, or DoorDash?” | Pain / rank |

### Wave 1 — after first close lands

| Missing chip | LLM ask | Memory candidate |
|---|---|---|
| Cutoff | “When does *your* business day roll — midnight, 3am, or whenever Toast resets?” | business-day cutoff |
| Owner cash | “Who walks the deposit / closes cash — you, GM, or closer?” | owner:cash |
| Void detail | “Close shows void dollars. Drop the void/comp detail export if you’ve got it — pattern only, no hangings.” | — |
| Proof | “Tonight’s proof is the next close. Verbal yes doesn’t close it.” | proof habit |

### Wave 2 — schedule / labor (7shifts map, our way)

| Missing | LLM ask | Captures |
|---|---|---|
| Schedule | “Paste this week’s schedule — who you *posted*, in and out. We don’t invent the week.” | stations, posted times |
| Stations | “How do *you* run the floor — dish / line / expo / FOH / run? Your words.” | tribal headcount shape |
| Punches | “Late drift stays Missing until punches. Got a time-clock CSV for yesterday?” | early/late OT |
| OT rules | “Do you flag OT after 8 daily, 40 weekly, or both?” | Later / Estimated |
| Labor owner | “Who owns labor tonight — you or the FOH lead?” | owner:labor |

### Wave 3 — vendors / invoices (ME + MarketMan map)

| Missing | LLM ask | Captures |
|---|---|---|
| Cadence | “Which trucks hit you which days — Sysco Tue/Fri, produce daily, linen Mon?” | vendor cadence |
| Order ≠ delivery | “Which days do you *order*, separate from when it shows up?” | order day |
| Cutoff | “What’s the order cutoff — noon for next-day truck?” | vendor exception |
| Source route | “Where do invoices land — email, folder, phone pics, or the office spike?” | inbox/source route |
| First invoice | “Drop one broadliner invoice (photo or PDF). We’ll pull SKU + pack + price — you confirm the weird UOMs.” | invoice lines |
| Food owner | “Who owns food cost follow-up — chef, you, or nobody yet?” | owner:food |
| Silence | “If a truck’s quiet past cadence, who do we draft the text to — never auto-send.” | owner + service draft |

### Wave 4 — menu / recipe / pour (ME recipes + MM, progressive)

| Missing | LLM ask | Captures |
|---|---|---|
| Menu | “Paste the menu — prices + what’s on the plate. Not a full recipe book yet.” | menu |
| Top movers | “Name your top 5 money plates. We’ll cost those first when the invoice’s in.” | recipe priority |
| Conversion | “You buy ground beef in cases — how do you portion it on the plate?” | pack/yield mapping |
| Pour | “What’s *this* bar’s shot — 1.5, 1.75, 2, or something else? We don’t assume.” | pour standards |
| SKU drift | “Beef moved on the last two invoices. Switch house or raise the plate — your call. We don’t invent the save.” | action + proof |

### Wave 5 — counts / food cost (ME inventory honesty)

| Missing | LLM ask | Captures |
|---|---|---|
| Count | “No count → no food cost. Got last period’s count sheet, even top 20?” | count |
| Layout | “Walk-in / dry / bar — how do *you* walk the count?” | storage tribal |
| Second count | “Food-cost math needs two counts of the same stuff. When’s the next one?” | baseline |

### Wave 6 — marketplace / bank (our door; they underweight this)

| Missing | LLM ask | Captures |
|---|---|---|
| Statement | “Fees stay Estimated until the finalized statement’s in. Drop it redacted.” | 3P composition |
| Payout | “POS ≠ payout. Got the payout ID week that matches the statement?” | recon ladder |
| Deposit | “Bank deposit amount/date only — not the full account number.” | cash receipt |
| 3P owner | “Who fights DoorDash — you, GM, or bookkeeper?” | owner:marketplace |

### Wave 7 — targets / exceptions

| Missing | LLM ask | Captures |
|---|---|---|
| Targets | “What’s *your* labor % target — not a textbook number?” | operator target |
| Food target | “Food target you actually manage to?” | operator target |
| Exception | “Any night we should ignore — holiday, catering blowout, remodel?” | exception handling |
| Service | “Missed truck, short count, fountain gun, HVAC — which burns you most?” | service category |

### Wave 8 — seats / multi-unit (Later — don’t open on Seat 1)

| Topic | LLM ask (only when they ask) |
|---|---|
| Seat 2 | “Want the GM on the same morning loop? That’s a paid seat — owner seat stays free.” |
| Store 2 | “Second store when you’re ready — same loop, ranked. Not a six-week rebuild.” |
| GL / Bill Pay | “We don’t replace your accountant’s GL or MarginEdge bill pay. We assign the next action.” |

---

## 6. “They ask / we refuse” (keep aunt + product honest)

| Their ask | Why they want it | Our stance |
|---|---|---|
| POS portal password / API key day 1 | Auto sales | **Refuse.** Export/paste first. API later convenience. |
| Accounting admin login | JE sync | **Later / accountant path** |
| Bank account for Bill Pay | AP product | **Never** on free seat |
| EIN / SSN / ownership % | Toast/legal, 7s tax forms | **Never** for Never86 Load Day |
| Full recipe book week 1 | Theoretical food cost | **Progressive** — top plates after invoice |
| Chart of accounts | R365 / Ottimate / xC | **Later** |
| EDI vendor customer numbers | Feeds | **Later** |
| Staff names as “thieves” | leak theater | **Never** — patterns only |

---

## 7. Coverage matrix — baseline → suck-in wave

| Baseline family | Primary competitor home | First suck-in wave | Seat 1? |
|---|---|---|---|
| Close / sales / voids | ME POS, Toast, R365 | 0–1 | Yes |
| Cutoff / week start | R365, 7s | 1 | Yes |
| Owners map | (tribal; weak in SaaS forms) | 1 + Load Day | Yes |
| Schedule / stations | 7s | 2 | Yes |
| Punches / OT | 7s | 2 | Yes when labor $ |
| Vendor cadence / order day | MarketMan, Load Day | 3 | Yes |
| Invoices / SKU / UOM | ME, xC, Ott, MM | 3–4 | Yes progressive |
| Menu / recipe / pour | ME, MM | 4 | Yes progressive |
| Counts | ME, R365 | 5 | Only if food-cost claimed |
| 3P statement / payout | Never86 door | 0 or 6 | Yes |
| GL / COA / Bill Pay / EDI | R365, ME, Ott | 8 | No |
| Legal / EIN / bank | Toast, R365, 7s HR | — | Never |

---

## 8. One-screen demo script (use this)

> “SaaS wanted POS connect, accounting connect, invoice flood, recipe book, two inventories, and a weekly coach call.  
> You drop last night’s close. Here’s one move.  
> Left side still wants: void detail → this week’s schedule → one invoice → who owns food.  
> Answer one. We remember it *after you approve*. We don’t take your portal password. One seat’s free.”

---

## 9. Open build list (product)

1. Encode Wave 0–7 as Action Shift pills with `Missing` chips.  
2. Memory Curator UI: show proposed line → Approve / Correct / Reject.  
3. Map each chip → exact export name per POS (Toast / Square / Clover / PDQ) from `pos-routing`.  
4. Keep Wave 8 off the free seat.  
5. Do not auto-mail vendors from silence tickets.

---

## 10. Source links

- https://www.marginedge.com/ob-overview  
- https://www.marginedge.com/ob-phase-1 · ob-phase-2 · ob-phase-3  
- https://www.marginedge.com/ob-inventory · ob-recipes · ob-billpay · ob-accounting  
- https://docs.restaurant365.com/docs/r365-onboarding  
- https://docs.restaurant365.com/docs/preparation-for-operations  
- https://kb.7shifts.com/hc/en-us/articles/4417519871763-Your-first-30-days-in-7shifts-What-to-expect-as-an-Admin  
- https://kb.7shifts.com/hc/en-us/articles/31052697436179-Build-Your-Account-Structure-to-Unlock-Scheduling  
- https://support.toasttab.com/en/article/xtraCHEF-Initial-Setup-Checklist  
- https://support.ottimate.com/support/solutions/articles/14000163672-ottimate-onboarding-prep-guide-a-checklist-for-success-  
- MarketMan setup 101 (Meal Ticket help) · Toast MarketMan integration (4–6 weeks)  
- Never86 MCP: `get_operator_system` · `get_operator_logic` domains `load-day`, `proof-memory`, `labor`, `invoices-daily-prime`, `pos-routing`
