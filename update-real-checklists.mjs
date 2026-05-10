import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const conn = await mysql.createConnection(DATABASE_URL);

// First, delete the old generic fry line closing checklist
const [existingFry] = await conn.execute(
  `SELECT id, name FROM checklists WHERE name LIKE '%Fry%Closing%' OR name LIKE '%Fry%closing%'`
);
console.log('Existing Fry closing checklists:', existingFry);

// Delete old fry closing checklists
for (const cl of existingFry) {
  await conn.execute(`DELETE FROM checklists WHERE id = ?`, [cl.id]);
  console.log(`  Deleted: ${cl.name} (id: ${cl.id})`);
}

// Delete old dishwasher closing checklists
const [existingDish] = await conn.execute(
  `SELECT id, name FROM checklists WHERE name LIKE '%Dish%' OR name LIKE '%Driver%Closing%' OR name LIKE '%Driver%closing%'`
);
console.log('Existing Dishwasher/Driver closing checklists:', existingDish);

for (const cl of existingDish) {
  await conn.execute(`DELETE FROM checklists WHERE id = ?`, [cl.id]);
  console.log(`  Deleted: ${cl.name} (id: ${cl.id})`);
}

// ============================================================
// FRY LINE CLOSING — Real staggered duties from printed list
// ============================================================
const fryLineClosingItems = JSON.stringify([
  // 1st off duties
  { text: "1ST OFF: Change pans in cold table", required: true, category: "1st Off" },
  { text: "1ST OFF: Wipe cold tables in and out", required: true, category: "1st Off" },
  { text: "1ST OFF: Vacuum water out of cold tables", required: true, category: "1st Off" },
  { text: "1ST OFF: Clean microwave inside and out", required: true, category: "1st Off" },
  { text: "1ST OFF: Clean freezer and cooler doors", required: true, category: "1st Off" },
  { text: "1ST OFF: Make sure everything on line is labeled, dated, day dotted, and initialed", required: true, category: "1st Off" },
  // 2nd off duties
  { text: "2ND OFF: Fryers filter/change, fill fryer sheet", required: true, category: "2nd Off" },
  { text: "2ND OFF: Clean top and front of fryers", required: true, category: "2nd Off" },
  { text: "2ND OFF: Clean line freezer and wall behind it (includes printer shelf)", required: true, category: "2nd Off" },
  // 3rd off duties
  { text: "3RD OFF: Clean cutting boards", required: true, category: "3rd Off" },
  { text: "3RD OFF: Change pans out of steam table", required: true, category: "3rd Off" },
  { text: "3RD OFF: Empty water & clean steam table", required: true, category: "3rd Off" },
  { text: "3RD OFF: Chip warmer", required: true, category: "3rd Off" },
  { text: "3RD OFF: BBQ station 1 hour before close", required: true, category: "3rd Off" },
  // Closing duties (last person)
  { text: "CLOSING: Scrape boiler off", required: true, category: "Closing" },
  { text: "CLOSING: Clean flat top and empty grease", required: true, category: "Closing" },
  { text: "CLOSING: Final wipe down of tables, appliances, and walls", required: true, category: "Closing" },
  { text: "CLOSING: Turn off everything — steam table, fryers, heat lamp, chip warmer", required: true, category: "Closing" },
  { text: "CLOSING: Final sweep and mop", required: true, category: "Closing" },
  // Handwritten additions (always required)
  { text: "Make sure scale is clean end of night", required: true, category: "Always" },
  { text: "Put Mexican chicken with the meats", required: true, category: "Always" },
  { text: "Clean top of oven", required: true, category: "Always" },
  { text: "Wipe off all shelves", required: true, category: "Always" }
]);

await conn.execute(
  `INSERT INTO checklists (name, department, type, items, createdAt) VALUES (?, ?, ?, ?, NOW())`,
  ['Fry Line — Off Work Duties', 'kitchen_line', 'closing', fryLineClosingItems]
);
console.log('✅ Created: Fry Line — Off Work Duties (23 items, staggered 1st/2nd/3rd off + closing + notes)');

// ============================================================
// DISHWASHER / DRIVERS CLOSING — Real duties from printed list
// ============================================================
const dishDriverClosingItems = JSON.stringify([
  { text: "Clean shelves in dish area", required: true },
  { text: "Clean & put away ALL dishes", required: true },
  { text: "Sweep parking lot & deck", required: true },
  { text: "Change sign", required: true },
  { text: "Shake hallway rugs outside", required: true },
  { text: "Clean hallway table and candy machine", required: true },
  { text: "Clean glass on windows & doors", required: true },
  { text: "Put driver bags away", required: true },
  { text: "Clean dish machine area & clean filter + trap", required: true },
  { text: "Sweep hallway and mop", required: true },
  { text: "Sweep & mop dish area to doorway, clean pop machine area", required: true },
  { text: "TAKE OUT GARBAGE", required: true },
]);

await conn.execute(
  `INSERT INTO checklists (name, department, type, items, createdAt) VALUES (?, ?, ?, ?, NOW())`,
  ['Dishwasher/Drivers — Off Work Duties', 'dishwasher', 'closing', dishDriverClosingItems]
);
console.log('✅ Created: Dishwasher/Drivers — Off Work Duties (12 items)');

// Also create a copy for drivers department
await conn.execute(
  `INSERT INTO checklists (name, department, type, items, createdAt) VALUES (?, ?, ?, ?, NOW())`,
  ['Dishwasher/Drivers — Off Work Duties', 'driver', 'closing', dishDriverClosingItems]
);
console.log('✅ Created: Dishwasher/Drivers — Off Work Duties (drivers dept copy)');

// ============================================================
// POS TRAINING: Fry Line & BBQ Questions
// ============================================================
const [existingTraining] = await conn.execute(
  `SELECT id FROM worker_training_modules WHERE name LIKE '%BBQ%' OR name LIKE '%Fry Line%BBQ%'`
);
for (const t of existingTraining) {
  await conn.execute(`DELETE FROM worker_training_modules WHERE id = ?`, [t.id]);
}

await conn.execute(
  `INSERT INTO worker_training_modules (name, description, category, requiredForTrack, requiredForLevel, estimatedMinutes, assessmentType, passingScore, sourceDocument, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [
    'Fry Line & BBQ Portions',
    'Know your meat weights and BBQ dinner builds. BBQ sandwich = 5oz, Dinner 1 = 7oz, Dinner 2 = 9oz, Dinner 3 = 12oz. ALL BBQ dinners come with coleslaw, beans, bread. Family Packs = meat, coleslaw, beans, bread, pickles.',
    'food_prep',
    'kitchen',
    1,
    10,
    'weight_check',
    100,
    'Printed Fry Line and BBQ Questions sheet'
  ]
);
console.log('✅ Created: Fry Line & BBQ Portions training module');

// Verify final state
const [allChecklists] = await conn.execute(
  `SELECT id, name, department, type, JSON_LENGTH(items) as item_count FROM checklists ORDER BY department, type`
);
console.log('\n=== ALL CHECKLISTS ===');
for (const cl of allChecklists) {
  console.log(`  [${cl.department}] ${cl.name} (${cl.type}) — ${cl.item_count} items`);
}

const [allTraining] = await conn.execute(
  `SELECT id, title, category, difficulty FROM training_modules ORDER BY title`
);
console.log('\n=== ALL TRAINING MODULES ===');
for (const t of allTraining) {
  console.log(`  ${t.title} (${t.category}, ${t.difficulty})`);
}

await conn.end();
console.log('\n✅ Done — checklists updated to match real printed lists');
