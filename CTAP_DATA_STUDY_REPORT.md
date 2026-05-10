# CTAP People Platform — Deep Data Study Report

**Date:** May 5, 2026  
**Build:** 218+  
**Total Records Analyzed:** 41 staff, 2,732 voids, 198 days sales, 44 knowledge entries, 139 schedule shifts, 16 checklists, 172 menu items, 18 training modules

---

## 1. Staff Roster (41 Active)

| Department | Count | Key Employees | Notes |
|---|---|---|---|
| Kitchen Line | 18 | Moe Thomas (KM), Che Lyftogt (Key), Steven Klein (Key) | Largest department. Moe runs the kitchen. |
| Drivers | 8 | None | All standard driver role |
| Bar | 7 | Jessica Gailey (Key) | Ashley, Bryson, Karlee are top performers |
| Dining Room | 3 | None | Kenzy, Joleah, Jeri |
| Management | 3 | Mychael Mueller (Owner), Sally Hart (Owner), Gavin Thomas (Key Mgr) | Full ownership team |
| Pizza | 1 | None | Josue runs pizza solo |
| Dishwasher | 1 | None | Andrik |

---

## 2. Void Analysis — Red Flags & Patterns

### Top Voiders (All Time)
| Rank | Name | Count | Total $ | Avg $ | Role |
|---|---|---|---|---|---|
| 1 | Ashley Holding | 314 | $2,856.89 | $9.10 | Bar |
| 2 | Jessica Gailey | 297 | $2,790.66 | $9.39 | Bar |
| 3 | Kenzy Thompson | 252 | $4,009.83 | $15.91 | Dining Room |
| 4 | Bryson Cook | 200 | $1,780.88 | $8.90 | Bar |
| 5 | Karlee Sturtz | 153 | $1,837.58 | $12.01 | Bar |
| 6 | Jeri Wilson | 132 | $1,265.20 | $9.59 | Dining Room |
| 7 | Kailee Miller | 59 | $576.99 | $9.78 | Bar |
| 8 | Gavin Nore | 56 | $672.57 | $12.01 | Kitchen Line |
| 9 | Sally Hart | 52 | $1,364.98 | $26.25 | Management |
| 10 | Moe Thomas | 47 | $955.85 | $20.34 | Kitchen Manager |

### Key Observations:
- **Bar staff dominate voids** — Ashley (314) and Jessica (297) together account for 22% of all voids
- **Kenzy Thompson has highest average** at $15.91/void — worth watching
- **Sally Hart's average is $26.25** — manager voids are larger (expected, she's voiding full orders)
- **Moe Thomas at $20.34 avg** — kitchen manager corrections, normal
- **12/20 was an anomaly day** — $1,505.59 in voids on a single day (likely a large party cancellation or POS issue)

### Void Types:
- **void_order:** 1,499 records, $18,552.01 (full order cancellations)
- **void_item:** 1,233 records, $9,195.96 (individual item removals)

### Promo Breakdown (void_item):
| Promo Type | Count | Total $ | Avg $ |
|---|---|---|---|
| Promo 100% | 848 | $7,310.74 | $8.62 |
| Promo 50% | 211 | $1,032.23 | $4.89 |
| Promo $5.00 | 50 | $250.00 | $5.00 |
| Promo 25% | 23 | $80.87 | $3.52 |
| Promo $3.00 | 17 | $48.00 | $2.82 |

---

## 3. Sales Performance

### Overview (198 days tracked):
- **Total Revenue:** $1,290,797.08
- **Daily Average:** $6,519.18
- **Best Day:** $20,492.78
- **Worst Day:** $2,296.19

### Day of Week Averages:
| Day | Avg Sales | Days Tracked |
|---|---|---|
| Monday | $3,481 | 28 |
| Tuesday | $4,877 | 28 |
| Wednesday | $5,978 | 28 |
| Thursday | $5,979 | 27 |
| Friday | $8,981 | 29 |
| Saturday | $8,976 | 29 |
| Sunday | $7,144 | 29 |

### Category Mix (Daily Average):
| Category | Daily Avg | % of Total |
|---|---|---|
| Food | $3,141 | 48.2% |
| Beer | $1,262 | 19.4% |
| Liquor | $771 | 11.8% |
| Large Pizzas | $401 | 6.2% |
| Pop | $211 | 3.2% |

### Labor Performance:
- **Average Labor %:** 29.1% (after fixing decimal storage issue)
- **Best (lowest):** 21% (high-volume days)
- **Worst (highest):** 37% (slow Mondays)
- **Average Labor $:** $1,617/day

### Delivery Stats:
- **Average deliveries/day:** 26.6
- **Average delivery time:** 30.0 min
- **Average late deliveries/day:** 7.0 (26% late rate — needs attention)

---

## 4. Knowledge Base (44 Entries)

### By Category:
| Category | Count | Coverage |
|---|---|---|
| Operations | 15 | Opening/closing, cash handling, POS, manager duties |
| Vendor/Ordering | 2 | Bar ordering (Ashley/Wed), Food ordering (Tom/Mon+Thu) |
| Prep | 1 | Pizza morning prep |
| Cleaning | 1 | Fry line deep clean |
| Safety | 3 | Alcohol policy, vaping, discipline escalation |
| Menu Info | 1 | Bar pour cost targets |
| General Knowledge | 21 | Accounting, HR, training, policies |

### Stations Covered:
- Bar, Fry Line, Pizza Line, Dish Pit, Store Room, General

### Gaps Identified:
- No specific entries for **dining room service standards**
- No entries for **driver route optimization**
- No entries for **allergen/dietary info**
- Missing **recipe cards** in knowledge base (only in recipes table)

---

## 5. Schedule (This Week: May 5-11)

### Shifts Per Day:
| Day | Shifts | Notes |
|---|---|---|
| Mon May 5 | 16 | Standard weekday |
| Tue May 6 | 16 | Standard weekday |
| Wed May 7 | 16 | Standard weekday |
| Thu May 8 | 16 | Standard weekday |
| Fri May 9 | 25 | Weekend staffing |
| Sat May 10 | 25 | Weekend staffing |
| Sun May 11 | 25 | Weekend staffing |

### Coverage Pattern:
- Weekday: 5 kitchen, 3 bar, 2 dining, 1 pizza, 3 drivers, 1 dish, 1 manager = 16
- Weekend: 8 kitchen, 5 bar, 3 dining, 1 pizza, 5 drivers, 1 dish, 2 managers = 25

---

## 6. Gamification System

### Achievement Definitions (15):
| Category | Achievements | Difficulty Range |
|---|---|---|
| Attendance | Iron Streak (7d), Unbreakable (30d) | Easy → Hard |
| Quality | Checklist Champion (30), Zero Waste Week (7d), Photo Pro (50) | Medium → Hard |
| Engagement | Team Player (10), Feedback King (20), Brain Master (50) | Easy → Medium |
| Leadership | Mentor (5), Shift Captain (10), Problem Solver (20) | Medium → Hard |
| Longevity | 90 Day Veteran, Six Month Legend, Lifer (365) | Medium → Legendary |

### Rewards (12 active):
| Tier | Reward | Cost |
|---|---|---|
| Bronze | Free Shift Meal | 100 pts |
| Bronze | CTap T-Shirt | 200 pts |
| Silver | $10 Gift Card | 300 pts |
| Silver | Priority Scheduling | 500 pts |
| Gold | $25 Gift Card | 750 pts |
| Gold | Day Off Request Priority | 1,000 pts |
| Platinum | $50 Gift Card | 1,500 pts |
| Platinum | Custom Schedule Week | 1,500 pts |
| Diamond | $100 Gift Card | 2,500 pts |
| Diamond | Paid Day Off | 2,500 pts |
| Legend | $200 Gift Card | 5,000 pts |
| Legend | Legend Parking Spot | 5,000 pts |

---

## 7. Data Fixes Applied

| Fix | Records Affected | Status |
|---|---|---|
| Gavin Noore → Gavin Nore | 186 void records | ✅ Fixed |
| Timestamp-prefixed names cleaned | 68 void records | ✅ Fixed |
| Labor % decimal → percentage | 196 daily_sales records | ✅ Fixed |
| Test accounts removed | 4 staff + orphaned records | ✅ Fixed |
| Schedule seeded for May 5-11 | 139 new shifts | ✅ Added |
| Kailee Miller spelling unified | Verified consistent | ✅ Confirmed |

### Remaining Known Issue:
- **"Thomas Dorothy"** (41 void records, Jan-Apr 2026) — likely a former employee or POS name format issue. Kept as historical data.

---

## 8. System Health

- **Security Events:** 439 total (300 successful logins, 130 failed, 4 clock-ins, 4 clock-outs)
- **Management Briefings:** 6 generated (3 for Tom/BOH, 3 for Ashley/Bar, 3 for Mychael/Scheduler)
- **Daily Briefings:** 2 (May 3 and May 5)
- **Training Modules:** 18 (POS scenarios)
- **Menu Items:** 172
- **Recipes:** 10
- **Station Broadcasts:** 1
- **Worker Evaluations:** 0 (not yet used)
- **Worker Write-ups:** 0 (not yet used)

---

## 9. Recommendations

1. **Void monitoring** — Ashley and Jessica's void counts are high but consistent with bar operations (comps, wrong orders). Set up weekly void alerts if anyone exceeds 2 standard deviations.
2. **Delivery late rate** — 26% late is too high. Consider adding a delivery time target to the driver checklist.
3. **Knowledge base gaps** — Add dining room service standards, allergen info, and driver route tips.
4. **Evaluations** — The system supports worker evaluations but none have been created yet. Good tool for quarterly reviews.
5. **Labor optimization** — Monday labor at 37% is high for $3.5K revenue. Consider reducing Monday staffing.
