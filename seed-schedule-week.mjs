import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get all staff by department
const [allStaff] = await connection.execute(
  "SELECT id, firstName, lastName, department, jobRole FROM staff ORDER BY department"
);

const staffByDept = {};
allStaff.forEach(s => {
  if (!staffByDept[s.department]) staffByDept[s.department] = [];
  staffByDept[s.department].push(s);
});

// Build a realistic week schedule for May 5-11, 2026 (Mon-Sun)
// Date column is timestamp, so we use ISO format
const weekDays = [
  '2026-05-05T04:00:00.000Z', // Mon
  '2026-05-06T04:00:00.000Z', // Tue
  '2026-05-07T04:00:00.000Z', // Wed
  '2026-05-08T04:00:00.000Z', // Thu
  '2026-05-09T04:00:00.000Z', // Fri
  '2026-05-10T04:00:00.000Z', // Sat
  '2026-05-11T04:00:00.000Z', // Sun
];
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let shiftsAdded = 0;

for (let dayIdx = 0; dayIdx < weekDays.length; dayIdx++) {
  const date = weekDays[dayIdx];
  const isWeekend = dayIdx >= 4; // Fri, Sat, Sun need more staff
  
  // KITCHEN LINE — always need coverage, more on weekends
  const kitchen = staffByDept['kitchen_line'] || [];
  const kitchenCount = isWeekend ? 8 : 5;
  for (let i = 0; i < Math.min(kitchenCount, kitchen.length); i++) {
    const staffIdx = (dayIdx * 3 + i) % kitchen.length;
    const s = kitchen[staffIdx];
    // Split AM/PM shifts
    const isAM = i < Math.ceil(kitchenCount / 2);
    const startTime = isAM ? '10:00' : '16:00';
    const endTime = isAM ? '17:00' : '23:30';
    await connection.execute(
      "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
      [s.id, date, startTime, endTime, s.jobRole, 'kitchen_line']
    );
    shiftsAdded++;
  }
  
  // BAR — evening shifts, more on weekends
  const bar = staffByDept['bar'] || [];
  const barCount = isWeekend ? 5 : 3;
  for (let i = 0; i < Math.min(barCount, bar.length); i++) {
    const staffIdx = (dayIdx * 2 + i) % bar.length;
    const s = bar[staffIdx];
    const startTime = i === 0 ? '11:00' : '16:00'; // One opener
    const endTime = isWeekend ? '01:30' : '00:30';
    await connection.execute(
      "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
      [s.id, date, startTime, endTime, s.jobRole, 'bar']
    );
    shiftsAdded++;
  }
  
  // DINING ROOM — lunch through dinner
  const dining = staffByDept['dining_room'] || [];
  const diningCount = isWeekend ? 3 : 2;
  for (let i = 0; i < Math.min(diningCount, dining.length); i++) {
    const staffIdx = (dayIdx + i) % dining.length;
    const s = dining[staffIdx];
    const startTime = i === 0 ? '11:00' : '16:00';
    const endTime = i === 0 ? '20:00' : '22:00';
    await connection.execute(
      "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
      [s.id, date, startTime, endTime, s.jobRole, 'dining_room']
    );
    shiftsAdded++;
  }
  
  // PIZZA — full day coverage
  const pizza = staffByDept['pizza_side'] || [];
  if (pizza.length > 0) {
    await connection.execute(
      "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
      [pizza[0].id, date, '10:00', '21:00', 'pizza', 'pizza_side']
    );
    shiftsAdded++;
  }
  
  // DRIVERS — lunch and dinner rush, more on weekends
  const drivers = staffByDept['driver'] || [];
  const driverCount = isWeekend ? 5 : 3;
  for (let i = 0; i < Math.min(driverCount, drivers.length); i++) {
    const staffIdx = (dayIdx * 2 + i) % drivers.length;
    const s = drivers[staffIdx];
    const startTime = i < 2 ? '11:00' : '16:00';
    const endTime = i < 2 ? '21:00' : '23:00';
    await connection.execute(
      "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
      [s.id, date, startTime, endTime, 'driver', 'driver']
    );
    shiftsAdded++;
  }
  
  // DISHWASHER — PM shift every day
  const dish = staffByDept['dishwasher'] || [];
  if (dish.length > 0) {
    await connection.execute(
      "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
      [dish[0].id, date, '15:00', '23:30', 'dishwasher', 'dishwasher']
    );
    shiftsAdded++;
  }
  
  // MANAGEMENT — rotate managers, always one on
  const mgmt = staffByDept['management'] || [];
  if (mgmt.length > 0) {
    const mgmtIdx = dayIdx % mgmt.length;
    await connection.execute(
      "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
      [mgmt[mgmtIdx].id, date, '10:00', '22:00', mgmt[mgmtIdx].jobRole, 'management']
    );
    shiftsAdded++;
    
    // On weekends, add a second manager
    if (isWeekend && mgmt.length > 1) {
      const mgmt2Idx = (mgmtIdx + 1) % mgmt.length;
      await connection.execute(
        "INSERT INTO schedule_shifts (staffId, date, startTime, endTime, position, department, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 30001)",
        [mgmt[mgmt2Idx].id, date, '16:00', '01:00', mgmt[mgmt2Idx].jobRole, 'management']
      );
      shiftsAdded++;
    }
  }
  
  console.log(`  ${dayNames[dayIdx]} (${date.split('T')[0]}): scheduled`);
}

console.log(`\n✅ Added ${shiftsAdded} schedule shifts for May 5-11, 2026`);

// Verify
const [verify] = await connection.execute(
  "SELECT DATE(date) as d, COUNT(*) as cnt FROM schedule_shifts WHERE date >= '2026-05-05' GROUP BY DATE(date) ORDER BY d"
);
console.log('\nShifts per day:');
verify.forEach(v => console.log(`  ${v.d}: ${v.cnt} shifts`));

await connection.end();
process.exit(0);
