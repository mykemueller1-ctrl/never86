import { headerKey } from "./money";

export const ALIASES: Record<string, string[]> = {
  date: ["date", "businessdate", "reportdate", "day"],
  unit: ["unit", "location", "store", "restaurant", "shop"],
  net: ["netsales", "net", "sales", "netsale"],
  gross: ["grosssales", "gross"],
  comps: ["comps", "comp", "discounts", "promos", "promo"],
  voids: ["voids", "void"],
  foodCost: ["foodcost", "cogs", "actualfoodcost"],
  item: ["item", "description", "product", "name"],
  category: ["category", "type", "gl", "class"],
  pack: ["pack", "packsize", "size"],
  previous: ["previousprice", "pricewas", "oldprice", "priorprice", "lastprice"],
  price: ["price", "unitprice", "pricenow", "currentprice"],
  qty: ["qty", "quantity"],
  weekly: ["weeklyqty", "weeklyquantity", "qtyweek"],
  extension: ["extension", "extended", "linetotal", "amount", "total"],
  role: ["role", "station", "position", "department"],
  person: ["person", "employee", "staff"],
  scheduled: ["scheduledhours", "scheduled", "planhours", "plannedhours"],
  clock: ["clockhours", "actualhours", "workedhours", "punchhours", "hours"],
  wage: ["wage", "hourlywage", "hourlyrate", "rate"],
  labor: ["laborcost", "labordollars", "labor", "wages", "totalpay", "payroll"],
  plate: ["plate", "recipe", "menuitem"],
  menuPrice: ["menuprice", "saleprice"],
  ingredient: ["ingredient", "component"],
  unitCost: ["unitcost", "ingredientcost"],
  platform: ["platform", "channel", "marketplace", "app"],
  commission: ["commission", "commissionfee", "fee"],
  marketing: ["marketing", "ads", "promotions"],
  errors: ["errorcharges", "errors", "refunds", "adjustments"],
  payout: ["payout", "deposit", "netpayout"],
  begin: ["begin", "beginning", "opening", "startcount"],
  end: ["end", "ending", "closing", "onhand", "endcount"],
};

export function parseTable(text: string): string[][] {
  const sample = text.slice(0, 4000);
  const commas = sample.split(",").length - 1;
  const tabs = sample.split("\t").length - 1;
  if (tabs > commas) {
    return text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.split("\t").map((cell) => cell.trim()))
      .filter((row) => row.some((cell) => cell !== ""));
  }
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

export function columnIndex(headers: string[], field: string): number {
  const aliases = ALIASES[field] ?? [];
  return headers.findIndex((header) => aliases.includes(header));
}

export function readGrid(rows: string[][]) {
  const headers = (rows[0] ?? []).map(headerKey);
  const body = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));
  const index = (field: string) => columnIndex(headers, field);
  const cell = (row: string[], field: string) => {
    const at = index(field);
    if (at < 0) return undefined;
    return row[at] ?? "";
  };
  const has = (field: string) => index(field) >= 0;
  return { headers, body, cell, has };
}
