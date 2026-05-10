# CTAP People Platform — Master Operations Notes

> **Community Tap & Pizza** | Storm Lake, Iowa  
> **Platform:** Never 86'd — Gamified Workforce Management  
> **Last Updated:** May 5, 2026

---

## 1. Platform Overview

The CTAP People Platform is a full-stack restaurant workforce management system built for Community Tap & Pizza. It combines gamified shift management, AI-powered knowledge retrieval, sales intelligence, food cost tracking, and scheduling into a single mobile-first PWA.

**Stack:** React 19 + Tailwind 4 + Express + tRPC 11 + Drizzle ORM + TiDB (MySQL)  
**Design:** "Shift-Ready Industrial" — OLED black, amber accent, Bebas Neue / DM Sans / DM Mono typography  
**Auth:** Manus OAuth (owner/admin) + PIN login (staff) + Email/Password + Facebook OAuth  
**Hosting:** Manus platform with custom domain support

---

## 2. Staff & Roles

| Role | People |
|------|--------|
| Owners | Mychael Mueller, Sally Hart |
| Key Manager | Gavin Thomas |
| Kitchen Manager | Moe Thomas, Tom Dorothy |
| Kitchen Key | Che, Steven Klein |
| Bar Manager | Ashley Holding |
| Bar Staff | Jessica Gailey, Karlee Sturtz, + others |
| Drivers | Multiple (EOD report system) |
| Kitchen Line | Brodey Laughman, Max George, Dustin Stein, Doc, Ben Mason, Kyler Preston, + others |

**Total Staff:** 41 employees across 7 departments (bar, dining_room, kitchen_line, pizza_side, driver, dishwasher, management)

---

## 3. Departments (7 Real Stations)

1. **Bar** — bartenders, bar closing, tab management, liquor ordering
2. **Dining Room** — servers, hosts, steps of service, upselling
3. **Kitchen Line** — grill, fry, prep, plating
4. **Pizza Side** — dough, sauce, oven, cut
5. **Driver** — delivery, cash handling, EOD reports
6. **Dishwasher** — dish machine, 3-sink method, sanitation
7. **Management** — scheduling, P&L, vendor relations, compliance

---

## 4. Key Features Built

### Staff Experience
- PIN login with brute-force protection (5 attempts / 15 min lockout)
- Email/password + Facebook OAuth login options
- Gamified points, streaks, achievements (12 types), rewards shop (6 tiers)
- Role-aware home screen (bartender sees bar tasks, driver sees EOD, manager sees command center)
- Daily briefing with yesterday's recap, 86'd items, specials, issues
- Checklists by department (bar closing, kitchen closing, pizza side, opening, driver EOD)
- Leaderboard with gold/silver/bronze, KEY badges, streak badges
- Clock in/out with break tracking, weekly hours, overtime alerts
- Schedule view (my shifts, time-off requests, shift swaps)
- PWA installable (offline caching, service worker)

### Manager/Owner Intelligence
- Command Center with 10 intelligence buckets
- Sales Intelligence: daily trends, weekly aggregation, channel breakdown, labor %, product mix
- Z-Report upload (PDF → AI parsing → database)
- Forecast engine: weather correlation, event impact, ML prediction (DOW seasonality + linear regression)
- Hourly sales heatmap (DOW × Hour grid, 3,104 records)
- Void/comp anomaly detection (4,954 records, 59 anomalies flagged)
- Schedule Builder (weekly grid, position-based)
- Management briefings (role-based: Mychael/Ashley/Tom)
- Security records (events, lockouts, PIN changes)
- Worker profiles (training, evaluations, write-ups, career advancement)

### Food Cost & Vendor Intelligence
- Recipe costing (10 recipes, 42 ingredients, cost per plate)
- SKU tracker (55 SKUs with price history)
- Cross-vendor price comparison
- Invoice OCR (photo → LLM → auto-fill vendor/total/items)
- Price change alerts (5%+ moves flagged)
- Par level suggestions
- Order guides (Tom's food / Ashley's bar)
- 78 vendor products seeded (PFG, Sysco, Hughes, Fort Dodge, Sawyer's)

### Knowledge Brain (Ask AI)
- 389+ knowledge entries across 9 stations, 10 categories
- Station-aware, time-aware, confidence-scored answers
- Covers: recipes, SOPs, POS operations, vendor info, jargon, equipment, compliance, hospitality
- Knowledge correction workflow (staff submit → manager approve)
- Photo missions for gamified knowledge capture

### Communication
- Station broadcasts (86'd alerts with acknowledge/resolve)
- Shift handoff notes (outgoing → AI categorizes → incoming reads)
- Smart notification batching (critical = instant, low = batched)
- Owner notifications via Manus platform

---

## 5. Vendor Contacts

| Vendor | Category | Notes |
|--------|----------|-------|
| PFG (Performance Foodservice) | Food distributor | Account 06528, rep Steve, order Mon/Thu |
| Sysco | Food distributor | Sysco Shop app, Perks points, Sysco Brand 15-20% cheaper |
| Hughes Distributing | Beer/beverage | Local Fort Dodge |
| Fort Dodge Distributing | Beer/beverage | Local |
| Sawyer's Meats | Protein | Local butcher |
| Hy-Vee Wine & Spirits | Liquor/beer | Iowa ABD pricing |
| Pepsi/PepsiCo | Fountain/BIB | Local Eats program, $0.65/gal rebate |
| Budweiser/DMB | Beer | Draft + package |
| Gailey HVAC | Equipment service | Local |
| Green Amusement | Games/entertainment | Local |

---

## 6. Master Bar + Staff Rules (Effective Dec 7, 2025)

### Bar Service Rules
1. **Tickets First** — Every drink must have a printed ticket first. No ticket = no drink.
2. **Tabs Before Serving** — All tabs started in POS before serving. No "I'll get to it later."
3. **Credit Card for Tabs** — Suggest CC on all tabs. No holding bills. Guest responsible for their tab.

### Discounts / Coupons / Gift Cards
4. **No Double Discounts** — One discount per item/order. Cannot stack coupon + special.
5. **Coupons Ended** — No more $5 off St. Paul gift cards. Paper mail-out coupons DONE. All coupons ended Dec 30.

### Bar Till / Cash Drawer Rules (MOST IMPORTANT)
6. **New Bar Till Setup** — Till always stays closed. No tips in till. Contains only $500 bank + system cash. Period.
7. **Drawer Opens ONLY Through POS** — POS button logs every open. No zero-sales opens. Ever.
8. **Drops — Only Correct Cash** — Drop only what POS says + your bank. Overages belong to CTAP.
9. **Promos/Voids Must Be Spindled** — All promos and voids printed and spindled. No exceptions.
10. **Zero-Tolerance Till Policy** — If you're in the till without an actual sale/transaction: you will be terminated.

### Tip Handling
11. **"Tip Problem" Note** — Ashley and Karlee working on solutions. Until new process from management: this is it. Don't ask about it.

### Staff Conduct
12. **Vaping/Smoking** — No vaping anywhere inside. Absolutely NO near dishwashing area. Outside only, on break, away from doors/customers.
13. **Drinking on the Clock** — No alcohol while on the clock. No shift drinks, no tasting, no drinks behind bar. Only after shift is over and clocked out.

---

## 7. Iowa Compliance Summary

- **Food Safety:** ServSafe/CFPM required, Iowa Dept of Inspections, critical violations = immediate closure risk
- **Liquor License:** Class C (beer/wine/liquor), dramshop liability $250K cap, no sales to minors/intoxicated
- **Labor Law:** $7.25 min wage, $4.35 tipped wage, no mandatory breaks for 18+, youth restrictions (14-15 limited hours)
- **Workers Comp:** Required for all employers, $1,000/day penalty for non-compliance
- **Full reference:** IOWA_RESTAURANT_COMPLIANCE_REFERENCE.md

---

## 8. Cost Targets & Benchmarks

| Metric | Target | Industry Avg |
|--------|--------|-------------|
| Food Cost % | 30.3% | 28-35% |
| Beer Cost % | 28.5% | 25-30% |
| Liquor Cost % | 23.7% | 18-24% |
| Prime Cost (Food + Labor) | <65% | 60-65% |
| Labor Cost % | 25-35% | 25-35% |
| Pour Cost (bar) | 18-24% | 18-24% |

---

## 9. Scheduled Tasks

| Task | Schedule | Endpoint |
|------|----------|----------|
| Daily Briefing | 6:00 AM CDT | POST /api/scheduled/briefing |
| EOD Digest | 10:30 PM CDT | POST /api/scheduled/eod-digest |
| Z-Report Reminder | 7:30 AM CDT | POST /api/scheduled/zreport-reminder (pending) |
| Schedule Sync | On demand | POST /api/scheduled/sync-schedule |
| Auto-Archive | On demand | POST /api/scheduled/auto-archive |
| Payout Digest | On demand | POST /api/scheduled/payout-digest |

---

## 10. Security Architecture

- **4 Access Levels:** Public → Staff Session → Protected (Manus OAuth) → Admin
- **PIN Protection:** 5 attempts / 15 min, lockout notification to owner
- **Session:** 8-hour staff JWT, 30-min Manus OAuth
- **Input Validation:** Zod schemas on all endpoints, max length limits, SQL injection prevented by Drizzle ORM
- **AI Guardrails:** ChatML injection blocked, 500 char limit, staff session required
- **Full matrix:** SECURITY_GATES.md

---

## 11. Design System

- **Theme:** "Shift-Ready Industrial" — OLED black (#000000), zinc surfaces (#18181B), amber accent (#F59E0B)
- **Typography:** Bebas Neue (headers/display), DM Sans (body), DM Mono (data/timestamps)
- **Layout:** Full-bleed vertical card stack, bottom nav (4 icons max), no sidebar
- **Signature:** Amber left-stripe on active cards ("tap handle" motif), role badges, chunky progress bars
- **Interactions:** One-tap actions, swipe to dismiss, hold to confirm, bottom-anchored CTAs
- **Accessibility:** High contrast for dim bar/kitchen lighting, large touch targets for wet/greasy hands

---

## 12. Data Sources

| Source | Data | Records |
|--------|------|---------|
| PDQ POS Z-Reports (Gmail) | Daily sales, labor, voids, channels | 196 days |
| PDQ POS Hourly Reports | Hourly sales by channel | 3,104 records |
| PDQ POS Product Mix | Item-level sales | 8,939 records (1,069 products) |
| PDQ POS Void/Promo | Comp and void transactions | 4,954 records |
| Google Sheets (Bar Schedule) | Staff shifts | 55 shifts seeded |
| Google Sheets (Kitchen Schedule) | Staff shifts | Integrated |
| CommunityPizzaNEWBUILDMenuList.xlsx | Menu items | 172 items |
| CTAP_Team_Operations_Packet | Cost targets, SOPs | Integrated |
| Iowa ABD | Liquor pricing | Integrated |
| Weather API | Fort Dodge weather | 202 days |

---

## 13. GitHub & Deployment

- **Repo:** mykemueller1-ctrl/Never-86d (private)
- **Hosting:** Manus platform (built-in)
- **Database:** TiDB (MySQL-compatible, cloud)
- **File Storage:** S3 via Manus storage helpers
- **Tests:** 218 tests across 17 test files (all passing)

---

## 14. Research Files (Archived)

These files contain detailed research that has been incorporated into the platform:

- `research-notes.md` — Vendor programs (PFG, Sysco, Pepsi), BBQ mastery, fryer/grill/pizza techniques, cocktail recipes, hospitality training, beer/liquor identification
- `research-restaurant-accounting.md` — QuickBooks for restaurants, food cost formulas, P&L structure, inventory management, prime cost analysis
- `IOWA_RESTAURANT_COMPLIANCE_REFERENCE.md` — Full Iowa compliance reference (food safety, liquor, labor, workers comp, benchmarks)
- `z-report-5-4-2026.md` — Sample Z-Report extraction (May 4, 2026 business day)
- `video_EoHF88VZ9aA_analysis_*.md` — PDQ POS video demo analysis (phone orders, dispatch, driver reports)

---

## 15. What's Next

- [ ] Yesterday Sales morning dashboard (auto-shows last Z-Report on open)
- [ ] 7:30 AM daily Z-Report reminder scheduled task
- [ ] Restaurant accounting knowledge in Ask AI brain
- [ ] Month-end P&L rollup view
- [ ] Live POS integration (when available)
- [ ] Wi-Fi proximity tracking (requires hardware)
- [ ] Facebook social posting for points (requires Meta Business verification)
