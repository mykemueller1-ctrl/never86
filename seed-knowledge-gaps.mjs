import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const newEntries = [
  // DINING ROOM SERVICE
  {
    station: 'waitstaff',
    category: 'process',
    question: 'What are the dining room server standards at CTap?',
    answer: `Server Standards at Community Tap & Pizza:

GREETING: Approach within 60 seconds of seating. Smile, introduce yourself, offer drink suggestions.

DRINK ORDER: Get drinks in fast. Suggest a bucket deal if it's a group. Know the tap list — what's new, what's popular.

FOOD ORDER: Know the menu inside out. Suggest appetizers (Pick 3 Apps is a great upsell). Repeat the order back. Ring it in immediately — don't batch.

TABLE MAINTENANCE: Pre-bus constantly. Never let empty glasses or plates stack. Check back after 2 bites. Refill drinks without being asked.

UPSELLING: Always suggest dessert (Funnel Fries are the move). Offer another round before they ask. Mention any specials.

CLOSING: Drop the check when they're ready — don't rush. Thank them by name if you caught it. Bus the table within 2 minutes of departure.

TARGET: 45-minute table turn for lunch, 60-75 for dinner.`,
    tags: JSON.stringify(["dining_room","server","standards","service","upselling","table_turn"])
  },
  {
    station: 'waitstaff',
    category: 'process',
    question: 'How should servers handle complaints and difficult customers?',
    answer: `Complaint Handling — The LAST Method:

L — Listen. Let them talk. Don't interrupt. Nod. Show you care.
A — Apologize. "I'm sorry about that" goes a long way. Don't make excuses.
S — Solve. Fix it NOW. Remake the food, comp the item, get a manager if needed. Don't make them wait.
T — Thank. "Thank you for letting me know" — they could have just left a bad review instead.

COMP AUTHORITY:
• Servers can comp a single item (drink or app) without manager approval
• Full order comps need manager (Mychael, Sally, or Gavin T.)
• If in doubt, get the manager. Better to over-comp than lose a regular.

ESCALATION: If a customer is aggressive, rude to other guests, or intoxicated — get management immediately. Never argue back.`,
    tags: JSON.stringify(["dining_room","complaints","customer_service","comp","escalation"])
  },
  // DRIVER STATION
  {
    station: 'general',
    category: 'process',
    question: 'What are the delivery zones and time targets for CTap drivers?',
    answer: `Delivery Zones & Time Targets:

ZONE 1 (0-3 miles): Target 20 minutes door-to-door. Includes downtown, Main St corridor, residential east.
ZONE 2 (3-6 miles): Target 30 minutes. Includes highway corridor, west side, industrial park area.
ZONE 3 (6-10 miles): Target 40 minutes. Out of town runs — Quality Inn ($1 fee), Comfort Suites ($1 fee).

STACKING RULES:
• Max 3 deliveries per run
• Never stack a Zone 3 with anything else
• If an order has been waiting 5+ minutes, it goes NEXT regardless of zone

LATE DELIVERY = anything over target + 5 minutes. Current late rate is 26% — we need to get this under 15%.

TIPS: Keep your car clean. Smile at the door. Say their name. "Here's your order, [Name]. Enjoy!" — it matters for tips and repeat business.`,
    tags: JSON.stringify(["driver","delivery","zones","time_targets","stacking","tips"])
  },
  {
    station: 'general',
    category: 'process',
    question: 'What is the driver end-of-shift checkout process?',
    answer: `Driver End-of-Shift Checkout:

1. Count your cash — separate delivery fees from tips
2. Fill out nightly paperwork:
   • Total deliveries count
   • Out of town runs with fees (Quality Inn $1, Comfort Suites $1, etc.)
   • Mileage (start and end odometer)
   • Any issues or customer complaints
3. Turn in cash to closing manager
4. Manager signs off on your paperwork
5. Both driver AND manager must sign the checkout sheet

DUAL SIGN-OFF IS REQUIRED. No exceptions. This protects both you and the house.

Before leaving:
• Check if any last deliveries are coming up
• Help fold boxes if kitchen is slow
• Sweep parking lot if asked`,
    tags: JSON.stringify(["driver","checkout","end_of_shift","paperwork","cash","dual_sign_off"])
  },
  // ALLERGEN INFO
  {
    station: 'general',
    category: 'menu_info',
    question: 'What are the common allergens in CTap menu items?',
    answer: `Common Allergens at CTap:

GLUTEN: Present in pizza dough, breading (wings, tenderloins, cheese balls, onion rings), burger buns, funnel fries. 
GLUTEN-FREE OPTIONS: Boneless wings can be done unbreaded (ask kitchen). Salads without croutons. Smoked Iowa Chop is naturally GF.

DAIRY: Cheese on pizzas, cheese balls, ranch dressing, alfredo. 
DAIRY-FREE: Most meats are safe. Ask about sauces.

NUTS: No major nut items on menu. Carbliss drinks are nut-free. Check seasonal specials.

SOY: Present in some dressings and sauces. Fryer oil is soybean-based.

SHELLFISH: No shellfish on regular menu. Crab Rangoon is the exception (when available).

RULE: If a customer asks about allergens and you're not 100% sure — ASK THE KITCHEN. Never guess. A wrong answer can kill someone.`,
    tags: JSON.stringify(["allergens","gluten","dairy","nuts","dietary","menu","safety"])
  },
  // PREP - FRY LINE
  {
    station: 'fry_line',
    category: 'prep',
    question: 'What is the fry line opening prep list?',
    answer: `Fry Line Opening Prep:

1. Turn on fryers — check oil level and clarity. If dark/smells burnt, CHANGE IT.
2. Set fryer temps: Wings 350°F, Fries 375°F, Breaded items 350°F
3. Prep breading station:
   • Flour pan (seasoned)
   • Egg wash
   • Breadcrumb pan
4. Pull from walk-in:
   • Wings (bone-in and boneless) — check par levels
   • Cheese balls — portion into bags of 8
   • Onion rings — pre-breaded, ready to drop
   • Tenderloins — check count vs. projected sales
   • French fries — fill fry bins
5. Check sauce bottles: ranch, BBQ, buffalo, honey mustard. Refill any below 1/3.
6. Stock to-go containers and fryer baskets
7. Clean and sanitize prep area
8. Check ticket printer paper

PAR LEVELS (weekday/weekend):
• Wings bone-in: 40/80 pieces
• Boneless: 30/60 pieces
• Cheese balls: 15/25 bags
• Tenderloins: 20/35`,
    tags: JSON.stringify(["fry_line","prep","opening","fryer","wings","par_levels"])
  },
  // PREP - KITCHEN LINE
  {
    station: 'fry_line',
    category: 'prep',
    question: 'What is the kitchen line opening prep checklist?',
    answer: `Kitchen Line Opening Prep:

1. Turn on flat-top grill — scrape and oil
2. Turn on char-grill — brush grates
3. Check steam table — fill wells, set temps
4. Pull proteins from walk-in:
   • Burger patties (count vs. projected)
   • Iowa chops (thaw if needed — NEVER microwave)
   • Chicken breasts
5. Slice prep:
   • Tomatoes, onions, lettuce for burgers
   • Check pickle bucket
6. Sauce station:
   • Fill squeeze bottles (ketchup, mustard, mayo, CTap sauce)
   • Check specialty sauces
7. Bun station:
   • Stock burger buns, hoagie rolls, tenderloin buns
   • Butter and toast a test bun — grill should be ready
8. Check ticket printer and expo area
9. Restock plates, to-go containers, foil

COMMUNICATION: Call out "KITCHEN OPEN" when you're ready for tickets.
If anything is 86'd from last night — tell the manager IMMEDIATELY so they can update the board.`,
    tags: JSON.stringify(["kitchen_line","prep","opening","grill","proteins","mise_en_place"])
  },
  // CLEANING - BAR
  {
    station: 'bar',
    category: 'cleaning',
    question: 'What is the bar closing cleaning checklist?',
    answer: `Bar Closing Deep Clean:

1. LAST CALL: Announce at posted time. Cut off anyone who's had enough.
2. GLASSWARE: Run all remaining glasses through dishwasher. Hand-wash anything that won't fit.
3. TAPS: Run water through all draft lines (5 seconds each). Wipe tap handles.
4. WELLS: Empty ice wells. Wipe down with sanitizer. Leave drains open.
5. BOTTLES: Face all bottles. Wipe sticky ones. Note anything below 1/4 for Wednesday order.
6. GARNISHES: Toss fruit older than 1 day. Cover and refrigerate the rest.
7. SURFACES: Wipe down entire bar top, back bar, speed rail. Use bar cleaner, not just water.
8. MATS: Pull rubber mats, rinse in back. Mop floor underneath.
9. STOOLS: Wipe down, push in.
10. REGISTER: Run end-of-day report. Count drawer. Fill out cash sheet.
11. TRASH: Take out all bar trash. Replace bags.
12. LIGHTS: Turn off neon signs, TV's. Leave security lights on.

LOCK UP: Check bathrooms (anyone still in there?). Set alarm. Lock all doors.`,
    tags: JSON.stringify(["bar","closing","cleaning","deep_clean","checklist"])
  },
  // CLEANING - DINING ROOM
  {
    station: 'waitstaff',
    category: 'cleaning',
    question: 'What is the dining room closing cleaning procedure?',
    answer: `Dining Room Closing:

1. TABLES: Wipe all tables and chairs with sanitizer. Check under tables for trash.
2. CONDIMENTS: Refill salt/pepper, ketchup, hot sauce. Wipe bottles.
3. MENUS: Wipe down all menus. Replace any that are torn or sticky.
4. FLOOR: Sweep entire dining room. Mop high-traffic areas. Get under booths.
5. WINDOWS: Wipe fingerprints off entry doors and windows.
6. BATHROOMS: 
   • Restock toilet paper, paper towels, soap
   • Wipe mirrors, sinks, counters
   • Scrub toilets
   • Mop floors
   • Empty trash
7. HOST STAND: Organize menus, clean stand, restock to-go menus.
8. PATIO (if open): Bring in or secure furniture. Sweep. Wipe tables.
9. FINAL WALK: Do a full loop. Would you want to eat here tomorrow morning? If not, fix it.`,
    tags: JSON.stringify(["dining_room","closing","cleaning","bathrooms","floor"])
  },
  // MENU INFO - FOOD COSTS
  {
    station: 'general',
    category: 'menu_info',
    question: 'What are the food cost targets for each menu category at CTap?',
    answer: `Food Cost Targets by Category:

APPETIZERS: Target 22-28%
• Cheese Balls: 24.4% ✅ (on target)
• Onion Rings: 18.7% ✅ (great margin)
• Boneless Wings: 32.0% ⚠️ (above target — wing prices volatile)
• Pick 3 Apps: ~25% ✅

ENTREES: Target 28-35%
• Smoked Iowa Chop: 38.2% ❌ (over — premium item, acceptable for draw)
• Hamburger: 25.9% ✅ (strong margin)
• Tenderloin: 41.0% ❌ (highest food cost item — review pricing)

PIZZA: Target 20-28%
• Cheese Pizza: 20.9% ✅ (pizza is your profit center)
• Community Special: ~25% ✅
• Meat Lovers: ~28% ✅

SIDES: Target 15-22%
• French Fries: 24.7% ⚠️ (slightly high — portion control)
• Funnel Fries: 19.2% ✅

DRINKS: Target 18-25% (pour cost)
• Moscow Mule: 33.1% ❌ (review — lime/ginger beer cost?)
• Beer overall: 28.5%
• Liquor overall: 23.7% ✅

OVERALL TARGET: 28-32% blended food cost. Currently running ~30%.`,
    tags: JSON.stringify(["food_cost","targets","menu","pricing","margins","category"])
  },
  // SAFETY - FOOD SAFETY
  {
    station: 'general',
    category: 'safety',
    question: 'What are the food safety and temperature standards at CTap?',
    answer: `Food Safety Standards:

TEMPERATURE DANGER ZONE: 41°F - 135°F. Food cannot sit in this range for more than 4 hours total.

HOLDING TEMPS:
• Hot food: 135°F minimum (steam table, heat lamps)
• Cold food: 41°F or below (walk-in, prep coolers)
• Fryer oil: 350-375°F

COOKING TEMPS (internal):
• Chicken: 165°F
• Ground beef (burgers): 155°F (unless customer requests otherwise — note on ticket)
• Pork (Iowa Chop): 145°F + 3 min rest
• Fish: 145°F

THAWING: NEVER at room temperature. Options:
1. In walk-in cooler (overnight — plan ahead)
2. Under cold running water (quick thaw)
3. As part of cooking process

LABELING: Everything in walk-in gets a date label. First In, First Out (FIFO). If it doesn't have a date, throw it out.

HANDWASHING: Every time you change tasks, touch your face, handle raw meat, or come back from break. 20 seconds with soap.`,
    tags: JSON.stringify(["food_safety","temperature","holding","cooking","thawing","labeling","FIFO"])
  },
  // PROCESS - CASH HANDLING
  {
    station: 'general',
    category: 'process',
    question: 'What is the cash handling and register procedure at CTap?',
    answer: `Cash Handling Procedures:

OPENING:
• Count starting drawer ($200 standard). Verify with opening manager.
• Both sign the count sheet.
• Never leave register unlocked when walking away.

DURING SHIFT:
• Make change from drawer only — never from tip jar or pocket.
• $50 and $100 bills: check with counterfeit pen. If in doubt, get manager.
• If drawer is over $500 in cash, do a safe drop. Log it.

CLOSING:
• Run Z-report from POS.
• Count drawer. Should be $200 + any cash sales.
• Over/short: Note the amount. Over $5 short requires manager notification.
• Bundle cash by denomination. Rubber band each stack.
• Fill out cash sheet with totals.
• Manager counts behind you and signs off.
• Cash goes in safe. NEVER leave cash out overnight.

DISCREPANCIES: 3 shorts in 30 days = write-up. Consistent shortages = investigation.`,
    tags: JSON.stringify(["cash","register","handling","safe_drop","z_report","closing"])
  }
];

let added = 0;
for (const entry of newEntries) {
  await connection.execute(
    "INSERT INTO knowledge_entries (station, category, question, answer, tags, confidence, source) VALUES (?, ?, ?, ?, ?, 'high', 'manual')",
    [entry.station, entry.category, entry.question, entry.answer, entry.tags]
  );
  added++;
  console.log(`  ✅ Added: [${entry.station}] ${entry.question.substring(0, 50)}...`);
}

console.log(`\n✅ Added ${added} new knowledge entries`);

// Final count
const [total] = await connection.execute('SELECT COUNT(*) as cnt FROM knowledge_entries');
console.log(`Total knowledge base: ${total[0].cnt} entries`);

await connection.end();
process.exit(0);
