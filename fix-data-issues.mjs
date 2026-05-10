import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("=== FIXING ALL DATA ISSUES ===\n");

// FIX 1: "Gavin Noore" in void records → "Gavin Nore" to match staff
console.log("FIX 1: Gavin Noore → Gavin Nore in void records");
const [fix1] = await connection.execute(
  "UPDATE void_records SET employeeName = 'Gavin Nore' WHERE employeeName = 'Gavin Noore'"
);
console.log(`  ✅ Updated ${fix1.affectedRows} records\n`);

// FIX 2: Clean up void records with timestamps in employeeName
console.log("FIX 2: Fix void records with timestamps in employeeName");
const [badNames] = await connection.execute(
  "SELECT DISTINCT employeeName FROM void_records WHERE employeeName REGEXP '^[0-9]'"
);
console.log(`  Found ${badNames.length} records with timestamp-prefixed names:`);
for (const bn of badNames) {
  // Extract the actual name from strings like "3/8/2026 10:39 PM Jeri Wilson"
  const match = bn.employeeName.match(/\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s+[AP]M\s+(.+)/);
  if (match) {
    const realName = match[1];
    console.log(`  "${bn.employeeName}" → "${realName}"`);
    await connection.execute(
      "UPDATE void_records SET employeeName = ? WHERE employeeName = ?",
      [realName, bn.employeeName]
    );
  } else {
    console.log(`  ⚠️ Could not parse: "${bn.employeeName}"`);
  }
}
console.log(`  ✅ Fixed timestamp-prefixed names\n`);

// FIX 3: "Thomas Dorothy" - check if this should be someone else
// Looking at the POS data, this is likely how the POS exported it
// Let's leave it as-is since it's historical data, but note it
console.log("FIX 3: 'Thomas Dorothy' analysis");
const [td] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM void_records WHERE employeeName = 'Thomas Dorothy'"
);
console.log(`  ${td[0].cnt} void records for 'Thomas Dorothy'`);
console.log(`  NOTE: This appears to be a POS data entry (possibly Dorothy Thomas or a former employee)`);
console.log(`  Leaving as-is in historical records\n`);

// FIX 4: Fix labor % data — the issue is the data was imported as decimal (0.22 = 22%)
// Let's check the actual values
console.log("FIX 4: Labor % analysis");
const [laborCheck] = await connection.execute(
  "SELECT businessDate, laborPct, laborTotal, grandTotal FROM daily_sales WHERE laborPct > 0 ORDER BY businessDate DESC LIMIT 10"
);
console.log("  Recent labor % values:");
laborCheck.forEach(l => {
  const actualPct = Number(l.laborPct) > 1 ? Number(l.laborPct) : Number(l.laborPct) * 100;
  console.log(`    ${l.businessDate}: ${l.laborPct}% (labor $${l.laborTotal} / sales $${l.grandTotal}) → actual: ${actualPct.toFixed(1)}%`);
});

// Check if the values are stored as decimals (0.22) or percentages (22)
const [avgLabor] = await connection.execute(
  "SELECT AVG(laborPct) as avg, MAX(laborPct) as max FROM daily_sales WHERE laborPct > 0"
);
const avg = Number(avgLabor[0].avg);
const max = Number(avgLabor[0].max);
console.log(`  Average: ${avg}, Max: ${max}`);

if (max < 1) {
  // Values are stored as decimals, need to multiply by 100
  console.log("  Values appear to be stored as decimals (0.22 = 22%). Converting...");
  await connection.execute("UPDATE daily_sales SET laborPct = laborPct * 100 WHERE laborPct > 0 AND laborPct < 1");
  console.log("  ✅ Converted labor % from decimal to percentage\n");
} else if (max > 1 && max < 50) {
  console.log("  Values appear to already be in percentage format. No fix needed.\n");
} else {
  console.log("  Mixed values detected. Manual review needed.\n");
}

// FIX 5: Add more schedule data for this week (May 5-11, 2026)
console.log("FIX 5: Seed schedule shifts for this week (May 5-11, 2026)");

// Get all staff IDs by department for scheduling
const [allStaff] = await connection.execute(
  "SELECT id, firstName, lastName, department, jobRole FROM staff ORDER BY department"
);

const staffByDept = {};
allStaff.forEach(s => {
  if (!staffByDept[s.department]) staffByDept[s.department] = [];
  staffByDept[s.department].push(s);
});

// Check existing shifts for this week
const [existingShifts] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM schedule_shifts WHERE date >= '2026-05-05' AND date <= '2026-05-11'"
);
console.log(`  Existing shifts this week: ${existingShifts[0].cnt}`);

if (existingShifts[0].cnt < 10) {
  // Build a realistic week schedule
  const weekDays = ['2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10', '2026-05-11'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  let shiftsAdded = 0;
  
  for (let dayIdx = 0; dayIdx < weekDays.length; dayIdx++) {
    const date = weekDays[dayIdx];
    const dayName = dayNames[dayIdx];
    const isWeekend = dayIdx >= 4; // Fri, Sat, Sun
    
    // Kitchen line — always need coverage
    const kitchenStaff = staffByDept['kitchen_line'] || [];
    const kitchenCount = isWeekend ? 6 : 4;
    for (let i = 0; i < Math.min(kitchenCount, kitchenStaff.length); i++) {
      // Rotate who works which day
      const staffIdx = (dayIdx + i) % kitchenStaff.length;
      const s = kitchenStaff[staffIdx];
      const startTime = i < 2 ? '10:00' : '16:00'; // AM shift or PM shift
      const endTime = i < 2 ? '17:00' : '23:00';
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'published', 'system')",
        [s.id, date, startTime, endTime, s.jobRole, s.department]
      );
      shiftsAdded++;
    }
    
    // Bar — more on weekends
    const barStaff = staffByDept['bar'] || [];
    const barCount = isWeekend ? 4 : 2;
    for (let i = 0; i < Math.min(barCount, barStaff.length); i++) {
      const staffIdx = (dayIdx + i) % barStaff.length;
      const s = barStaff[staffIdx];
      const startTime = '16:00';
      const endTime = '01:00';
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'published', 'system')",
        [s.id, date, startTime, endTime, s.jobRole, s.department]
      );
      shiftsAdded++;
    }
    
    // Dining room
    const diningStaff = staffByDept['dining_room'] || [];
    const diningCount = isWeekend ? 3 : 2;
    for (let i = 0; i < Math.min(diningCount, diningStaff.length); i++) {
      const staffIdx = (dayIdx + i) % diningStaff.length;
      const s = diningStaff[staffIdx];
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'published', 'system')",
        [s.id, date, '11:00', '20:00', s.jobRole, s.department]
      );
      shiftsAdded++;
    }
    
    // Pizza
    const pizzaStaff = staffByDept['pizza_side'] || [];
    if (pizzaStaff.length > 0) {
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'published', 'system')",
        [pizzaStaff[0].id, date, '11:00', '21:00', 'pizza', 'pizza_side']
      );
      shiftsAdded++;
    }
    
    // Drivers — more on weekends
    const driverStaff = staffByDept['driver'] || [];
    const driverCount = isWeekend ? 5 : 3;
    for (let i = 0; i < Math.min(driverCount, driverStaff.length); i++) {
      const staffIdx = (dayIdx + i) % driverStaff.length;
      const s = driverStaff[staffIdx];
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'published', 'system')",
        [s.id, date, '11:00', '22:00', 'driver', 'driver']
      );
      shiftsAdded++;
    }
    
    // Dishwasher
    const dishStaff = staffByDept['dishwasher'] || [];
    if (dishStaff.length > 0) {
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'published', 'system')",
        [dishStaff[0].id, date, '15:00', '23:00', 'dishwasher', 'dishwasher']
      );
      shiftsAdded++;
    }
    
    // Management — at least one manager per day
    const mgmtStaff = staffByDept['management'] || [];
    const mgmtIdx = dayIdx % mgmtStaff.length;
    if (mgmtStaff.length > 0) {
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'published', 'system')",
        [mgmtStaff[mgmtIdx].id, date, '10:00', '22:00', mgmtStaff[mgmtIdx].jobRole, 'management']
      );
      shiftsAdded++;
    }
  }
  
  console.log(`  ✅ Added ${shiftsAdded} schedule shifts for May 5-11, 2026\n`);
}

// FIX 6: Verify void record names now match staff
console.log("FIX 6: Final void name verification");
const [remainingUnmatched] = await connection.execute(
  "SELECT DISTINCT employeeName FROM void_records WHERE employeeName NOT IN (SELECT CONCAT(firstName, ' ', lastName) FROM staff)"
);
console.log(`  Remaining unmatched void names: ${remainingUnmatched.length}`);
remainingUnmatched.forEach(u => console.log(`    - "${u.employeeName}"`));

// FIX 7: Ensure "Kailee Miller" spelling is consistent everywhere
console.log("\nFIX 7: Verify Kailee Miller consistency");
const [kailee] = await connection.execute(
  "SELECT id, firstName, lastName FROM staff WHERE lastName = 'Miller'"
);
console.log(`  Staff record: ${kailee.length > 0 ? kailee[0].firstName + ' ' + kailee[0].lastName : 'NOT FOUND'}`);
const [kaileeVoids] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM void_records WHERE employeeName LIKE '%Miller%'"
);
console.log(`  Void records with 'Miller': ${kaileeVoids[0].cnt}`);

await connection.end();
console.log("\n=== ALL FIXES APPLIED ===");
process.exit(0);
