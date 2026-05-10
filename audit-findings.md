# Audit Findings — Live Testing Notes

## Phase 1: Splash & Login

**Observation 1:** App loaded directly to HOME screen (skipped splash + login). This means the PIN session cookie from earlier testing persisted. The session persistence WORKS correctly.

**What I see on home screen:**
- "Install Never 86'd" PWA banner at top with Install button
- "Clocked In" status showing 13m elapsed, 0.3h this week
- Break button and Clock Out button
- "86'D RIGHT NOW: Brisket" alert banner (amber/red)
- "Your Checklists 0/8" with progress bar
- "Command Center — Operations & Intelligence" 
- Quick Actions grid: Store Runs, Invoices, Order Guide, Sales Intel, Yesterday, Z-Report, Intel Briefings, Forecast, Recipes & Cost, SKU Tracker, Compliance, Schedule
- More buttons below (need to scroll): My Profile, Shift Handoff, Report Issue, Feedback, POS Training, 86'd Alerts, Waste Log, Ask Brain, Missions, Badges, Rewards, Leaderboard
- Bottom nav: Home, Rank, Brain, Profile

**Issues found so far:**
- NONE - home screen looks correct and complete

**Next:** Need to test splash/login by clearing session. Let me log out first.

## Profile Screen (via bottom nav)

**PASS:** Profile screen loaded correctly showing:
- Avatar circle with "M" initial
- "Mychael Mueller" name, "Owner" role
- "KEY EMPLOYEE" badge
- Score: 0, Streak: 0, Priority: 50
- Details: Department = Management, Role = Owner, Employee # = 001
- "Change PIN" button (amber)
- "Sign Out" button

**Now testing Sign Out to get to splash screen...**

## Sign Out Flow

**PASS:** Sign Out worked correctly:
- Network log confirms: POST /api/trpc/staff.logout returned {"success":true} (958ms)
- No console errors during logout
- App immediately transitioned to the login/splash screen
- Session cookie cleared properly

## Splash/Login Screen

**PASS:** Login screen shows:
- "START YOUR SHIFT" header
- "Sign in to get started" subtitle
- Three tabs: PIN (active/selected), Email, New
- "Select department or enter PIN directly" instruction
- Department list: Management (Full access), Bar (Bar ops & closing), Kitchen Line (Fry & grill), Pizza Side (Pizza & phones), Dining Room (FOH & tables), Driver (Deliveries & EOD), Dishwasher (Dish pit & bus)
- QUICK PIN LOGIN section with 4 PIN dots and number pad (1-9, 0, backspace)

**Testing department filter buttons next...**

## Splash Screen (Fresh Load)

**PASS:** After sign out and fresh page load, the SPLASH SCREEN shows:
- CT logo (amber rounded square with "CT" initials)
- "COMMUNITY TAP" in bold white
- "& PIZZA" in amber
- Horizontal rule
- "FORT DODGE, IOWA" in gray
- "Powered by Never 86'd" in gray
- Dark background, clean centered layout
- Auto-transitions to login screen after a brief delay

This is the branded splash that shows before the login screen. Looks professional and on-brand.

## PIN Login Flow

**PASS:** PIN login works correctly:
- Entered PIN 8686 via number pad
- PIN dots fill visually (amber) as digits are entered
- After 4th digit, auto-submits and logs in as Mychael Mueller
- Welcome screen shows "HEY MYCHAEL - Let's have a great shift."
- Shows SCORE (0) and STREAK (0d) metrics
- "See Today's Briefing" CTA button present

## Department Filter

**PASS:** Department filter works:
- All 7 departments display with icons, labels, and descriptions
- Clicking department shows filtered staff list with role labels and KEY badges
- "All departments" back button returns to full department list
- Staff members show first initial avatar, full name, role, and KEY badge if applicable

## Toast Notifications

**FIXED:** Toast system was broken (sonner v2 incompatible with React 19):
- Replaced sonner with custom toast-system.tsx using event emitter pattern
- Toast appears at top-center with z-index 99999
- Auto-dismisses after 3 seconds
- Shows "Enter PIN for [name]" when clicking staff member on login screen
- Confirmed working via MutationObserver DOM monitoring

---

## Phase 2: Home Screen & Clock In/Out

Starting Phase 2 testing...

### Today's Briefing Screen

**PASS:** Today's Briefing displays correctly:
- Header: "TUESDAY, MAY 5 — TODAY'S BRIEFING"
- YESTERDAY: $5318.00 sales, 172 orders
- Staff shoutout: "Karlee Sturtz — Zero voids all week" (amber/gold text)
- 86'D TODAY: "Brisket" (red/amber warning card)
- SPECIALS: "Friday Special — Crab Rangoon Pizza"
- OPEN ISSUES: "Fryer thermostat — maintenance coming Tuesday"
- "Let's Go →" CTA button (amber, full width)

**Note:** The "Friday Special" text says "Friday" but today is Tuesday. This is likely seeded demo data. Not a bug per se but could be confusing in production.


## Phase 2: Home Screen & Clock In/Out

### Home Screen Layout

**PASS:** Home screen displays correctly with all expected elements:
- Greeting: "Good afternoon Mychael"
- Clock status card with elapsed time and weekly hours
- Break / Clock Out buttons
- 86'd RIGHT NOW: "Brisket" (persistent alert)
- Your Checklists: progress bar with count (1/8 after completing one item)
- Command Center: "Operations & intelligence" (manager access)
- QUICK ACTIONS grid: Store Runs, Invoices, Order Guide, Sales Intel, Yesterday, Z-Report, Intel Briefings, Forecast, Recipes & Cost, SKU Tracker, Compliance, Schedule, My Profile, Shift Handoff, Report Issue, Feedback (+5 pts), POS Training, 86'd Alerts, Waste Log, Ask Brain, Missions, Badges, Rewards, Leaderboard

### Clock In/Out Flow

**PASS:** Full clock lifecycle works correctly:
- Clocked In state: green indicator, "Clocked In", shows elapsed time and weekly hours, Break + Clock Out buttons
- Break: changes to blue "On Break" state, button becomes "End Break"
- End Break: returns to green "Clocked In" state, timer resets to 0m
- Clock Out: changes to neutral "Not clocked in" state, shows only "Clock In" button, weekly hours preserved (1.3h)
- Clock In: returns to green "Clocked In" state, timer starts at 0m

### Checklists

**PASS:** Checklists screen works correctly:
- Shows "Opening Checklist" with 8 items for management department
- Items: Unlock doors, Turn on lights, Check voicemail, Verify 86'd list, Check walk-in temps, Start fryers, Set up POS, Count cash drawer
- Clicking an item toggles completion (green checkmark, strikethrough text)
- Progress updates in real-time (0/8 → 1/8)
- Progress bar fills proportionally (amber color)
- Progress persists when navigating back to home screen

### Bottom Navigation

**PASS:** Bottom nav works correctly with 4 items: Home, Rank, Brain, Profile
- Navigation functions properly (tested via programmatic click)
- Active state shows amber color, inactive shows zinc/gray


## Phase 3: Command Center & Quick Actions

### Command Center Dashboard

The Command Center presents six key metrics in a 2x3 grid layout, providing the owner/manager with an at-a-glance operational overview. All metrics display correctly with appropriate labels and contextual subtitles.

| Metric | Value | Context |
|--------|-------|---------|
| Yesterday Sales | $5,318.00 | 172 orders |
| Pay Outs | $0 | Clean |
| Voids | 0 | Normal |
| Active Staff | 20 | On leaderboard |
| Vendor Spend | $0 | This week |
| Open Issues | 0 | All clear |

### Quick Nav Buttons (Command Center)

| Button | Navigation Target | Status |
|--------|------------------|--------|
| Pay Outs | Store Runs screen | **MINOR ISSUE** - Label says "Pay Outs" but navigates to "Store Runs" (same functionality, naming inconsistency) |
| Voids | Void Hunter screen | PASS |
| Invoices | Vendor Invoices screen | PASS |
| Security | Security Records screen | PASS |

### Wi-Fi Proximity

Shows 8 staff members all marked as "ON FLOOR" with amber dot indicators. Staff names match the database entries (Gavin Thomas, Moe Thomas, Che Lyftogt, Steven Klein, Jessica Gailey, Karlee Sturtz, Ashley Holding, Bryson Cook).

### Void Hunter Screen

Displays three metrics (0 Voids, 0 Comps, 0 Promos) with "RECENT VOIDS" section showing empty state: "No voids — clean week!"

### Vendor Invoices Screen

Full invoice logging form with vendor dropdown (Sawyer's Meats, Hughes Distributing, Fort Dodge Distributing, Confluence Brewing), Total amount field, Invoice # field, 7 category buttons (MEAT, BREAD, PRODUCE, LIQUOR, BEER, SUPPLIES, MISC), invoice photo capture, and "Log Invoice" submit button. Shows THIS WEEK'S SPEND: $0.00.

### Security Records Screen

Comprehensive audit log showing 391 events in 24 hours with 200 displayed. Metrics include 117 failed logins (from testing), 0 lockouts, 0 PIN changes. Event log shows Clock In, Clock Out, Login, and Failed Login events with proper color coding (green success, red warning), user attribution, IP addresses, and timestamps.

### Bugs Found

1. **Pay Outs naming inconsistency** (Minor): Command Center "Pay Outs" button navigates to "store-run" screen which displays as "STORE RUNS". The home screen also has a separate "Store Runs" quick action that goes to the same place. Should either rename the Command Center button to "Store Runs" or create a separate Pay Outs view.


## Phase 4: Sales Intelligence — All 8 Tabs

### Daily Tab: PASS
- Shows 30-day revenue data from PDQ POS
- DAILY REVENUE chart with sparkline visualization
- Revenue range: $2,089 to $10,095
- Avg daily revenue displayed
- Day-of-week pattern analysis
- 59 alerts count shown in header

### Weekly Tab: PASS
- Shows 8 weeks of week-over-week data
- Each week shows: date range, total revenue, % change vs prior week
- Color-coded: green for positive, red for negative changes
- Good trend visibility

### Product Mix Tab: PASS
- Shows Top Products (41) ranked by revenue
- Category filters: All, Pizza, Food, Beer, Liquor, Pop
- Horizontal bar chart with proportional widths
- Top sellers: Domestic Bucket 6 ($20,846), Lg Community Special ($10,346)

### Voids Tab: PASS (with data bug)
- Total Voids: 36 ($667 total)
- **BUG**: "Employees: 1094" is incorrect — shows voidSummary.length which includes entries where employeeName contains timestamps (e.g., "10/21/2025 6:11 PM Sally Hart")
- Void/Comp by Employee ranked list with HIGH flags for 4+ voids/day avg
- Good severity indicators

### Weather Tab: PASS
- Weather Impact on Revenue: Dry $6,516, Rainy $6,425 (-1.4%), Snow $6,268 (-3.8%)
- Delivery vs Weather: Sunny 17.6%, Rain/Snow 19.4%
- AI insight about delivery increase in bad weather

### Hours/Heatmap Tab: PASS (Excellent)
- Beautiful color-coded heatmap (16 hours x 7 days)
- Color gradient: gray (low) → amber → red (high)
- Peak: Fri 5pm ($1,417), Sat 5pm ($1,341)
- AI insight about peak hours and staffing recommendations

### Alerts Tab: PASS
- 17 High, 33 Medium, 9 Low severity alerts (59 total)
- Alert types: high void frequency, repeated item void, late night voids, high avg meal cost, high value void
- Same timestamp-in-name data issue as Voids tab
- Clickable alert cards

### Schedule (AI) Tab: PASS
- AI Schedule Intelligence with "Generate" button
- Successfully generates day-by-day staffing recommendations
- Revenue forecasts per day with LIGHT/NORMAL/HEAVY staffing levels
- Color-coded and contextual AI explanations
- Revenue ranges align with historical heatmap data

### Bugs Found in Phase 4:
1. **Voids "Employees: 1094" incorrect** — voidSummary groups by employeeName which contains timestamp+name combos from Z-report parsing
2. **Same issue in Alerts tab** — some alert entries show "11/23/2025 8:01 PM Thomas Dorothy" as employee name


## Phase 5: Z-Report Upload & Yesterday Sales

### Z-Report Upload Screen: PASS

The Z-Report upload screen provides a clean interface for the daily data ingestion workflow. It includes a date picker (optional, auto-detected from PDF), a large upload tap target area labeled "Tap to select Z-Report PDF — PDQ Signature Systems daily report", and a helpful explanation box describing how the AI reads all numbers from the PDF automatically.

### Yesterday Sales Dashboard: PASS (Excellent)

| Metric | Value | Status |
|--------|-------|--------|
| Total Revenue | $4,770 | 130 orders |
| Labor % | 22.5% | On target (green) |
| Voids | 1 ($21) | Normal (amber) |
| Discounts | $54 | — |
| Late Deliveries | 7 | Elevated (amber) |

**Category Breakdown:** Food $2,581 (54%), Beer $825 (17%), Liquor $821 (17%)

**Channel Breakdown:** Table $2,566 (54%), Bar $915 (19%), Delivery $773 (16%), Pickup $517 (11%)

All data is consistent, color-coded, and presented with proportional horizontal bar charts. The layout is clean and information-dense without being overwhelming.


## Phase 6: Forecast, Recipes & Cost, SKU Tracker, Order Guide, Store Runs, Invoices

### Forecast Screen: PASS (Excellent)
- 7-Day Forecast with daily revenue predictions (TODAY $4,808 through MON $3,391)
- HIGH CONFIDENCE rating based on 11 Tuesdays in last 90 days
- Category Trends breakdown (Food, Beer, Liquor, Pop)
- AI Schedule Intelligence with Generate button (tested - works)
- **BUG**: Hourly Sales Pattern shows all $0 for every hour

### Recipes & Cost Screen: PASS
- 10 recipes with categories (appetizer, dessert, drink, entree, pizza, sandwich, side)
- Accordion expansion shows Edit & Ingredients, Recalc, Menu price, Margin
- All costs $0.00 (expected - no ingredient costs entered yet)

### SKU Tracker Screen: PASS (Comprehensive)
- 55+ products across Beer (29) and Liquor (26) categories
- 3 vendors: Fort Dodge Distributing, Hughes Distributing, Hy-Vee Wine & Spirits
- Tabs: Scan Prices, Catalog, Price Alerts, Compare, WoW Delta, + Add
- Search and category/vendor filters functional

### Order Guide Screen: PASS (with data quality issue)
- Sysco vendor with 14 products, real pricing data
- Par levels set for each item
- **BUG**: Duplicate entries with inconsistent formatting (same product appears twice)
- **BUG**: Mozzarella price discrepancy ($98.76 vs $2.02 for same product)

### Store Runs Screen: PASS
- Full form: item, amount, location, category, authorized by, receipt photo
- Manager dropdown with 5 staff members
- THIS WEEK total tracking

### Invoices Screen: PASS
- Full form: vendor dropdown (4 vendors), total, invoice #, category, photo
- THIS WEEK'S SPEND tracking
- 7 category buttons for classification


## Phase 7: Schedule, Shift Handoff, Station Broadcast, Report Issue, Feedback, POS Training, Waste Log

### Schedule Screen: PASS (with minor bug)
- Header: 'MY SCHEDULE'
- Tabs: Schedule | Availability | Requests | Hours
- Schedule tab: Shows current week with shifts for Mychael Mueller
- **BUG**: Duplicate shift entries (same shift appears twice for each day)
- Availability tab: Shows day-by-day availability with toggle switches
- Requests tab: Shows time-off request form with date range picker
- Hours tab: Shows weekly hours tracking with totals

### Shift Handoff Screen: PASS
- Main view: Lists previous shift handoff notes from other staff
- "End My Shift" button: Opens handoff note writing form
- Form includes: textarea for notes, station selector, submit button
- Shows history of past handoff notes with timestamps

### Station Broadcast Screen: PASS (Excellent)
- Header: 'Station Broadcasts - 86'd items, alerts, cross-station comms'
- Tabs: Active | + Broadcast | History
- Active tab: Shows 'All clear — no active broadcasts' with checkmark
- Station filters: All, Kitchen_line, Pizza_side, Bar, Dining_room, Driver, Dishwasher, Management
- + Broadcast form:
  - Type selector: 86'd (red), Un-86'd (green), Alert (yellow)
  - Item Name input with placeholder examples
  - Message (optional) textarea
  - From station selector (7 stations)
  - Notify stations multi-select (front-of-house pre-checked)
  - Submit button changes label based on type ('Broadcast 86'd')
- Smart defaults: 86'd type, Management as source, FOH stations pre-notified

### Report Issue Screen: PASS
- Header: 'ISSUES - Report · Route · Resolve'
- Form: Title input, Details textarea
- Priority buttons: LOW, MEDIUM (default), HIGH, CRITICAL
- Category buttons: EQUIPMENT (default), STAFFING, INVENTORY, SAFETY, OTHER
- Submit button: '+ Report Issue' (red/crimson)

### Feedback Screen: PASS
- Header: 'SHIFT FEEDBACK - Your voice matters · +5 pts'
- Large textarea: 'What worked? What didn't? What was blocked?'
- Category tags: EQUIPMENT, STAFFING, INVENTORY, CUSTOMER, MANAGEMENT
- Submit button: 'Submit · +5 pts' (amber/gold)
- Gamification: +5 points incentive

### POS Training Screen: PASS (Excellent)
- Header: 'POS Training Mode - Training for Mychael Mueller — learn by doing'
- 5 Training Modules:
  1. Taking Phone Orders (beginner) - 5 scenarios, ~15 min
  2. Bar Service Basics (intermediate) - 5 scenarios, ~20 min
  3. Closing Procedures (intermediate) - 4 scenarios, ~15 min
  4. Void & Comp Procedures (advanced) - 3 scenarios, ~10 min
  5. Delivery Driver Essentials (beginner) - 3 scenarios, ~12 min
- Each module: icon, difficulty badge, description, scenario count, time estimate, role requirements
- Beautiful card-based layout

### Waste Log Screen: PASS (Comprehensive)
- Header: 'Waste Tracker - Log waste, track patterns, reduce costs'
- Tabs: + Report | Log | Summary
- Report form: Item name, Waste Type (7 types), Quantity + Unit, Estimated cost, Reason/notes, Preventable toggle
- Submit button: 'Log Waste' (red)
- Unit dropdown: Each, Ounces, Pounds, Cups, Portions


## Phase 8: Ask Brain (AI Assistant)

### Ask Brain Screen: PASS (Excellent)
- Header: 'ASK THE BRAIN' with subtitle 'General knowledge'
- Central icon with prompt: 'What do you need to know?'
- 3 Quick question buttons tested:
  1. "What did we do in sales yesterday?" → "Yesterday, Monday, May 4th, we pulled in $4,769.92." (6 sources)
  2. "Who do I call about a broken keg?" → "Ashley handles all beer and liquor ordering through Hy-Vee Wine & Spirits." (8 sources)
  3. "What does 86'd mean?" → Correct definition with CTAP-specific example (3 sources)
- Chat-style UI: User messages right-aligned (amber), AI responses left-aligned (dark card)
- "Thinking..." loading indicator with spinner during AI processing
- "X SOURCES USED" badge on each response
- Back button works, Brain bottom nav works
- Conversation history persists during session
- LLM integration (invokeLLM) working correctly with knowledge base context


## Phase 9: Gamification

### Photo Missions Screen: PASS (Excellent)
- Header: 'PHOTO MISSIONS' with subtitle 'Earn points by documenting the restaurant'
- Stats: Photos Submitted (0), Points Earned (0)
- 8 Active Missions with Take Photo buttons:
  1. Walk-In Check (+5 pts, 10 photos, +25 bonus)
  2. Station Setup (+5 pts, 10 photos, +25 bonus)
  3. Invoice Capture (+10 pts, 5 photos, +50 bonus)
  4. Equipment Log (+5 pts, 10 photos, +25 bonus)
  5. Prep Quality (+5 pts, 10 photos, +25 bonus)
  6. Plate Presentation (+10 pts, 10 photos, +50 bonus)
  7. Delivery Proof (+5 pts, 10 photos, +25 bonus)
  8. Daily Special (+15 pts, 5 photos, +75 bonus)

### Badges/Achievements Screen: PASS (Comprehensive)
- Header: 'ACHIEVEMENTS' — 0 of 18 earned
- 6 Categories x 3 badges = 18 total:
  - GETTING STARTED: First Clock In, First Checklist, App Explorer
  - RELIABILITY: Iron Streak (7), Month of Steel (30), Never Late (14)
  - QUALITY: Photo Pro (50), Zero Waste Week (7), Checklist Champion (30)
  - ENGAGEMENT: Feedback King (20), Brain Master (50), Team Player (10)
  - LEADERSHIP: Mentor (5), Shift Captain (10), Problem Solver (20)
  - LONGEVITY: 90 Day Veteran (90), Six Month Legend (180), Lifer (365)
- Each badge: emoji icon, title, description, progress bar, percentage

### Rewards Shop Screen: PASS (Excellent)
- Header: 'REWARDS SHOP' — 'Spend your points on real rewards'
- Balance: 0 points available
- 6 Tiers (12 rewards total):
  - Bronze: Free Shift Meal (100), CTap T-Shirt (200)
  - Silver: $10 Gift Card (300), Priority Scheduling (500)
  - Gold: $25 Gift Card (750), Day Off Request Priority (1000)
  - Platinum: $50 Gift Card (1500), Custom Schedule Week (1500)
  - Diamond: $100 Gift Card (2500), Paid Day Off (2500)
  - Legend: $200 Gift Card (5000), Legend Parking Spot (5000)

### Leaderboard Screen: PASS
- Header: 'LEADERBOARD' — 'Score = shift priority'
- 18 staff members ranked with scores (all 0 currently)
- Top 3 highlighted with gold rank numbers
- KEY badge for managers/key holders
- Shows role, void count, score for each entry
- Owner (Mychael Mueller) correctly excluded from staff ranking


## Phase 10: Profile, Intel Briefings, Compliance, Bottom Nav

### Profile Screen (Bottom Nav): PASS
- Header: 'PROFILE'
- Avatar: Large circle with 'M' initial (amber border)
- Name: Mychael Mueller, Role: Owner
- KEY EMPLOYEE badge
- Stats: Score 0, Streak 0, Priority 50
- Details: Department = Management, Role = Owner, Employee # = 001
- Change PIN button (amber) → Opens Change PIN form
- Sign Out button → Logs out correctly

### Change PIN Screen: PASS
- Header: 'Change PIN - Update your login PIN'
- Security Notice: 'Your PIN is your identity. Never share it. PINs must be 4-8 digits.'
- 3 fields: Current PIN, New PIN (4-8 digits), Confirm New PIN
- Each field has show/hide toggle button
- Change PIN submit button (amber)
- Back navigation works

### Intel Briefings Screen: PASS (Excellent)
- Header: 'INTELLIGENCE BRIEFINGS - Role-based insights for management'
- Generate New button (amber)
- Filter tabs: All, Mychael, Ashley, Tom
- 3 briefings displayed (May 4 date):
  1. Tom: "Daily Kitchen Briefing for Tom: May 3rd, 2026" — record-breaking $11,871.98 Saturday, void concerns
  2. Ashley: "Bar Daily Briefing: Strong Saturday, Monitor Voids" — beer/liquor outperforming, void frequency high
  3. Mychael: "Daily Briefing for Mychael: Staffing & Revenue Outlook" — sales trends, scheduling decisions, void anomalies
- Each briefing: role icon, name badge, date, 'notified' status, title, preview text
- Role-specific content tailored to each manager's responsibilities

### Compliance Screen: PASS (Comprehensive)
- Header: 'Compliance & Intel - Iowa Laws · Commodity Trends · Cost Benchmarks'
- 5 Tabs tested:
  1. **Food Safety**: Iowa Food Code critical temperatures (Cold Holding 41°F, Hot Holding 135°F, Poultry 165°F, Ground Meats 155°F, Pork 145°F, Cooling steps, Handwashing 100°F, Sanitizing 171°F). Certification Requirements accordion. Violation Penalties accordion. Iowa Public Inspection Database link.
  2. **Labor Law**: Iowa Wage Requirements ($7.25/hr min, $4.35/hr tipped, $2.90/hr tip credit, $30+/month threshold, 40 hrs/week OT, 1.5x rate). Key Iowa Labor Rules, Youth Employment, Workers' Comp accordions.
  3. **Commodity Trends**: USDA 2026 Price Forecast (Beef +6.3%, Pork +0.4%, Eggs -29.4%, Dairy Declining). Current Commodity Prices (Cheddar $1.65/lb, Butter $1.75/lb, Cattle $371.25, Corn $4.776). Live Data Sources (USDA, FRED, CME, NDPSR links).
  4. **Cost Benchmarks**: Target Benchmarks (Pizza Food 20-26%, Bar Pour 15-25%, Prime Cost 55-65%). Industry Benchmarks 2026 (Pizzeria, Full Service, Fast Casual, QSR). NRA Industry Stats ($1.55T total, 42% no profit, +35% food costs, 32.4% avg food cost).
  5. **Liquor Law**: Dramshop Liability (Iowa Code §123.92, $250,000 cap). License Requirements accordion. Penalties accordion. NW Iowa Distributors (Johnson Brothers, Doll Distributing).

### 86'd Alerts Screen: PASS
- Same as Station Broadcasts screen (correct — 86'd Alerts is the broadcast system)
- Tabs: Active, + Broadcast, History
- Station filters: All, Kitchen_line, Pizza_side, Bar, Dining_room, Driver, Dishwasher, Management
- Shows 'All clear — no active broadcasts' when empty

### Bottom Nav Verification: PASS
- All 4 buttons work correctly:
  - Home → Home screen
  - Rank → Leaderboard screen
  - Brain → Ask Brain screen
  - Profile → Profile screen
- Active state: amber color indicator
- Inactive state: zinc/gray

