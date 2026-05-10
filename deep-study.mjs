import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("=== CTAP DEEP DATA STUDY ===\n");

// PHASE 1: Fix name mismatches
console.log("========================================");
console.log("  PHASE 1: FIX NAME MISMATCHES");
console.log("========================================\n");

// Get all distinct void record employee names
const [voidNames] = await connection.execute(
  "SELECT DISTINCT employeeName, COUNT(*) as cnt FROM void_records GROUP BY employeeName ORDER BY cnt DESC"
);
console.log("All void record employee names:");
voidNames.forEach(v => console.log(`  ${v.employeeName} (${v.cnt} voids)`));

// Get all staff names for comparison
const [staffNames] = await connection.execute(
  "SELECT id, firstName, lastName, CONCAT(firstName, ' ', lastName) as fullName FROM staff ORDER BY lastName"
);
console.log("\nAll staff full names:");
staffNames.forEach(s => console.log(`  ID ${s.id}: ${s.fullName}`));

// Identify mismatches
console.log("\n--- Name Mismatch Analysis ---");
const staffFullNames = staffNames.map(s => s.fullName);
const unmatched = voidNames.filter(v => !staffFullNames.includes(v.employeeName));
console.log(`\nUnmatched void names (${unmatched.length}):`);
unmatched.forEach(u => console.log(`  "${u.employeeName}" (${u.cnt} voids)`));

// Fix known mismatches:
// "Kailee Miller" -> should match "Kaillee Miller" in staff (POS uses Kailee, staff has Kaillee)
// "Thomas Dorothy" -> likely reversed name, should be a real person
// "Kenzy Thompson" -> check if this matches
// "Bryson Cook" -> check if this is in staff

console.log("\n--- Fixing Staff Name: Kaillee -> Kailee ---");
// The POS system uses "Kailee Miller" - that's the real spelling from the Z-reports
// Fix the staff table to match POS
await connection.execute(
  "UPDATE staff SET firstName = 'Kailee' WHERE firstName = 'Kaillee' AND lastName = 'Miller'"
);
console.log("  ✅ Fixed: Kaillee Miller → Kailee Miller (matches POS records)");

// Check Thomas Dorothy - is this a real person or reversed name?
console.log("\n--- Analyzing 'Thomas Dorothy' ---");
const [thomasCheck] = await connection.execute(
  "SELECT * FROM void_records WHERE employeeName = 'Thomas Dorothy' LIMIT 5"
);
console.log(`  Found ${thomasCheck.length} void records for 'Thomas Dorothy'`);
if (thomasCheck.length > 0) {
  console.log(`  Sample: ${JSON.stringify(thomasCheck[0], null, 2)}`);
}
// This is likely "Dorothy Thomas" reversed, but since it's from POS data, 
// it might be how the POS has it. Let's check if we have a Dorothy Thomas in staff
const [dorothy] = await connection.execute(
  "SELECT * FROM staff WHERE firstName = 'Dorothy' OR lastName = 'Dorothy' OR (firstName = 'Thomas' AND lastName = 'Dorothy')"
);
console.log(`  Staff matches for Dorothy/Thomas: ${dorothy.length}`);
// It's likely just how the POS exported it - leave as-is in void records

console.log("\n\n========================================");
console.log("  PHASE 2: STAFF DEEP DIVE");
console.log("========================================\n");

const [fullStaff] = await connection.execute(
  "SELECT * FROM staff ORDER BY department, lastName"
);
console.log(`Total active staff: ${fullStaff.length}\n`);

// Detailed breakdown by department
const departments = {};
fullStaff.forEach(s => {
  if (!departments[s.department]) departments[s.department] = [];
  departments[s.department].push(s);
});

for (const [dept, members] of Object.entries(departments).sort()) {
  console.log(`\n=== ${dept.toUpperCase()} (${members.length} staff) ===`);
  members.forEach(m => {
    const key = m.isKeyEmployee ? ' ⭐KEY' : '';
    const hire = m.hireDate ? ` | Hired: ${m.hireDate}` : '';
    console.log(`  ${m.firstName} ${m.lastName} — ${m.jobRole}${key}${hire}`);
    console.log(`    PIN: ${m.pin} | Points: ${m.totalPoints} | Streak: ${m.currentStreak} | Status: ${m.status}`);
  });
}

console.log("\n\n========================================");
console.log("  PHASE 3: VOID PATTERNS ANALYSIS");
console.log("========================================\n");

// Top voiders
const [topVoiders] = await connection.execute(
  "SELECT employeeName, COUNT(*) as cnt, SUM(amount) as totalAmt FROM void_records GROUP BY employeeName ORDER BY cnt DESC LIMIT 15"
);
console.log("Top 15 Voiders (by count):");
topVoiders.forEach((v, i) => {
  console.log(`  ${i+1}. ${v.employeeName}: ${v.cnt} voids, $${Number(v.totalAmt).toFixed(2)} total`);
});

// Void by type
const [voidTypes] = await connection.execute(
  "SELECT recordType, COUNT(*) as cnt, SUM(amount) as totalAmt FROM void_records GROUP BY recordType ORDER BY cnt DESC"
);
console.log("\nVoid by type:");
voidTypes.forEach(v => console.log(`  ${v.recordType}: ${v.cnt} records, $${Number(v.totalAmt).toFixed(2)}`));

// Void by item type
const [voidItems] = await connection.execute(
  "SELECT itemType, COUNT(*) as cnt, SUM(amount) as totalAmt FROM void_records GROUP BY itemType ORDER BY cnt DESC LIMIT 10"
);
console.log("\nVoid by item type (top 10):");
voidItems.forEach(v => console.log(`  ${v.itemType}: ${v.cnt} records, $${Number(v.totalAmt).toFixed(2)}`));

// Void reasons
const [voidReasons] = await connection.execute(
  "SELECT reason, COUNT(*) as cnt FROM void_records WHERE reason IS NOT NULL AND reason != '' GROUP BY reason ORDER BY cnt DESC LIMIT 10"
);
console.log("\nTop void reasons:");
voidReasons.forEach(v => console.log(`  "${v.reason}": ${v.cnt} times`));

// Monthly void trends
const [monthlyVoids] = await connection.execute(
  "SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as cnt, SUM(amount) as totalAmt FROM void_records GROUP BY month ORDER BY month"
);
console.log("\nMonthly void trends:");
monthlyVoids.forEach(v => console.log(`  ${v.month}: ${v.cnt} voids, $${Number(v.totalAmt).toFixed(2)}`));

console.log("\n\n========================================");
console.log("  PHASE 4: SALES DATA DEEP DIVE");
console.log("========================================\n");

// Daily sales summary stats
const [salesStats] = await connection.execute(
  "SELECT COUNT(*) as days, AVG(grandTotal) as avgDaily, MAX(grandTotal) as bestDay, MIN(grandTotal) as worstDay, SUM(grandTotal) as totalRevenue FROM daily_sales"
);
const ss = salesStats[0];
console.log("Sales Overview:");
console.log(`  Total days tracked: ${ss.days}`);
console.log(`  Total revenue: $${Number(ss.totalRevenue).toFixed(2)}`);
console.log(`  Average daily: $${Number(ss.avgDaily).toFixed(2)}`);
console.log(`  Best day: $${Number(ss.bestDay).toFixed(2)}`);
console.log(`  Worst day: $${Number(ss.worstDay).toFixed(2)}`);

// Day of week analysis
const [dowSales] = await connection.execute(
  "SELECT DAYNAME(businessDate) as dow, AVG(grandTotal) as avgSales, COUNT(*) as cnt FROM daily_sales GROUP BY dow ORDER BY FIELD(dow, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')"
);
console.log("\nAverage sales by day of week:");
dowSales.forEach(d => console.log(`  ${d.dow}: $${Number(d.avgSales).toFixed(2)} (${d.cnt} days)`));

// Category breakdown averages
const [catAvgs] = await connection.execute(
  "SELECT AVG(catFoodAmount) as food, AVG(catBeerAmount) as beer, AVG(catLiquorAmount) as liquor, AVG(catPopAmount) as pop, AVG(catLargePizzasAmount) as pizza FROM daily_sales"
);
const ca = catAvgs[0];
console.log("\nAverage daily category sales:");
console.log(`  Food: $${Number(ca.food).toFixed(2)}`);
console.log(`  Beer: $${Number(ca.beer).toFixed(2)}`);
console.log(`  Liquor: $${Number(ca.liquor).toFixed(2)}`);
console.log(`  Pop: $${Number(ca.pop).toFixed(2)}`);
console.log(`  Large Pizzas: $${Number(ca.pizza).toFixed(2)}`);

// Labor stats
const [laborStats] = await connection.execute(
  "SELECT AVG(laborPct) as avgLabor, MAX(laborPct) as maxLabor, MIN(laborPct) as minLabor, AVG(laborTotal) as avgLaborDollars FROM daily_sales WHERE laborPct > 0"
);
const ls = laborStats[0];
console.log("\nLabor Stats:");
console.log(`  Average labor %: ${Number(ls.avgLabor).toFixed(1)}%`);
console.log(`  Max labor %: ${Number(ls.maxLabor).toFixed(1)}%`);
console.log(`  Min labor %: ${Number(ls.minLabor).toFixed(1)}%`);
console.log(`  Average labor $: $${Number(ls.avgLaborDollars).toFixed(2)}`);

// Delivery stats
const [deliveryStats] = await connection.execute(
  "SELECT AVG(deliveryQty) as avgDeliveries, AVG(avgDeliveryTimeMin) as avgTime, AVG(lateDeliveriesCount) as avgLate FROM daily_sales WHERE deliveryQty > 0"
);
const ds = deliveryStats[0];
console.log("\nDelivery Stats:");
console.log(`  Average deliveries/day: ${Number(ds.avgDeliveries).toFixed(1)}`);
console.log(`  Average delivery time: ${Number(ds.avgTime).toFixed(1)} min`);
console.log(`  Average late deliveries/day: ${Number(ds.avgLate).toFixed(1)}`);

// Recent 7 days
const [recent7] = await connection.execute(
  "SELECT businessDate, grandTotal, totalQty, laborPct, voidsCount, voidsAmount FROM daily_sales ORDER BY businessDate DESC LIMIT 7"
);
console.log("\nLast 7 days of sales:");
recent7.forEach(d => {
  console.log(`  ${d.businessDate}: $${Number(d.grandTotal).toFixed(2)} | ${d.totalQty} orders | Labor ${Number(d.laborPct).toFixed(1)}% | ${d.voidsCount} voids ($${Number(d.voidsAmount).toFixed(2)})`);
});

// Hourly patterns
const [hourlyPatterns] = await connection.execute(
  "SELECT hour, AVG(total) as avgSales, AVG(orders) as avgOrders FROM hourly_sales GROUP BY hour ORDER BY hour"
);
console.log("\nHourly sales patterns (average):");
hourlyPatterns.forEach(h => {
  const bar = '█'.repeat(Math.round(Number(h.avgSales) / 50));
  console.log(`  ${String(h.hour).padStart(2)}:00 — $${Number(h.avgSales).toFixed(0).padStart(4)} | ${Number(h.avgOrders).toFixed(1)} orders ${bar}`);
});

console.log("\n\n========================================");
console.log("  PHASE 5: KNOWLEDGE BASE AUDIT");
console.log("========================================\n");

const [kbAll] = await connection.execute(
  "SELECT id, station, category, question, answer, tags FROM knowledge_entries ORDER BY category, station"
);
console.log(`Total knowledge entries: ${kbAll.length}\n`);

let currentCat = '';
kbAll.forEach(k => {
  if (k.category !== currentCat) {
    currentCat = k.category;
    console.log(`\n  [${currentCat.toUpperCase()}]`);
  }
  const q = k.question ? k.question.substring(0, 60) : 'no question';
  console.log(`    [${k.station || 'all'}] ${q}... tags: ${k.tags || 'none'}`);
});

console.log("\n\n========================================");
console.log("  PHASE 6: SCHEDULE & TIME ENTRIES");
console.log("========================================\n");

// Schedule shifts
const [scheduleStats] = await connection.execute(
  "SELECT COUNT(*) as total, COUNT(DISTINCT staffId) as uniqueStaff, COUNT(DISTINCT date) as uniqueDays FROM schedule_shifts"
);
console.log(`Schedule shifts: ${scheduleStats[0].total} total, ${scheduleStats[0].uniqueStaff} unique staff, ${scheduleStats[0].uniqueDays} unique days`);

const [shiftsByDept] = await connection.execute(
  "SELECT department, COUNT(*) as cnt FROM schedule_shifts GROUP BY department ORDER BY cnt DESC"
);
console.log("\nShifts by department:");
shiftsByDept.forEach(s => console.log(`  ${s.department}: ${s.cnt} shifts`));

// Time entries
const [timeStats] = await connection.execute(
  "SELECT COUNT(*) as total, COUNT(DISTINCT staffId) as uniqueStaff FROM time_entries"
);
console.log(`\nTime entries: ${timeStats[0].total} total, ${timeStats[0].uniqueStaff} unique staff`);

console.log("\n\n========================================");
console.log("  PHASE 7: GAMIFICATION & ACHIEVEMENTS");
console.log("========================================\n");

const [gamStats] = await connection.execute(
  "SELECT COUNT(*) as total, COUNT(DISTINCT staffId) as uniqueStaff FROM gamification_events"
);
console.log(`Gamification events: ${gamStats[0].total} total, ${gamStats[0].uniqueStaff} unique staff`);

const [gamTypes] = await connection.execute(
  "SELECT eventType, COUNT(*) as cnt, SUM(points) as totalPts FROM gamification_events GROUP BY eventType ORDER BY cnt DESC"
);
console.log("\nEvent types:");
gamTypes.forEach(g => console.log(`  ${g.eventType}: ${g.cnt} events, ${g.totalPts} total points`));

// Achievement definitions
const [achievements] = await connection.execute(
  "SELECT * FROM achievement_definitions ORDER BY category, thresholdValue"
);
console.log(`\nAchievement definitions: ${achievements.length}`);
achievements.forEach(a => console.log(`  [${a.category}] ${a.name}: ${a.description} (threshold: ${a.thresholdValue}, bonus: ${a.bonusPoints}pts, difficulty: ${a.difficulty})`));

// Rewards
const [rewards] = await connection.execute(
  "SELECT * FROM rewards WHERE active = 1 ORDER BY pointsCost"
);
console.log(`\nRewards available (active): ${rewards.length}`);
rewards.forEach(r => console.log(`  [${r.tier}] ${r.name}: ${r.pointsCost} pts — ${r.description} (type: ${r.type})`));

console.log("\n\n========================================");
console.log("  PHASE 8: BRIEFINGS & INTEL");
console.log("========================================\n");

// Daily briefings
const [dailyBriefings] = await connection.execute(
  "SELECT id, date, salesYesterday, ordersYesterday, eightySixedItems, specials, shoutouts FROM daily_briefings ORDER BY date DESC"
);
console.log(`Daily briefings: ${dailyBriefings.length}`);
dailyBriefings.forEach(b => {
  console.log(`  ${b.date}: Sales=$${b.salesYesterday} | Orders=${b.ordersYesterday} | 86'd=${b.eightySixedItems || 'none'} | Specials=${b.specials || 'none'}`);
});

// Management briefings
const [mgmtBriefings] = await connection.execute(
  "SELECT id, title, targetRole, briefingType, generatedAt FROM management_briefings ORDER BY generatedAt DESC"
);
console.log(`\nManagement briefings: ${mgmtBriefings.length}`);
mgmtBriefings.forEach(b => console.log(`  ${b.title} (${b.targetRole}/${b.briefingType}) — ${b.generatedAt}`));

// Security events
const [secEvents] = await connection.execute(
  "SELECT COUNT(*) as total FROM security_events"
);
const [secTypes] = await connection.execute(
  "SELECT eventType, COUNT(*) as cnt FROM security_events GROUP BY eventType ORDER BY cnt DESC"
);
console.log(`\nSecurity events: ${secEvents[0].total}`);
secTypes.forEach(s => console.log(`  ${s.eventType}: ${s.cnt}`));

// Recent security events
const [recentSec] = await connection.execute(
  "SELECT eventType, staffName, details, severity, createdAt FROM security_events ORDER BY createdAt DESC LIMIT 10"
);
console.log("\nRecent 10 security events:");
recentSec.forEach(s => console.log(`  [${s.severity}] ${s.eventType} — ${s.staffName}: ${s.details ? s.details.substring(0, 60) : ''}`));

// Station broadcasts
const [broadcasts] = await connection.execute(
  "SELECT COUNT(*) as total FROM station_broadcasts"
);
console.log(`\nStation broadcasts: ${broadcasts[0].total}`);

// Driver reports
const [driverReports] = await connection.execute(
  "SELECT COUNT(*) as total FROM driver_reports"
);
console.log(`\nDriver reports: ${driverReports[0].total}`);

// Invoices
const [invoices] = await connection.execute(
  "SELECT COUNT(*) as total FROM invoices"
);
console.log(`\nInvoices: ${invoices[0].total}`);

// Menu items
const [menuItems] = await connection.execute(
  "SELECT COUNT(*) as total FROM menu_items"
);
console.log(`\nMenu items: ${menuItems[0].total}`);

// Recipes
const [recipeCount] = await connection.execute(
  "SELECT COUNT(*) as total FROM recipes"
);
console.log(`Recipes: ${recipeCount[0].total}`);

// Worker training modules
const [trainingMods] = await connection.execute(
  "SELECT COUNT(*) as total FROM worker_training_modules"
);
console.log(`\nTraining modules: ${trainingMods[0].total}`);

// Worker evaluations
const [evals] = await connection.execute(
  "SELECT COUNT(*) as total FROM worker_evaluations"
);
console.log(`Worker evaluations: ${evals[0].total}`);

// Worker write-ups
const [writeups] = await connection.execute(
  "SELECT COUNT(*) as total FROM worker_write_ups"
);
console.log(`Worker write-ups: ${writeups[0].total}`);

await connection.end();
console.log("\n\n=== DEEP STUDY COMPLETE ===");
process.exit(0);
