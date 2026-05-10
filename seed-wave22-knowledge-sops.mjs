// Wave 22 — Remaining Knowledge Base Entries + SOPs + Liquor Intelligence
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const conn = await mysql.createConnection(DATABASE_URL);

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  WAVE 22 — KNOWLEDGE + SOPs + LIQUOR INTELLIGENCE           ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

// ━━━ SECTION 1: Equipment SOPs (Ice Machine, Hobart, Meat Slicer, Dough Roller, Fryers, Pizza Ovens) ━━━
console.log('━━━ SECTION 1: Equipment SOPs ━━━');

const equipmentSOPs = [
  {
    station: 'fry_line', category: 'process', tags: 'ice machine,cleaning,maintenance,sanitize',
    question: 'How do I clean and maintain the ice machine?',
    answer: `ICE MACHINE CLEANING & MAINTENANCE SOP (Every 2 Weeks):
1. Turn off machine and empty all ice into bus tubs
2. Remove ice bin drain cap — let melt water drain completely
3. Mix sanitizer solution (1 tbsp bleach per gallon OR commercial ice machine cleaner per label)
4. Wipe down interior walls, bin floor, and deflector with sanitizer solution
5. Clean exterior — wipe down door gasket, handle, and outer panels
6. Rinse interior thoroughly with clean water (3x minimum)
7. Replace drain cap, turn machine back on
8. DISCARD first batch of ice after cleaning (may contain residual cleaner)
9. Check water filter — replace every 6 months (write date on filter)
10. Inspect condenser coils — vacuum dust monthly (back/bottom of unit)
SIGNS OF PROBLEMS: Slow ice production = dirty condenser or low water flow. Cloudy/smelly ice = needs immediate deep clean. Ice tastes off = replace water filter.
LOG: Write date + initials on cleaning log taped to machine side.`
  },
  {
    station: 'fry_line', category: 'process', tags: 'hobart,mixer,sop,safety,dough',
    question: 'How do I safely operate the Hobart mixer?',
    answer: `HOBART MIXER SOP:
BEFORE USE:
1. Ensure bowl is locked in place (lift lever engaged)
2. Attach correct attachment (dough hook for dough, paddle for mixing, whip for whipping)
3. Make sure guard is in place before starting
4. Start on SPEED 1 — never start on high speed (burns motor, splashes ingredients)

DURING USE:
- NEVER put hands/utensils in bowl while running — STOP machine first
- If dough climbs hook, STOP and push down with rubber spatula
- Max capacity: 20qt bowl = 12lbs flour for dough, 15lbs for mixing
- Watch for overheating — if motor is hot to touch, let rest 10 min

AFTER USE:
1. Turn off and unplug
2. Remove bowl and attachment
3. Wash bowl, hook/paddle/whip in 3-sink (wash, rinse, sanitize)
4. Wipe down mixer body with damp cloth (never submerge motor unit)
5. Dry all parts before reassembly
6. Leave guard up when not in use

SAFETY: Never wear loose clothing, jewelry, or long sleeves near mixer. Hair tied back. Report any unusual sounds immediately.`
  },
  {
    station: 'fry_line', category: 'process', tags: 'meat slicer,sop,safety,cleaning',
    question: 'How do I safely operate and clean the meat slicer?',
    answer: `MEAT SLICER SOP:
BEFORE USE:
1. Inspect blade guard is in place
2. Set thickness dial to 0 (closed) before turning on
3. Turn on — let blade reach full speed before slicing
4. Use pusher plate/guard — NEVER push food with hands near blade

DURING USE:
- Always use cut-resistant glove on the hand holding food
- Slice away from your body
- Keep fingers behind the guard at all times
- If blade jams, TURN OFF before clearing
- Max items: deli meats, cheese, tomatoes, onions (never bone-in or frozen)

CLEANING (after every use):
1. TURN OFF and UNPLUG
2. Set blade to 0 (closed position)
3. Wipe blade with folded damp towel — wipe FROM CENTER OUTWARD (away from edge)
4. Remove food tray, guard plate — wash in 3-sink
5. Wipe body with sanitizer solution
6. Reassemble, leave blade at 0
7. Cover with blade guard when stored

NEVER: Leave running unattended. Use without cut glove. Clean while plugged in. Force frozen items through.`
  },
  {
    station: 'pizza_line', category: 'process', tags: 'dough roller,sheeter,sop,pizza,dough',
    question: 'How do I operate the dough roller/sheeter?',
    answer: `DOUGH ROLLER/SHEETER SOP:
SETUP:
1. Lightly flour the rollers and conveyor belt
2. Set gap width — start WIDE (thickest setting)
3. Turn on machine, let it reach speed

OPERATION:
1. Place dough ball on feed side — let machine pull it through (don't force)
2. Catch dough on exit side
3. Reduce gap width ONE notch at a time
4. Pass through again — repeat until desired thickness
5. For pizza: target 12" = 3 passes, 14" = 4 passes, 16" = 5 passes
6. Rotate dough 90° between passes for even stretching

THICKNESS GUIDE (CTAP):
- Thin crust: setting 3 (about 1/8")
- Regular crust: setting 4-5 (about 3/16")  
- Deep dish: hand-press only (don't use sheeter)

CLEANING:
1. Turn off and unplug
2. Scrape excess dough from rollers with plastic scraper
3. Wipe rollers with damp cloth (never submerge)
4. Wipe conveyor belt
5. Flour lightly before covering for next use

NEVER: Put hands between rollers while running. Force thick/cold dough through tight setting (tears dough, strains motor).`
  },
  {
    station: 'fry_line', category: 'process', tags: 'fryers,sop,safety,oil,temperature,filtering',
    question: 'What is the full fryer SOP including safety and filtering?',
    answer: `FRYERS SOP — FULL OPERATIONS:
STARTUP (AM):
1. Check oil level — should be between MIN and MAX lines on tank
2. Turn on — set to 350°F (wings/fries) or 325°F (breaded items)
3. Wait for temp light to cycle off before dropping food
4. Test with single fry — should bubble immediately

DURING SERVICE:
- Never overfill baskets (half full max for best results)
- Shake baskets at 30-second mark for even cooking
- Skim floating debris between batches with spider strainer
- Watch for oil breakdown signs: dark color, excessive smoking, off smell, foam that doesn't dissipate

FILTERING (every night + midday if heavy volume):
1. Turn off fryer, let cool to 250°F (NOT room temp — oil flows better warm)
2. Place filter pan under drain
3. Open drain valve — let oil flow through filter paper/powder
4. Scrub tank interior with fryer brush while empty
5. Close drain, pump filtered oil back in
6. Top off with fresh oil if below MIN line
7. Dispose of filter paper/powder in grease trap

OIL CHANGE (full swap every 7-10 days or when quality fails):
1. Cool to 250°F, drain completely into waste oil container
2. Scrub tank with fryer cleaner + hot water
3. Rinse 3x, dry completely
4. Fill with fresh oil to MAX line
5. Write date on fryer log

SAFETY: Water + hot oil = EXPLOSION. Never move full fryer. Fire = COVER (never water). Burns = cold water 10 min then report.`
  },
  {
    station: 'pizza_line', category: 'process', tags: 'pizza ovens,deck oven,sop,temperature,rotation',
    question: 'What is the full pizza oven SOP?',
    answer: `PIZZA OVENS SOP — DECK OVEN OPERATIONS:
STARTUP (AM):
1. Turn on both decks — set top deck 475°F, bottom deck 450°F
2. Allow 45-60 min preheat (stones must be fully saturated with heat)
3. Test with dough scrap — should bubble and brown in 2-3 min

LOADING:
1. Build pizza on floured peel (cornmeal optional for slide)
2. Shake peel gently to confirm pizza slides freely BEFORE approaching oven
3. Slide pizza onto stone in one smooth motion — aim for back-center
4. Max 2 pizzas per deck (3 if all smalls)

ROTATION:
1. Check at 4 minutes — rotate 180° with peel for even browning
2. Total cook time: 8-10 min (thin), 10-12 min (regular), 12-14 min (loaded)
3. Done when: cheese is bubbly/golden, crust is golden-brown, bottom lifts cleanly

COMMON ISSUES:
- Soggy center = too many wet toppings, or oven not hot enough
- Burnt bottom = stone too hot (lower temp 25°F) or pizza sat too long
- Raw center = too thick, or oven door opened too much (loses heat)
- Won't slide off peel = not enough flour, or sat on peel too long (moisture seeps through)

CLEANING (nightly):
1. Turn off after last pizza
2. Let cool 30 min, then brush stones with oven brush (no water on hot stones!)
3. Scrape any burnt cheese/toppings off stones
4. Wipe exterior and door glass
5. Leave door cracked overnight for moisture release

WEEKLY: Full stone scrub when cool. Check door gaskets. Verify thermometer accuracy with probe.`
  }
];

// ━━━ SECTION 2: Safety & Compliance SOPs ━━━
console.log('━━━ SECTION 2: Safety & Compliance SOPs ━━━');

const safetySOPs = [
  {
    station: 'general', category: 'safety', tags: 'sanitation,chemical,cleaning,safety,msds',
    question: 'What are the sanitation and chemical use procedures?',
    answer: `SANITATION & CHEMICAL USE SOP:
APPROVED CHEMICALS:
1. Sanitizer (quaternary ammonium) — red bucket, 200ppm, food contact surfaces
2. Degreaser (purple spray) — hoods, grills, fryer exteriors, floors
3. Glass cleaner (blue) — mirrors, windows, display cases only
4. Bleach solution — 1 tbsp/gallon for mop water, restrooms, drains
5. Dish machine sanitizer — auto-dispensed, check concentration daily (test strip)

RULES:
- NEVER mix chemicals (especially bleach + anything)
- Always label spray bottles (chemical name + date mixed)
- Wear gloves when using degreaser or bleach
- Store chemicals BELOW food items, never above
- MSDS/SDS sheets in red binder above mop sink — know where they are
- If chemical contacts skin: flush with water 15 min, report to manager
- If chemical contacts eyes: eyewash station (by dish pit) for 15 min, call 911

SANITIZER BUCKET PROTOCOL:
- Fresh bucket every 4 hours (or when visibly dirty)
- Test with strip — must read 150-400ppm (replace if outside range)
- Wiping method: spray surface, let sit 30 seconds, wipe with clean towel
- Air dry is best — no need to rinse food contact surfaces after sanitizer

DAILY SANITATION SCHEDULE:
- Every 2 hours: sanitize all cutting boards, prep surfaces, door handles
- After each task: sanitize station before starting new prep
- End of shift: full station breakdown and sanitize
- Weekly: deep clean walk-in shelves, reach-in interiors, under equipment`
  },
  {
    station: 'general', category: 'safety', tags: 'kitchen safety,burns,cuts,slips,fire,first aid',
    question: 'What are the general kitchen safety procedures?',
    answer: `GENERAL KITCHEN SAFETY SOP:
BURNS:
- Minor (red, no blister): cold running water 10 min, report to manager
- Serious (blistering, large area): cold water, do NOT pop blisters, seek medical attention
- Grease fire: SMOTHER with lid or use Class K extinguisher (by fryers). NEVER WATER.
- Oven burns: use dry towels/mitts only (wet towel + hot surface = steam burn)

CUTS:
- Minor: wash with soap/water, apply bandage + blue finger cot (food-safe), glove over top
- Serious (won't stop bleeding in 5 min): apply pressure, elevate, get to urgent care
- Report ALL cuts to manager (incident log)

SLIPS/FALLS:
- Wet floor = yellow sign IMMEDIATELY
- Non-slip shoes REQUIRED (no exceptions)
- Clean spills the SECOND they happen
- Walk, don't run. Call "behind" and "corner"

FIRE:
- Know extinguisher locations (by fryers, by oven, by exit)
- RACE: Rescue, Alarm, Contain, Evacuate
- Grease fire = Class K extinguisher or smother. NEVER WATER.
- If fire is bigger than a trash can = evacuate, call 911

LIFTING:
- Bend knees, straight back, close to body
- Ask for help if over 40 lbs
- Use dolly for cases from truck

FIRST AID KIT: Above hand sink in kitchen. Contains: bandages, burn cream, gauze, tape, blue finger cots, eye wash, antiseptic.`
  },
  {
    station: 'general', category: 'process', tags: 'minor employee,labor law,iowa,restrictions,hours',
    question: 'What are the work restrictions for minor employees in Iowa?',
    answer: `MINOR EMPLOYEE WORK RESTRICTIONS (Iowa Labor Law):
14-15 YEAR OLDS:
- Max 4 hours on school days, 8 hours non-school days
- Max 28 hours per week during school year
- Cannot work before 7:00 AM or after 7:00 PM (9:00 PM June 1 - Labor Day)
- Cannot operate: slicers, mixers, ovens, fryers, or any power equipment
- Cannot work in walk-in freezers
- Cannot load/unload trucks

16-17 YEAR OLDS:
- No hour restrictions in Iowa (but federal law applies if interstate commerce)
- Cannot operate: meat slicers, dough rollers (power-driven)
- CAN operate: fryers with auto-lift baskets, pizza ovens, mixers under 5qt
- Cannot drive for deliveries (under 18 = no commercial driving)
- Cannot work in freezers for extended periods (15 min max without break)

ALL MINORS:
- Must have work permit on file (issued by school)
- Cannot serve or handle alcohol (Iowa Code 123.49)
- Cannot be sole employee on premises (adult must be present)
- 30-minute break required for every 5 hours worked
- Sexual harassment training required within first week

SCHEDULING NOTES:
- Check school calendar — no scheduling during school hours
- Sports seasons = limited availability (communicate with parents)
- Summer hours are more flexible but still cap at 8/day for 14-15

COMMUNITY TAP POLICY: We currently employ minors as dishwashers and phone takers only. No minor works fryers, slicers, or delivery.`
  },
  {
    station: 'general', category: 'process', tags: 'training acknowledgment,onboarding,new hire,signature',
    question: 'What does the employee training acknowledgment form cover?',
    answer: `EMPLOYEE TRAINING ACKNOWLEDGMENT FORM:
Every new hire must sign acknowledgment of training in these areas:

1. FOOD SAFETY: ServSafe basics, handwashing (20 sec), cross-contamination prevention, temp danger zone (41-135°F), FIFO dating
2. ALLERGEN AWARENESS: Big 9 allergens, how to handle allergy requests, when to get manager
3. CHEMICAL SAFETY: SDS/MSDS location, proper chemical use, never mix chemicals, PPE requirements
4. FIRE SAFETY: Extinguisher locations and types, evacuation routes, grease fire protocol
5. PERSONAL SAFETY: Knife safety, burn prevention, slip prevention, lifting technique, cut protocol
6. HARASSMENT POLICY: Zero tolerance, reporting chain (manager → owner → Iowa Civil Rights Commission)
7. DRESS CODE: Non-slip shoes, no loose jewelry, hair restraint, clean uniform, no open-toed shoes
8. ATTENDANCE: Call-in procedure (2 hours before shift minimum), no-call/no-show = write-up, 3 NCNS = termination
9. SUBSTANCE POLICY: Zero tolerance on shift, random testing rights, prescription medication disclosure
10. TECHNOLOGY: No phones on line during service, break-time only, no social media about workplace without approval

FORM INCLUDES:
- Employee printed name + signature + date
- Trainer printed name + signature + date
- Manager verification signature
- Copy to employee, original in personnel file

RETENTION: Keep signed forms for duration of employment + 3 years after separation (Iowa record retention).`
  },
  {
    station: 'general', category: 'process', tags: 'pos adjustments,never86d,report,voids,comps,discounts',
    question: 'What is the Never86d POS Adjustments Report?',
    answer: `NEVER86D POS ADJUSTMENTS REPORT:
This report tracks all non-standard transactions that reduce revenue:

CATEGORIES TRACKED:
1. VOIDS — items removed after being sent to kitchen (requires manager PIN)
2. COMPS — items given free (employee meal, customer complaint, owner comp)
3. DISCOUNTS — percentage or dollar off (happy hour, military, employee, coupon)
4. REFUNDS — money returned to customer (wrong order, quality issue)
5. PROMOS — promotional pricing (daily specials, event pricing)

REPORT FIELDS:
- Date/Time of adjustment
- Employee who rang it
- Manager who approved (for voids)
- Item(s) affected
- Dollar amount of adjustment
- Reason code (required)
- Running daily/weekly/monthly totals

RED FLAGS (auto-flagged):
- Same employee with 3+ voids in one shift
- Void within 5 min of clock-out (potential theft pattern)
- High-value single void ($50+) without manager note
- Comp without documented reason
- Discount applied after payment started

REVIEW SCHEDULE:
- Daily: Manager reviews all voids/comps from previous day
- Weekly: Owner reviews patterns and totals
- Monthly: Full P&L impact analysis of all adjustments

TARGET: Total adjustments should be <2% of gross sales. Above 3% = investigate.`
  }
];

// ━━━ SECTION 3: Iowa Liquor Intelligence ━━━
console.log('━━━ SECTION 3: Iowa Liquor Intelligence ━━━');

const liquorIntel = [
  {
    station: 'bar', category: 'vendor', tags: 'iowa,liquor,control state,abd,pricing,wholesale',
    question: 'How does Iowa liquor pricing work and what is the control state system?',
    answer: `IOWA CONTROL STATE LIQUOR SYSTEM:
Iowa is 1 of 17 control states — government controls wholesale distribution of spirits.

PRICING CHAIN:
1. Supplier (Diageo, Brown-Forman, etc.) → sells to Iowa ABD at wholesale
2. Iowa ABD → marks up to 50% on wholesale (Iowa Code §123.24) → STATE PRICE
3. State Price → SAME for every retailer in Iowa regardless of size (Class E license)
4. Hy-Vee Wine & Spirits → buys at state price, adds retail markup → sells to Community Tap
5. Community Tap → pays Hy-Vee's retail price (state price + Hy-Vee markup)

KEY INSIGHT: Iowa ABD price is PUBLIC DATA (published monthly). The difference between ABD price and what Hy-Vee charges = Hy-Vee's markup. Compare monthly.

DATA SOURCE: https://data.iowa.gov/Sales-Distribution/Iowa-Liquor-Products/gckp-fe7r (10,000+ products, updated monthly)

WINE & BEER — DIFFERENT RULES:
- Wine: private sale, auction, or out-of-state broker (recent law change)
- Beer: private distributors (NOT state controlled) — Fort Dodge Distributing, DMB/Budweiser

LICENSE: Community Tap holds Class C license ($750-$2,500/year based on alcohol revenue tier). Sunday sales privileges as add-on.`
  },
  {
    station: 'bar', category: 'vendor', tags: 'southern glazers,ftc,pricing,discrimination,wine',
    question: 'What is the FTC vs Southern Glazers case and how does it affect us?',
    answer: `FTC vs. SOUTHERN GLAZER'S (Dec 2024):
FTC sued Southern Glazer's (#1 US distributor, $24B revenue) for Robinson-Patman Act violation — charging "drastically higher" prices to small retailers vs. chains (Total Wine, Costco).

KEY FACTS:
- First Robinson-Patman enforcement in 24 years
- Price differences NOT justified by cost efficiencies
- Used quantity discounts, rebates, secret deals small retailers couldn't access
- Federal judge allowed case to proceed (denied motion to dismiss)
- $5.5M class action settlement for overcharging late payment penalties (March 2026)

IMPACT ON COMMUNITY TAP:
1. Spirits: PARTIALLY PROTECTED — Iowa state system means same price for everyone
2. Wine: EXPOSED — wine distribution is private, Southern Glazer's likely supplies your distributor
3. Beer: EXPOSED — private distributors give volume discounts to chains

ACTION ITEMS:
- Track wine costs vs. ABD spirit equivalents
- Ask wine distributor about volume discount programs (they're under scrutiny now)
- Document price differences vs. chain restaurants
- Consider joining independent restaurant buying cooperative for better pricing`
  },
  {
    station: 'bar', category: 'vendor', tags: 'liquor brands,community tap,well,premium,top shelf,inventory',
    question: 'What liquor brands does Community Tap carry?',
    answer: `COMMUNITY TAP LIQUOR INVENTORY (from John Hanson drink list):

VODKA: Absolut Citron, Absolut Mango, Absolut Peach, Ketel One, Strawberry Vodka, Jeremiah Weed Sweet Tea, X-Rated
WHISKEY/BOURBON: Makers Mark, Woodford Reserve, Jameson
RUM: Bacardi, Bacardi Limon, Captain Morgan, Myers Dark, Malibu
TEQUILA: Jose Cuervo, Margaritaville Tequila
GIN: Tanqueray, Bombay Sapphire, Hendricks
BRANDY: Courvoisier, Blackberry Brandy
LIQUEURS: Kahlua, Baileys, Cointreau/Triple Sec, Gran Marnier, Godiva Chocolate, Chambord, Disaronno, Frangelico, Drambuie, Galliano, Pama, Limoncello, Lillet Blanc, Rumchata, Hot Damn, Peach Schnapps, Butterscotch Schnapps, Peppermint Schnapps, Mixed Berry Schnapps, Creme de Menthe, Creme de Cacao (Light+Dark), Creme de Almond, Creme de Banana, Blue Curacao, Southern Comfort
MOONSHINE: Apple Pie, Regular
WINE: Champagne, Moscato, Pinot Noir, Lambrusco, Riesling

MIXERS: Margarita Mix, Sweet & Sour, Sierra Mist, Club Soda, Tonic, Ginger Ale, Cranberry/OJ/Pineapple/Grapefruit juice, Lemonade, Apple Cider, Cold Brew, Hot Cocoa, Pepsi, Half & Half, Grenadine, Simple Syrup, Thyme/Honey/Cucumber/Rhubarb/Pineapple Ginger syrups, Strawberry Puree, Peach Mix, Berry Lemonade (homemade), Bitters, Egg Whites, Chocolate Syrup, Whipped Cream (homemade)

GARNISHES: Limes, Lemons, Oranges, Cherries, Mint, Basil, Blackberries, Strawberries, Cucumber, Cinnamon Sticks, Thyme, Hazelnuts, Marshmallows`
  },
  {
    station: 'bar', category: 'vendor', tags: 'iowa abd,state price,cost,bottle,retail,matched',
    question: 'What are the Iowa ABD state prices for our liquor?',
    answer: `IOWA ABD STATE PRICES (matched to CTAP inventory):

VODKA:
- Absolut Citron 750ml: State cost $8.99, Retail $13.49
- Absolut Mango 750ml: State cost $8.99, Retail $13.49
- Ketel One 750ml: State cost $11.33, Retail $17.00

WHISKEY/BOURBON:
- Makers Mark 750ml: State cost $13.50, Retail $20.25 (Proof 90)
- Woodford Reserve 750ml: State cost $18.00, Retail $27.00 (Proof 90.4)
- Jameson 750ml: State cost $12.50, Retail $18.75 (Proof 80)

RUM:
- Bacardi Superior 750ml: State cost $6.50, Retail $9.75 (Proof 80)
- Captain Morgan 750ml: State cost $7.50, Retail $11.25 (Proof 70)
- Malibu 750ml: State cost $8.00, Retail $12.00 (Proof 42)

TEQUILA:
- Jose Cuervo Gold 750ml: State cost $9.50, Retail $14.25 (Proof 80)

GIN:
- Tanqueray 750ml: State cost $11.00, Retail $16.50 (Proof 94.6)
- Bombay Sapphire 750ml: State cost $11.50, Retail $17.25 (Proof 94)
- Hendricks 750ml: State cost $16.00, Retail $24.00 (Proof 88)

LIQUEURS:
- Kahlua 750ml: State cost $11.00, Retail $16.50 (Proof 40)
- Baileys 750ml: State cost $12.50, Retail $18.75 (Proof 34)
- Cointreau 750ml: State cost $16.00, Retail $24.00 (Proof 80)
- Chambord 750ml: State cost $15.00, Retail $22.50 (Proof 33)
- Disaronno 750ml: State cost $12.00, Retail $18.00 (Proof 56)

NOTE: Hy-Vee adds their markup on top of state retail. Track what you actually pay vs. these numbers monthly.`
  }
];

// ━━━ SECTION 4: Schedule Template Knowledge ━━━
console.log('━━━ SECTION 4: Schedule Template Knowledge ━━━');

const scheduleKnowledge = [
  {
    station: 'general', category: 'process', tags: 'schedule,template,kitchen,bar,driver,format',
    question: 'How are the CTAP schedule templates structured?',
    answer: `CTAP SCHEDULE TEMPLATES:

BAR OPERATIONS SCHEDULE (Google Sheet):
- Prepared by: [manager name]
- Week of: [date]
- Columns: Employee | Date | Start Time | End Time | Station
- Stations: B = Bar Side, P = Pizza Side
- Staff: Jessica Gailey, Karlee Sturtz, Ashley Holding, Kenzy Thompson, Jeri Wilson, Bryson Cook, Kaillee Miller, Samantha Swearingen
- 7 days across columns (Sat-Fri typically)
- Approved by: [owner signature]

KITCHEN SCHEDULE:
- Same format as bar
- Staff: Moe Thomas, Tom Dorthy, Che, Steven Klein, Brodey Laughman, Max George, Dustin Stein, Doc, Ben Mason, Kyler Preston
- Positions: Fry, Pizza, Dish, Prep, Line

DRIVER SCHEDULE:
- Staff: Gavin Thomas (key), plus rotating drivers
- Columns: Name | Date | Start | End | Area
- Areas: In-town, Coalville, Deerwood/Nathan/Luke, Quality Inn, Kock, CJ & Cargil

SCHEDULING RULES:
- Bar: 2 bartenders minimum Fri/Sat, 1 on slow nights
- Kitchen: 3 minimum during service (fry + pizza + dish), 4 on Fri/Sat
- Drivers: 2 minimum Fri/Sat, 1 on weeknights
- Key employees get first pick of shifts (merit-based)
- Schedule posted by Wednesday for following week`
  }
];

// Insert all entries
const allEntries = [...equipmentSOPs, ...safetySOPs, ...liquorIntel, ...scheduleKnowledge];

for (const entry of allEntries) {
  const tagsJson = JSON.stringify(entry.tags.split(',').map(t => t.trim()));
  await conn.execute(
    `INSERT INTO knowledge_entries (station, category, question, answer, tags, confidence, source, createdAt)
     VALUES (?, ?, ?, ?, ?, 'high', 'imported', NOW())
     ON DUPLICATE KEY UPDATE answer = VALUES(answer), tags = VALUES(tags)`,
    [entry.station, entry.category, entry.question, entry.answer, tagsJson]
  );
}
console.log(`  ✓ Inserted ${allEntries.length} knowledge entries (equipment SOPs, safety, liquor intel, schedule templates)`);

// ━━━ VERIFICATION ━━━
const [countResult] = await conn.execute('SELECT COUNT(*) as cnt FROM knowledge_entries');
console.log(`  Total knowledge entries: ${countResult[0].cnt}`);

await conn.end();

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  WAVE 22 COMPLETE                                           ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
