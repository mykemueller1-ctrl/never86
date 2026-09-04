# Space pains: onboard / integration — and our answer (POS email first)

**For:** Myke + product  
**Date:** 2026-09-04  
**Method note:** Live Reddit/API scrape from this VM is **blocked (403 / Cloudflare)**. Pain map below is built from (1) Myke dictation, (2) secondary sources that quote **r/restaurateur** / **r/Bookkeeping** threads by permalink, (3) operator-review roundups (G2/Capterra patterns), (4) vendor onboard docs we already pulled. Tag every claim.

**Product lock (Myke):** We do **not** integrate day one. We find where the **POS emails the reports** (or they photo / download to Drive). We do the hard work. API later = convenience, not the price of entry.

---

## 1. Pain clusters (what operators actually complain about)

### A. “Integration theater” — the big one

| Pain | What they feel | Source tag | Our counter |
|---|---|---|---|
| **API / POS connect is the gate** | Can’t start until Toast/Square “partner integration,” agent install, waitlist, $50 Toast RMS fee | ME Toast FAQ Verified; MarketMan Toast 4–6 weeks Verified | **No gate.** Ask: “Where does Toast email the daily sales / labor report?” Photo or forward that. |
| **Integration never finishes** | Years on a tool, POS sync still broken → manual CSV forever | MarketMan review roundups (Community) | We *start* as CSV/email/photo — same end state without the broken promise |
| **Toast tax on integrations** | +$50/loc/mo Restaurant Management Suite just to let ME talk to Toast | ME pricing FAQ Verified | Export/email path: **$0** passthrough |
| **API breaks / sync lag** | “Connected” but numbers wrong or late; owner is the bridge | Operator essays on fragmentation (space) | Truth-gate: Missing / Partial / Unverified — never fake a sync |

**LLM ask (Myke + pain):**  
> Integration can wait. Where does your POS email the nightly reports — sales, labor, voids? Forward one, or take a picture of that email / download. We’ll do the hard work.

### B. Recipe / SKU / UOM hell (why they abandon inventory tools)

| Pain | What they feel | Source tag | Our counter |
|---|---|---|---|
| **Weeks building the database** | Manual ingredient library before any value | Inventory abandon narrative (LinkedIn/COGS-Well); MarketMan “hundreds of hours” cited from Reddit operators (Community via Food AI Daily) | Menu **picture** + one invoice. Top plates only. “Recipes suck — we figure the chaos.” |
| **Substitute items / new SKUs forever** | Ongoing maintenance, not a one-time setup | Same | Memory Curator on *approved* mappings only; Missing until invoice |
| **UOM / pack / pour mismatch** | Buy cases, cook ounces, pour “1.5” assumed wrong | R365 Toast AvT writeups; ME recipe conversions | Ask house pour; never invent 1.5 |
| **Modifiers break theoretical food cost** | Toast modifiers lost in R365 → AvT garbage | R&R FMG R365/Toast case (operator group) | Don’t claim food cost without count + recipe evidence |

### C. R365 / enterprise onboard tax (ICP 1–5 gets crushed)

| Pain | Quote / signal | Source tag | Our counter |
|---|---|---|---|
| **Price vs size** | ~$10,876/yr for **two** locations — operators: “colossal waste”; “POS + QB does most” | Food AI Daily citing [r/restaurateur 1ddodi7](https://reddit.com/r/restaurateur/comments/1ddodi7/) (Community) | Seat 1 free; Charter $199 |
| **Staff job = babysit software** | “Someone in our office whose job is about **60% managing R365**” | Same thread (Community) | No Implementation Manager homework |
| **Auto-renew trap** | Locked paying remaining year after wanting cancel | Same thread (Community) | Free seat / Charter 30-day refund (live pricing) |
| **60–90+ day implement** | COA, POS map, weekly coach, 2–5 hrs/week homework | R365 docs + partner writeups | 60-second labeled win from a file |
| **Wrong size tool** | Accountants in-thread: real value at **5+ locs / ~$10M+** | Same (Community) | Action Shift is Track A for 1–5 |

### D. MarginEdge / MarketMan discipline tax

| Pain | Signal | Source tag | Our counter |
|---|---|---|---|
| **Pay for bad data** | Bookkeepers: clients buy ME, managers don’t upload invoices / update recipes → useless $350/mo | [r/Bookkeeping](https://reddit.com/r/Bookkeeping/comments/1pnq0mf/) cited by Food AI Daily (Community) | One next action + night **proof**; Missing chips stay visible |
| **Recipe setup still heavy** | ME complaints center on recipe time even when invoice path is loved | G2 pattern via roundups (Community) | Progressive Wave 4 — menu photo, not 200 recipes |
| **MarketMan invoice OCR flaky** | “Scanning didn’t work 50% of the time” | G2 via Food AI Daily (Community) | Photo/PDF + human-approve memory; honesty labels |
| **Must maintain daily** | Gaps in invoices = gaps in P&L | Vendor + accountant commentary | Incomplete week stays Open |

### E. Fragmented data / another dashboard

| Pain | Signal | Source tag | Our counter |
|---|---|---|---|
| **Labor island vs sales island** | 7shifts vs POS; owner is the CSV bridge | Space essays (Unverified as census; real pattern) | Schedule **picture** after close → labor cards from *their* grid |
| **Five reports, no truth** | POS ≠ delivery statement ≠ bank | Operator LinkedIn / space | Evidence ladder; POS ≠ payout |
| **Another dashboard** | “Visibility” without a next action | Issue #122 + Myke | One chat, one action, night proof |

### F. Labor (Myke priority)

| Pain | Signal | Our counter |
|---|---|---|
| Labor % drift, too many on floor | Industry #1 controllable bleed (Myke + 7shifts category) | After first close action: **picture of schedules** → headcount → punches later |
| Schedule tools want full HR/OT/EIN setup first | 7shifts account structure | We take the week they already posted — no EIN |

### G. Cash / 3P (Google door)

| Pain | Signal | Our counter |
|---|---|---|
| DoorDash fees / payout mystery | Issue #122 ICP Google queries | `/audit` statement paste — no portal |
| Portal password asks feel like theft risk | Voosh contrast in brand rules | Never ask portal logins |

---

## 2. Pin map — pain → capture → suck-in line

| # | Pain | Capture (day one) | Myke / LLM line |
|---|---|---|---|
| 1 | Fragmented / don’t know where to start | Pain triage | “Labor? Cash flow? Or tired of fragmented data? No worries — we got you.” |
| 2 | Integration wall | **POS report email / photo / Drive file** | “Forget the API for now. Where does the POS email sales and labor? Forward it or snap that email.” |
| 3 | Labor bleed | Schedule photo | “Picture of the schedules — how many are on, is labor drifting?” |
| 4 | Role chaos | Labor cards / shift-role | “Labor cards, or shift/role specific?” |
| 5 | Vendor / invoice chaos | Sysco/Performance cadence + invoice email | “Performance, Sysco — how many times a week? Locals? Do they email the invoice — where?” |
| 6 | SKU / recipe hell | Menu photo + one invoice | “Picture of the menu — we show plate drift and cheaper house. Recipes suck; we handle the chaos.” |
| 7 | Paying for dead software | Proof loop | “Verbal yes doesn’t close it. Tonight’s proof is the next close / punch / invoice.” |
| 8 | 3P cash fog | Redacted statement | “Paste page 1. No portal password.” |

---

## 3. Capture ladder (locked)

```
Day 0–1 (no OAuth):
  1. Pain line
  2. Forward POS email report  OR  photo of report/email  OR  Drive/download CSV
  3. One Action Shift
  4. Photo of schedule
  5. Ask invoice email folder (Sysco/Performance)
  6. Photo of menu

Later (convenience only):
  - Watch that inbox / Drive folder
  - POS API / partner integration
  Never: portal passwords as the price of entry
```

**MCP alignment:** Load Day already prefers files the operator has; rollout says *manual upload / paste / photo / forwarded email are the launch path; APIs later.*

---

## 4. What we are *not* claiming

- We did not scrape live Reddit HTML this run (blocked). Quotes attributed via secondary citations — verify before putting on a public marketing page as Verified.  
- We do not claim “better than everyone.”  
- We do not claim integrations never matter — only that they are **not** the onboard.  
- We do not replace R365 GL or ME Bill Pay humans.

---

## 5. Source list

| Source | Use |
|---|---|
| Myke dictation 2026-09-04 | Canonical voice + POS email first |
| https://reddit.com/r/restaurateur/comments/1ddodi7/ | R365 price / overkill / babysit software (via Food AI Daily) |
| https://reddit.com/r/Bookkeeping/comments/1pnq0mf/ | ME useless without daily upload discipline |
| https://foodaidaily.com/blog/is-restaurant365-worth-it-small-restaurants/ | Thread synthesis |
| https://foodaidaily.com/blog/marketman-vs-marginedge-restaurant-inventory-software/ | Reddit/G2 setup hours + OCR pain |
| MarginEdge / R365 / 7shifts / MarketMan / xtraCHEF onboard docs | Checklist reality |
| R&R FMG Toast↔R365 AvT | Integration data quality hell |
| Never86 MCP `get_operator_system` rollout | Email/photo first |

---

## 6. Next product wire

1. Add **“Where does POS email the reports?”** as Wave 0.5 chip (before API ever appears).  
2. Accept: forwarded email · screenshot/photo · Drive link / CSV download.  
3. Remember inbox path as `inbox/source route` memory after approve.  
4. Public copy: “No integration required to start” — true; don’t say “we never integrate.”
