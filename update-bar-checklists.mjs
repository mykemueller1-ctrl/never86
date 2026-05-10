import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Parse the TSV data
const raw = readFileSync('/home/ubuntu/upload/pasted_content.txt', 'utf8');
const lines = raw.trim().split('\n');
const rows = lines.slice(1).map(line => {
  const cols = line.split('\t');
  return {
    description: cols[1],
    category: cols[2],  // Bartender, Bar Waitstaff, Pizza Side
    shift_type: cols[4], // Open or Close
    priority: parseInt(cols[5]),
    day_of_week: (cols[9] || '').replace(/[{}"]/g, '') || 'Monday',
  };
});

console.log(`Parsed ${rows.length} task rows`);

// Group by day_of_week + shift_type + category
const grouped = {};
for (const row of rows) {
  const key = `${row.day_of_week}|${row.shift_type}|${row.category}`;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(row);
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayAbbrev = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

// Build the checklists
const checklists = [];

for (const day of days) {
  // Bar Opening checklist for this day
  const openBartender = grouped[`${day}|Open|Bartender`] || [];
  const openWaitstaff = grouped[`${day}|Open|Bar Waitstaff`] || [];
  const openPizza = grouped[`${day}|Open|Pizza Side`] || [];
  
  if (openBartender.length > 0 || openWaitstaff.length > 0) {
    const items = [];
    if (openBartender.length > 0) {
      for (const t of openBartender) {
        items.push({ task: t.description, required: t.priority === 1, group: 'Bartender' });
      }
    }
    if (openWaitstaff.length > 0) {
      for (const t of openWaitstaff) {
        items.push({ task: t.description, required: t.priority === 1, group: 'Bar Waitstaff' });
      }
    }
    if (openPizza.length > 0) {
      for (const t of openPizza) {
        items.push({ task: t.description, required: t.priority === 1, group: 'Pizza Side' });
      }
    }
    checklists.push({
      name: `Bar — ${dayAbbrev[day]} Opening`,
      department: 'bar',
      type: 'opening',
      dayOfWeek: day,
      items
    });
  }

  // Bar Closing checklist for this day
  const closeBartender = grouped[`${day}|Close|Bartender`] || [];
  const closeWaitstaff = grouped[`${day}|Close|Bar Waitstaff`] || [];
  const closePizza = grouped[`${day}|Close|Pizza Side`] || [];
  
  if (closeBartender.length > 0 || closeWaitstaff.length > 0) {
    const items = [];
    if (closeBartender.length > 0) {
      for (const t of closeBartender) {
        items.push({ task: t.description, required: t.priority === 1, group: 'Bartender' });
      }
    }
    if (closeWaitstaff.length > 0) {
      for (const t of closeWaitstaff) {
        items.push({ task: t.description, required: t.priority === 1, group: 'Bar Waitstaff' });
      }
    }
    if (closePizza.length > 0) {
      for (const t of closePizza) {
        items.push({ task: t.description, required: t.priority === 1, group: 'Pizza Side' });
      }
    }
    checklists.push({
      name: `Bar — ${dayAbbrev[day]} Closing`,
      department: 'bar',
      type: 'closing',
      dayOfWeek: day,
      items
    });
  }
}

// Pizza Side specific checklists (for pizza_side department staff)
for (const day of days) {
  const openPizza = grouped[`${day}|Open|Pizza Side`] || [];
  const closePizza = grouped[`${day}|Close|Pizza Side`] || [];
  
  if (openPizza.length > 0) {
    const items = openPizza.map(t => ({ task: t.description, required: t.priority === 1 }));
    checklists.push({
      name: `Pizza Side — ${dayAbbrev[day]} Opening`,
      department: 'pizza_side',
      type: 'opening',
      dayOfWeek: day,
      items
    });
  }
  
  if (closePizza.length > 0) {
    const items = closePizza.map(t => ({ task: t.description, required: t.priority === 1 }));
    checklists.push({
      name: `Pizza Side — ${dayAbbrev[day]} Closing`,
      department: 'pizza_side',
      type: 'closing',
      dayOfWeek: day,
      items
    });
  }
}

console.log(`\nBuilt ${checklists.length} checklists:`);
for (const cl of checklists) {
  console.log(`  ${cl.department.padEnd(12)} ${cl.type.padEnd(8)} ${cl.dayOfWeek.padEnd(10)} ${cl.name} (${cl.items.length} items)`);
}

// Delete old generic Bar and Pizza Station checklists
console.log('\n--- Deleting old bar and pizza_side checklists ---');
const [oldBar] = await conn.execute("SELECT id, name FROM checklists WHERE department = 'bar'");
const [oldPizza] = await conn.execute("SELECT id, name FROM checklists WHERE department = 'pizza_side'");
console.log('Old bar:', oldBar.map(r => `${r.id}: ${r.name}`));
console.log('Old pizza:', oldPizza.map(r => `${r.id}: ${r.name}`));

await conn.execute("DELETE FROM checklists WHERE department = 'bar'");
await conn.execute("DELETE FROM checklists WHERE department = 'pizza_side'");

// Insert new checklists
console.log('\n--- Inserting new day-specific checklists ---');
let insertCount = 0;
for (const cl of checklists) {
  await conn.execute(
    "INSERT INTO checklists (name, department, type, items, dayOfWeek) VALUES (?, ?, ?, ?, ?)",
    [cl.name, cl.department, cl.type, JSON.stringify(cl.items), cl.dayOfWeek]
  );
  insertCount++;
}
console.log(`Inserted ${insertCount} new checklists`);

// Verify
const [final] = await conn.execute("SELECT id, name, department, type, dayOfWeek, JSON_LENGTH(items) as cnt FROM checklists WHERE department IN ('bar', 'pizza_side') ORDER BY department, dayOfWeek, type");
console.log(`\n--- Final: ${final.length} bar/pizza checklists ---`);
for (const r of final) {
  console.log(`  ${r.department.padEnd(12)} ${(r.dayOfWeek||'').padEnd(10)} ${(r.type||'').padEnd(8)} ${r.cnt} items | ${r.name}`);
}

await conn.end();
console.log('\nDone!');
