import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("=== CTAP DATABASE AUDIT & CLEANUP ===\n");

// 1. Find and remove test accounts
console.log("--- STEP 1: Identify & Remove Test Accounts ---");
const [testAccounts] = await connection.execute(
  "SELECT id, firstName, lastName, department, pin FROM staff WHERE lastName = 'TestPerson' OR firstName = 'NewHire'"
);
console.log(`Found ${testAccounts.length} test accounts:`);
testAccounts.forEach(a => console.log(`  ID ${a.id}: ${a.firstName} ${a.lastName} (${a.department})`));

if (testAccounts.length > 0) {
  const testIds = testAccounts.map(a => a.id);
  // Delete related records from tables that reference staffId
  const relatedTables = [
    'checklist_completions', 'schedule_shifts', 'void_records', 'voids',
    'time_entries', 'gamification_events', 'feedback', 'issues',
    'driver_reports', 'station_broadcasts', 'photo_submissions',
    'staff_achievement_progress', 'staff_achievement_unlocks',
    'worker_evaluations', 'worker_write_ups', 'worker_training_completions',
    'worker_skill_certifications', 'worker_career_track',
    'shift_swap_requests', 'time_off_requests', 'reward_redemptions'
  ];
  
  for (const id of testIds) {
    for (const table of relatedTables) {
      try {
        await connection.execute(`DELETE FROM ${table} WHERE staffId = ?`, [id]);
      } catch (e) {
        // Table might not have staffId column — skip silently
      }
    }
  }
  // Now delete the test staff
  const placeholders = testIds.map(() => '?').join(',');
  await connection.execute(`DELETE FROM staff WHERE id IN (${placeholders})`, testIds);
  console.log(`  ✅ Deleted ${testIds.length} test accounts and their related records\n`);
}

// 2. Check for duplicate staff
console.log("--- STEP 2: Check for Duplicates ---");
const [dupes] = await connection.execute(
  "SELECT firstName, lastName, COUNT(*) as cnt FROM staff GROUP BY firstName, lastName HAVING cnt > 1"
);
if (dupes.length > 0) {
  console.log("⚠️  Duplicate names found:");
  dupes.forEach(d => console.log(`  ${d.firstName} ${d.lastName} appears ${d.cnt} times`));
} else {
  console.log("  ✅ No duplicate names found\n");
}

// 3. Verify all staff records
console.log("--- STEP 3: All Active Staff ---");
const [allStaff] = await connection.execute(
  "SELECT id, firstName, lastName, department, jobRole, pin, isKeyEmployee, status FROM staff ORDER BY department, lastName"
);
console.log(`Total staff: ${allStaff.length}\n`);

const deptCounts = {};
allStaff.forEach(s => {
  deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
});
console.log("Department breakdown:");
Object.entries(deptCounts).sort().forEach(([dept, count]) => {
  console.log(`  ${dept}: ${count} staff`);
});

// 4. Check for orphaned schedule shifts
console.log("\n--- STEP 4: Orphaned Schedule Shifts ---");
const [orphanShifts] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM schedule_shifts WHERE staffId NOT IN (SELECT id FROM staff)"
);
console.log(`  Orphaned shifts: ${orphanShifts[0].cnt}`);
if (orphanShifts[0].cnt > 0) {
  await connection.execute("DELETE FROM schedule_shifts WHERE staffId NOT IN (SELECT id FROM staff)");
  console.log(`  ✅ Deleted ${orphanShifts[0].cnt} orphaned shifts`);
}

// 5. Check for orphaned checklist completions
console.log("\n--- STEP 5: Orphaned Checklist Completions ---");
const [orphanChecklists] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM checklist_completions WHERE staffId NOT IN (SELECT id FROM staff)"
);
console.log(`  Orphaned completions: ${orphanChecklists[0].cnt}`);
if (orphanChecklists[0].cnt > 0) {
  await connection.execute("DELETE FROM checklist_completions WHERE staffId NOT IN (SELECT id FROM staff)");
  console.log(`  ✅ Deleted ${orphanChecklists[0].cnt} orphaned completions`);
}

// 6. Check for orphaned void records (uses employeeName, not staffId)
console.log("\n--- STEP 6: Void Records ---");
const [voidCount] = await connection.execute("SELECT COUNT(*) as cnt FROM void_records");
console.log(`  Total void records: ${voidCount[0].cnt}`);
// Check if any employeeName doesn't match a staff member
const [orphanVoids] = await connection.execute(
  "SELECT DISTINCT employeeName FROM void_records WHERE employeeName NOT IN (SELECT CONCAT(firstName, ' ', lastName) FROM staff)"
);
if (orphanVoids.length > 0) {
  console.log(`  ⚠️ ${orphanVoids.length} void records with unmatched employee names:`);
  orphanVoids.forEach(v => console.log(`    - ${v.employeeName}`));
} else {
  console.log(`  ✅ All void records match staff names`);
}

// 7. Check for orphaned gamification events
console.log("\n--- STEP 7: Orphaned Gamification Events ---");
const [orphanGamification] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM gamification_events WHERE staffId NOT IN (SELECT id FROM staff)"
);
console.log(`  Orphaned gamification events: ${orphanGamification[0].cnt}`);
if (orphanGamification[0].cnt > 0) {
  await connection.execute("DELETE FROM gamification_events WHERE staffId NOT IN (SELECT id FROM staff)");
  console.log(`  ✅ Deleted ${orphanGamification[0].cnt} orphaned gamification events`);
}

// 8. Check for orphaned time entries
console.log("\n--- STEP 8: Orphaned Time Entries ---");
const [orphanTime] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM time_entries WHERE staffId NOT IN (SELECT id FROM staff)"
);
console.log(`  Orphaned time entries: ${orphanTime[0].cnt}`);
if (orphanTime[0].cnt > 0) {
  await connection.execute("DELETE FROM time_entries WHERE staffId NOT IN (SELECT id FROM staff)");
  console.log(`  ✅ Deleted ${orphanTime[0].cnt} orphaned time entries`);
}

// 9. Check checklists are assigned to correct departments
console.log("\n--- STEP 9: Checklist → Department Mapping ---");
const [checklists] = await connection.execute(
  "SELECT id, name, department, type FROM checklists ORDER BY department, name"
);
console.log(`Total checklists: ${checklists.length}`);
checklists.forEach(c => console.log(`  [${c.department}] ${c.name} (${c.type})`));

// 10. Check knowledge base entries
console.log("\n--- STEP 10: Knowledge Base Summary ---");
const [kbEntries] = await connection.execute(
  "SELECT category, COUNT(*) as cnt FROM knowledge_entries GROUP BY category ORDER BY cnt DESC"
);
console.log("Knowledge base by category:");
kbEntries.forEach(k => console.log(`  ${k.category}: ${k.cnt} entries`));

// 11. Check daily sales data
console.log("\n--- STEP 11: Sales Data Summary ---");
const [salesData] = await connection.execute(
  "SELECT COUNT(*) as cnt, MIN(businessDate) as earliest, MAX(businessDate) as latest FROM daily_sales"
);
console.log(`  Daily sales records: ${salesData[0].cnt} (${salesData[0].earliest} to ${salesData[0].latest})`);

const [hourlyData] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM hourly_sales"
);
console.log(`  Hourly sales records: ${hourlyData[0].cnt}`);

// 12. Check schedule shifts
console.log("\n--- STEP 12: Schedule Shifts Summary ---");
const [shiftData] = await connection.execute(
  "SELECT COUNT(*) as cnt, MIN(date) as earliest, MAX(date) as latest FROM schedule_shifts"
);
console.log(`  Schedule shifts: ${shiftData[0].cnt} (${shiftData[0].earliest} to ${shiftData[0].latest})`);

// 13. Check briefings
console.log("\n--- STEP 13: Briefings Summary ---");
const [briefings] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM daily_briefings"
);
const [mgmtBriefings] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM management_briefings"
);
console.log(`  Daily briefings: ${briefings[0].cnt}`);
console.log(`  Management briefings: ${mgmtBriefings[0].cnt}`);

// 14. Final staff list with points
console.log("\n--- STEP 14: Final Clean Staff List ---");
const [finalStaff] = await connection.execute(
  "SELECT id, firstName, lastName, department, jobRole, isKeyEmployee, totalPoints, currentStreak, status FROM staff ORDER BY department, lastName"
);
console.log(`\nFinal count: ${finalStaff.length} staff members\n`);
let currentDept = '';
finalStaff.forEach(s => {
  if (s.department !== currentDept) {
    currentDept = s.department;
    console.log(`\n  === ${currentDept.toUpperCase()} ===`);
  }
  const key = s.isKeyEmployee ? ' [KEY]' : '';
  console.log(`    ${s.firstName} ${s.lastName} — ${s.jobRole}${key} | ${s.totalPoints}pts | ${s.currentStreak}🔥`);
});

await connection.end();
console.log("\n\n=== AUDIT & CLEANUP COMPLETE ===");
process.exit(0);
