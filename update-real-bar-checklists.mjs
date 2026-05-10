import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const conn = await mysql.createConnection(DATABASE_URL);

// ============================================================
// REAL AM BARTENDER DUTIES (Opening shift)
// Day-specific items: THUR = fold towels, make skewers, make bloody mix
// Mon = pop delivery day (stock pop cooler)
// Tue & Fri = stock walk-in
// ============================================================
const amBartenderItems = [
  { task: "Get out all parmesans, mustards, ketchups, and BBQ sauce caddies for both bar & pizza side", required: true, group: "Setup" },
  { task: "Take out the trashes", required: true, group: "Cleaning" },
  { task: "Stock the coolers including replacing the overstock", required: true, group: "Stocking" },
  { task: "Empty dishwasher and put all dishes back", required: true, group: "Dishes" },
  { task: "Set up bus tubs for both pizza and barside on the bus tub cart", required: true, group: "Setup" },
  { task: "Take out the cans", required: true, group: "Cleaning" },
  { task: "Clean all tables where customers sat — completely wiped off", required: true, group: "Cleaning" },
  { task: "Fill all ice bins plus get 2 extra buckets of ice for new shift", required: true, group: "Ice" },
  { task: "Fill ice bin in kitchen", required: true, group: "Ice" },
  { task: "Cut fruit today", required: true, group: "Prep" },
  { task: "Do silverware", required: true, group: "Prep" },
  { task: "Fold and fill towels (THURSDAY ONLY)", required: false, group: "Thursday Prep", daySpecific: "Thursday" },
  { task: "Make skewers (THURSDAY ONLY)", required: false, group: "Thursday Prep", daySpecific: "Thursday" },
  { task: "Make bloody mix (THURSDAY ONLY)", required: false, group: "Thursday Prep", daySpecific: "Thursday" },
  { task: "Update new shift about open tabs", required: true, group: "Handoff" },
  { task: "Add everything needed to open tabs that are still continuing", required: true, group: "Handoff" },
  { task: "Tidy up, put items back in original spots, wipe off entire bar, make sure bus tub is not a mess", required: true, group: "Cleanup" },
  { task: "Get quarters for the next shift", required: true, group: "Cash" },
  { task: "Empty slop bucket", required: true, group: "Cleaning" },
  { task: "Clean out the sink after dumping slop bucket", required: true, group: "Cleaning" },
  { task: "Make 2 full pitchers of water for next shift (weekends: also pepsi cups half full of water, 4 on each side)", required: true, group: "Prep" },
  { task: "Stock the pop cooler (Pop gets delivered on Mondays)", required: true, group: "Stocking", daySpecific: "Monday" },
  { task: "Stock the walk-in (Must be done Tue & Fri)", required: true, group: "Stocking", daySpecific: "Tuesday,Friday" },
  { task: "Wipe off the specials board when the special was over or ran out", required: true, group: "Cleanup" },
  { task: "Count the ticket bag", required: true, group: "Cash" },
  { task: "Close your till and make sure it was at $500", required: true, group: "Cash" },
  { task: "Ask if there is anything you can do before you leave", required: true, group: "Handoff" },
];

// ============================================================
// REAL PM BARSIDE CLOSING DUTIES
// Day-specific: Wed & Sun = buff floors, Mon = fill ice
// ============================================================
const pmBarsideItems = [
  { task: "Fill BBQ caddies", required: true, group: "Condiments" },
  { task: "Clean caps/caddies", required: true, group: "Condiments" },
  { task: "Marry all the ketchups and mustards", required: true, group: "Condiments" },
  { task: "Fill all parmesans", required: true, group: "Condiments" },
  { task: "Fill red pepper flake shakers", required: true, group: "Condiments" },
  { task: "Fill salt and pepper shakers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Fill both large and small togo boxes", required: true, group: "Stocking" },
  { task: "Get extra chasers for barside (margarita mix, pineapple juice, sour, grenadine, etc.)", required: true, group: "Bar Prep" },
  { task: "Do silverware", required: true, group: "Dishes" },
  { task: "Wipe down all tables", required: true, group: "Cleaning" },
  { task: "Wash and clean under all glass mats/spill mats", required: true, group: "Cleaning" },
  { task: "Clean waitress only & Budweiser mats", required: true, group: "Cleaning" },
  { task: "Fill kids cups/lids, straws, and plastic cups", required: true, group: "Stocking" },
  { task: "Cut fruit today", required: true, group: "Prep" },
  { task: "Fill ice (Monday priority)", required: true, group: "Ice" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock beer in the coolers plus overstock", required: true, group: "Stocking" },
  { task: "Check if any pop is missing and fill/overstock", required: true, group: "Stocking" },
  { task: "Stock the walk-in cooler", required: true, group: "Stocking" },
  { task: "Dump and wash slop bucket", required: true, group: "Cleaning" },
  { task: "Take all dishes back to the kitchen", required: true, group: "Dishes" },
  { task: "Wipe off the bus tub cart", required: true, group: "Cleaning" },
  { task: "BATHROOMS: Windex mirror", required: true, group: "Bathrooms" },
  { task: "BATHROOMS: Wipe down sinks", required: true, group: "Bathrooms" },
  { task: "BATHROOMS: Clean toilets", required: true, group: "Bathrooms" },
  { task: "BATHROOMS: Fill toilet paper", required: true, group: "Bathrooms" },
  { task: "BATHROOMS: Put ice in the urinals", required: true, group: "Bathrooms" },
  { task: "BATHROOMS: Take out trashes and refill new liners", required: true, group: "Bathrooms" },
  { task: "Take out all trashes behind bar and waitress only stand, refill with new liners", required: true, group: "Trash" },
  { task: "Take out cans if they were full", required: true, group: "Trash" },
  { task: "Turn off all TVs and turn down the speaker", required: true, group: "Closing" },
  { task: "Close out the pizza side and bar waitress computers", required: true, group: "Closing" },
  { task: "Wipe off the special board", required: true, group: "Cleaning" },
  { task: "Lock all doors including the padlock on pool room door", required: true, group: "Security" },
  { task: "Put all stools, chairs, and floor mats on top of tables", required: true, group: "Floors" },
  { task: "Sweep all of barside (bathrooms, doorways, behind bar, under all booths)", required: true, group: "Floors" },
  { task: "Check the deck", required: true, group: "Closing" },
  { task: "Mop all of barside (bathrooms, doorways, behind bar, under all booths)", required: true, group: "Floors" },
  { task: "Buff floors (WEDNESDAY & SUNDAY ONLY)", required: false, group: "Floors", daySpecific: "Wednesday,Sunday" },
  { task: "Put down all chairs and stools", required: true, group: "Floors" },
  { task: "Count the ticket bag", required: true, group: "Cash" },
  { task: "Count the deposit and drawer", required: true, group: "Cash" },
  { task: "Turn off air (summer) / Turn heat down to 68 (winter)", required: true, group: "Closing" },
  { task: "Place all items in safe: deposit, drawer money, ticket bag, and pools", required: true, group: "Security" },
  { task: "AM/PM Kitchen tips on top of register in an envelope", required: true, group: "Cash" },
  { task: "Make sure ALL doors are locked including storage room and deck door", required: true, group: "Security" },
  { task: "Set the alarm on your way out!", required: true, group: "Security" },
];

// ============================================================
// REAL PIZZA SIDE CLOSING DUTIES
// ============================================================
const pizzaSideItems = [
  { task: "Fill all BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Wipe down BBQ sauce caddies and clean lids", required: true, group: "Condiments" },
  { task: "Marry all ketchups and mustards", required: true, group: "Condiments" },
  { task: "Fill all parmesan (Sunday: make an old parm)", required: true, group: "Condiments" },
  { task: "Fill red pepper flake shakers", required: true, group: "Condiments" },
  { task: "Fill salt & pepper shakers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Fill small and large togo boxes", required: true, group: "Stocking" },
  { task: "Make sure all parmesans, ketchups/mustards, and BBQ caddies are put away in walk-in", required: true, group: "Condiments" },
  { task: "Clean coffee pot, refill coffee bags, refill sugar packets/sugar container, fill one coffee pot with water", required: true, group: "Coffee Station" },
  { task: "Take apart pop machine, run through dishwasher & soak pop tabs (SATURDAY NIGHTS ONLY)", required: false, group: "Deep Clean", daySpecific: "Saturday" },
  { task: "Wipe down pop machine", required: true, group: "Cleaning" },
  { task: "Take dishes back to kitchen, completely wipe off bus tub (before sweeping so you can sweep underneath)", required: true, group: "Dishes" },
  { task: "Fill ice to the very top (push all the way back)", required: true, group: "Ice" },
  { task: "Fill straws, kids cups/lids, and Pepsi cups above pop machine", required: true, group: "Stocking" },
  { task: "Roll ALL silverware (do NOT leave any clean silverware unrolled)", required: true, group: "Silverware" },
  { task: "Make sure all tables are completely wiped down and cleaned with sanitizer", required: true, group: "Cleaning" },
  { task: "Turn off all TVs", required: true, group: "Closing" },
  { task: "Wipe off the special board", required: true, group: "Cleaning" },
  { task: "Make sure deck is cleared off", required: true, group: "Closing" },
  { task: "Sweep dining room and pool room", required: true, group: "Floors" },
  { task: "Windex double doors and games in pool room", required: true, group: "Cleaning" },
  { task: "Drop any money owed to bar / do checkout", required: true, group: "Cash" },
  { task: "--- STOP: Get checklist approved by bartender/manager before mopping ---", required: true, group: "Approval" },
  { task: "All customers must be gone before mopping", required: true, group: "Mop" },
  { task: "Mop dining room and pool room", required: true, group: "Mop" },
];

// ============================================================
// DELETE old generic bar/pizza checklists and insert real ones
// ============================================================

console.log("Deleting old generic bar opening/closing checklists...");

// Delete generic bar checklists (keep the day-specific ones we already added from the TSV data)
await conn.execute(`DELETE FROM checklists WHERE department = 'bar' AND name LIKE '%Opening%' AND dayOfWeek IS NULL`);
await conn.execute(`DELETE FROM checklists WHERE department = 'bar' AND name LIKE '%Closing%' AND dayOfWeek IS NULL`);

// Delete generic pizza_side closing (keep day-specific ones)
await conn.execute(`DELETE FROM checklists WHERE department = 'pizza_side' AND name LIKE '%Closing%' AND dayOfWeek IS NULL`);

// Also delete any generic "Bar Station Opening" or "Bar Station Closing"
await conn.execute(`DELETE FROM checklists WHERE department = 'bar' AND name LIKE 'Bar Station%'`);
await conn.execute(`DELETE FROM checklists WHERE department = 'pizza_side' AND name LIKE 'Pizza Station%'`);

console.log("Inserting real AM Bartender Duties...");
await conn.execute(
  `INSERT INTO checklists (name, department, type, items, dayOfWeek) VALUES (?, ?, ?, ?, ?)`,
  ["AM Bartender Duties", "bar", "opening", JSON.stringify(amBartenderItems), null]
);

console.log("Inserting real PM Barside Closing Duties...");
await conn.execute(
  `INSERT INTO checklists (name, department, type, items, dayOfWeek) VALUES (?, ?, ?, ?, ?)`,
  ["PM Barside Closing Duties", "bar", "closing", JSON.stringify(pmBarsideItems), null]
);

console.log("Inserting real Pizza Side Closing Duties...");
await conn.execute(
  `INSERT INTO checklists (name, department, type, items, dayOfWeek) VALUES (?, ?, ?, ?, ?)`,
  ["Pizza Side Closing Duties", "pizza_side", "closing", JSON.stringify(pizzaSideItems), null]
);

// Verify
const [rows] = await conn.execute(`SELECT id, name, department, type, dayOfWeek, JSON_LENGTH(items) as itemCount FROM checklists WHERE department IN ('bar', 'pizza_side') ORDER BY department, type, name`);
console.log("\n=== Current Bar & Pizza Side Checklists ===");
for (const r of rows) {
  console.log(`  [${r.id}] ${r.name} (${r.department}/${r.type}) — ${r.itemCount} items ${r.dayOfWeek ? `[${r.dayOfWeek}]` : '[every day]'}`);
}

await conn.end();
console.log("\nDone! Real checklists applied.");
