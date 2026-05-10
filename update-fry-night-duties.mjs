import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Items are stored as JSON array in the 'items' column with format:
// { category: "group", required: true, text: "task text" }

const newItems = [
  // 1st Off (6 items)
  { category: "1st Off", required: true, text: "Flip cold table" },
  { category: "1st Off", required: true, text: "Clean take out everything in bottom of cold tables" },
  { category: "1st Off", required: true, text: "Clean BBQ room — take trash out, also mop" },
  { category: "1st Off", required: true, text: "Sweep the line" },
  { category: "1st Off", required: true, text: "Clean Pepsi cooler and Windex the windows" },
  { category: "1st Off", required: true, text: "Take out all full trashes" },

  // 2nd Off (9 items)
  { category: "2nd Off", required: true, text: "Clean out filter fryer — spray in the fryers with oven cleaner" },
  { category: "2nd Off", required: true, text: "Clean microwave" },
  { category: "2nd Off", required: true, text: "Fill all sauce bottles: Mayo, Butter, Water jug, all wing sauces" },
  { category: "2nd Off", required: true, text: "Fill up all meats: Chops 8, Turkey 10, Ham 10, Corn Beef 8, Mexi Chix 8" },
  { category: "2nd Off", required: true, text: "Sweep line" },
  { category: "2nd Off", required: true, text: "Clean sides of both garbages" },
  { category: "2nd Off", required: true, text: "Make sure all veggies/ribs on line are wrapped" },
  { category: "2nd Off", required: true, text: "Scales cleaned — both of them" },
  { category: "2nd Off", required: true, text: "Make sure sauce cups are straightened up and filled up" },

  // Closer (8 items)
  { category: "Closer", required: true, text: "Stainless steel polish all fry line equipment" },
  { category: "Closer", required: true, text: "Restock used meats, fill sauce bottles if need be" },
  { category: "Closer", required: true, text: "Clean flat top" },
  { category: "Closer", required: true, text: "Sweep & mop fry line after cleaning flat top" },
  { category: "Closer", required: true, text: "Spatulas in dish pit" },
  { category: "Closer", required: true, text: "Half sheet pan is replaced" },
  { category: "Closer", required: true, text: "All knives are cleaned" },
  { category: "Closer", required: true, text: "Make sure hoods are off and all other equipment is turned off" },
];

// Update checklist 60003 with new name and items
await conn.execute(
  `UPDATE checklists SET name = 'Fry Line Night Duties', items = ? WHERE id = 60003`,
  [JSON.stringify(newItems)]
);

console.log(`✅ Fry Line Night Duties (ID 60003) updated: ${newItems.length} items`);
console.log(`   1st Off: 6 items`);
console.log(`   2nd Off: 9 items`);
console.log(`   Closer: 8 items`);

await conn.end();
