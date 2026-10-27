import assert from "node:assert/strict";
import test from "node:test";
import { boardFromCsv, buildBoard } from "./build";
import { slicesFromTable } from "./classify";
import { numberValue } from "./money";
import { parseTable } from "./table";
import { tablesFromBuffer } from "./workbook";

const units = [
  { id: "harbor", name: "Harbor Grill" },
  { id: "mill", name: "Mill Street" },
];

const harborPos = `date,unit,net_sales,comps,voids
2026-10-20,Harbor Grill,1000,20,5
2026-10-21,Harbor Grill,1200,10,0
2026-10-22,Harbor Grill,800,15,8`;

const harborLabor = `date,unit,role,person,scheduled_hours,clock_hours,wage,labor_cost
2026-10-22,Harbor Grill,Shift lead,Alex,8,10,20,320`;

const harborInvoice = `date,unit,item,category,pack,previous_price,price,qty,extension
2026-10-22,Harbor Grill,Ground beef,food,10 lb,40,50,4,200
2026-10-22,Harbor Grill,House lager,beverage,,,,,60
2026-10-22,Harbor Grill,Foil pans,paper,,,,,25`;

const harborStatement = `date,unit,platform,subtotal,commission,marketing,error_charges,payout
2026-10-22,Harbor Grill,DoorDash,400,80,20,10,270`;

const millInvoice = `date,unit,item,category,extension
2026-10-22,Mill Street,Cheddar,food,90`;

function sampleBoard(targets: Record<string, number | null> = { labor: 30, food: 30 }) {
  return boardFromCsv({
    units,
    today: "2026-10-22",
    owner: "Owner",
    targets,
    files: [
      { name: "harbor-sales.csv", csv: harborPos },
      { name: "harbor-labor.csv", csv: harborLabor },
      { name: "harbor-invoices.csv", csv: harborInvoice },
      { name: "harbor-doordash.csv", csv: harborStatement },
      { name: "mill-invoices.csv", csv: millInvoice },
    ],
  });
}

test("a blank cell is not zero", () => {
  assert.equal(numberValue(""), null);
  assert.equal(numberValue("-"), null);
  assert.equal(numberValue("\u2014"), null);
  assert.equal(numberValue("0"), 0);
  const board = boardFromCsv({
    units: [{ id: "harbor", name: "Harbor Grill" }],
    today: "2026-10-22",
    files: [
      {
        name: "invoice.csv",
        csv: "item,extension\nBeef,\nLager,12",
      },
    ],
  });
  const harbor = board.scopes.find((scope) => scope.id === "harbor");
  const food = harbor?.tiles.find((tile) => tile.category === "food");
  assert.equal(food?.spend.amount, null);
  assert.equal(food?.spend.label, "Missing");
});

test("Harbor callouts use whole dollars and the operator target", () => {
  const board = sampleBoard();
  const harbor = board.scopes.find((scope) => scope.id === "harbor");
  assert.ok(harbor);
  const labor = harbor.tiles.find((tile) => tile.category === "labor");
  const food = harbor.tiles.find((tile) => tile.category === "food");
  assert.equal(
    labor?.note,
    "Labor ran $80 over today. That's 40% of sales, and your target is 30%."
  );
  assert.equal(labor?.noteLabel, "Verified");
  assert.equal(food?.note, "Food came in $40 under today. Nice, that's 25% of sales.");
  assert.equal(food?.sourceNote, "Food purchases from invoices. COGS needs a count.");
  assert.equal(harbor.strip[0]?.text, labor?.note);
  assert.equal(harbor.strip[1]?.text, food?.note);
  assert.match(harbor.strip[2]?.text ?? "", /Set a delivery fees target/);
  const other = harbor.tiles.find((tile) => tile.category === "other");
  assert.match(other?.note ?? "", /Set a target for other/);
  assert.equal(other?.note.includes("a other"), false);
  assert.equal(JSON.stringify(harbor).includes("\u2014"), false);
  assert.equal(JSON.stringify(harbor.actions).includes("Alex"), false);
});

test("no target is a prompt, never an invented percent", () => {
  const board = sampleBoard({});
  const harbor = board.scopes.find((scope) => scope.id === "harbor");
  const labor = harbor?.tiles.find((tile) => tile.category === "labor");
  assert.equal(labor?.targetPct, null);
  assert.match(labor?.note ?? "", /Set a labor target/);
  assert.equal(labor?.note.includes("30%"), false);
  assert.equal(harbor?.actions.some((move) => move.miss), false);
});

test("a target of zero is a real target", () => {
  const board = sampleBoard({ labor: 0 });
  const harbor = board.scopes.find((scope) => scope.id === "harbor");
  const labor = harbor?.tiles.find((tile) => tile.category === "labor");
  assert.match(labor?.note ?? "", /your target is 0%/);
  assert.equal(labor?.note.includes("Set a labor target"), false);
});

test("missing sales names the POS file and does not invent a percent", () => {
  const board = sampleBoard();
  const mill = board.scopes.find((scope) => scope.id === "mill");
  const food = mill?.tiles.find((tile) => tile.category === "food");
  assert.equal(food?.spend.amount, 90);
  assert.match(food?.note ?? "", /Food dollars: \$90/);
  assert.match(food?.note ?? "", /Food percent: Missing/);
  assert.match(food?.note ?? "", /POS close/);
});

test("all-units rollup stays open when a unit is missing and does not average percents", () => {
  const board = sampleBoard();
  const all = board.scopes[0];
  assert.equal(all.name, "All units");
  const labor = all.tiles.find((tile) => tile.category === "labor");
  assert.equal(labor?.spend.amount, null);
  assert.match(labor?.spend.missing ?? "", /Mill Street/);
  assert.match(all.strip.map((line) => line.text).join("\n"), /Harbor Grill: Labor ran \$80 over/);
  assert.equal(all.actions.length <= 3, true);
  assert.equal(all.actions[0]?.miss, true);
  assert.match(all.actions[0]?.title ?? "", /Harbor Grill: Labor ran \$80 over/);
  assert.equal(all.actions.filter((move) => move.miss).length >= 1, true);
  assert.equal(all.prime.dollars.amount, null);
  assert.match(all.prime.note, /week stays open/i);
});

test("actions cap at 3 and misses outrank a larger statement that has no target", () => {
  const board = sampleBoard();
  const harbor = board.scopes.find((scope) => scope.id === "harbor");
  assert.equal(harbor?.actions.length, 3);
  assert.equal(harbor?.actions[0]?.miss, true);
  assert.equal(harbor?.actions[1]?.miss, true);
  assert.equal(harbor?.actions[2]?.miss, false);
  assert.match(harbor?.actions[2]?.title ?? "", /DoorDash/);
  assert.equal(harbor?.actions[2]?.amount, 110);
});

test("explicit zero void stays zero and an empty week day is not filled with zero sales", () => {
  const board = sampleBoard();
  const harbor = board.scopes.find((scope) => scope.id === "harbor");
  const wednesday = harbor?.days.find((day) => day.date === "2026-10-21");
  assert.equal(wednesday?.voids.amount, 0);
  assert.equal(wednesday?.voids.label, "Verified");
  assert.equal(wednesday?.sales.amount, 1200);
  assert.equal(harbor?.prime.weekStatus, "open");
});

test("delivery fees do not treat a missing marketing column as zero", () => {
  const board = boardFromCsv({
    units: [{ id: "harbor", name: "Harbor Grill" }],
    today: "2026-10-22",
    files: [
      {
        name: "statement.csv",
        csv: "date,platform,commission,error_charges,payout\n2026-10-22,Uber Eats,10,2,80",
      },
    ],
  });
  const delivery = board.scopes.find((scope) => scope.id === "harbor")?.tiles.find((tile) => tile.category === "delivery");
  assert.equal(delivery?.spend.amount, null);
  assert.match(delivery?.spend.missing ?? delivery?.spend.note ?? "", /marketing/i);
  assert.equal(JSON.stringify(delivery).includes("12"), false);
});

test("invoice is not COGS, and a count completes prime cost", () => {
  const open = sampleBoard();
  const harborOpen = open.scopes.find((scope) => scope.id === "harbor");
  assert.equal(harborOpen?.prime.cogs.amount, null);
  assert.match(harborOpen?.prime.note ?? "", /count/i);

  const closed = boardFromCsv({
    units: [{ id: "harbor", name: "Harbor Grill" }],
    today: "2026-10-22",
    files: [
      { name: "sales.csv", csv: "date,net_sales\n2026-10-22,800" },
      { name: "labor.csv", csv: "date,labor_cost\n2026-10-22,200" },
      { name: "invoices.csv", csv: "date,item,category,extension\n2026-10-22,Beef,food,200" },
      { name: "count.csv", csv: "item,category,begin,end\nWalk-in,food,500,450" },
    ],
  });
  const harbor = closed.scopes.find((scope) => scope.id === "harbor");
  assert.equal(harbor?.tiles.find((tile) => tile.category === "food")?.spend.amount, 250);
  assert.equal(harbor?.prime.cogs.amount, 250);
  assert.equal(harbor?.prime.labor.amount, 200);
  assert.equal(harbor?.prime.dollars.amount, 450);
  assert.equal(Math.round(harbor?.prime.percent.amount ?? 0), 56);
});

test("rollup prime uses summed dollars, not an average of percents", () => {
  const board = boardFromCsv({
    units,
    today: "2026-10-22",
    files: [
      {
        name: "sales.csv",
        csv: "date,unit,net_sales\n2026-10-22,Harbor Grill,100\n2026-10-22,Mill Street,300",
      },
      {
        name: "labor.csv",
        csv: "date,unit,labor_cost\n2026-10-22,Harbor Grill,20\n2026-10-22,Mill Street,30",
      },
      {
        name: "invoices.csv",
        csv: "date,unit,item,category,extension\n2026-10-22,Harbor Grill,Beef,food,30\n2026-10-22,Mill Street,Beef,food,30",
      },
      {
        name: "count.csv",
        csv: "unit,category,begin,end\nHarbor Grill,food,0,0\nMill Street,food,0,0",
      },
    ],
  });
  const all = board.scopes[0];
  assert.equal(all.prime.dollars.amount, 110);
  assert.equal(Math.round(all.prime.percent.amount ?? 0), 28);
});

test("one unit is assumed, two units stay unassigned until named", () => {
  const csv = "date,net_sales\n2026-10-22,10";
  const one = slicesFromTable({
    id: "a",
    fileName: "sales.csv",
    rows: parseTable(csv),
    units: [{ id: "only", name: "Only" }],
    readable: true,
  });
  assert.equal(one[0]?.unitId, "only");
  const two = slicesFromTable({
    id: "b",
    fileName: "sales.csv",
    rows: parseTable(csv),
    units,
    readable: true,
  });
  assert.equal(two[0]?.unitId, null);
  const split = slicesFromTable({
    id: "c",
    fileName: "both.csv",
    rows: parseTable("date,unit,net_sales\n2026-10-22,Harbor Grill,10\n2026-10-22,Mill Street,4"),
    units,
    readable: true,
  });
  assert.deepEqual(
    split.map((slice) => slice.unitId).sort(),
    ["harbor", "mill"]
  );
});

test("quoted commas survive and a photo names itself instead of a dollar", () => {
  const rows = parseTable('item,extension\n"Beef, ground",18');
  assert.equal(rows[1]?.[0], "Beef, ground");
  assert.equal(rows[1]?.[1], "18");
  const board = buildBoard({
    units: [{ id: "only", name: "Only" }],
    slices: slicesFromTable({
      id: "photo",
      fileName: "invoice-photo.pdf",
      rows: [],
      units: [{ id: "only", name: "Only" }],
      readable: false,
    }),
    targets: {},
    owner: "Owner",
    today: "2026-10-22",
  });
  const food = board.scopes.find((scope) => scope.id === "only")?.tiles.find((tile) => tile.category === "food");
  assert.equal(food?.spend.amount, null);
  assert.match(food?.spend.missing ?? "", /invoice-photo\.pdf/);
});

test("an excel sheet is read as rows", async () => {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    ["date", "net_sales"],
    ["2026-10-22", "15"],
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Sales");
  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const tables = await tablesFromBuffer(buffer, "sales.xlsx");
  assert.equal(tables[0]?.readable, true);
  assert.equal(tables[0]?.rows[1]?.[1], "15");
});

test("item name can sort beverage without a category column", () => {
  const board = boardFromCsv({
    units: [{ id: "only", name: "Only" }],
    today: "2026-10-22",
    files: [
      { name: "sales.csv", csv: "date,net_sales\n2026-10-22,100" },
      { name: "invoices.csv", csv: "date,item,extension\n2026-10-22,House lager,40" },
    ],
  });
  const beverage = board.scopes.find((scope) => scope.id === "only")?.tiles.find((tile) => tile.category === "beverage");
  assert.equal(beverage?.spend.amount, 40);
  assert.equal(beverage?.spend.label, "Estimated");
});
