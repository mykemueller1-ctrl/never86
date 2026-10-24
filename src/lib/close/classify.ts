import {
  type Category,
  type FileKind,
  headerKey,
  type EvidenceLabel,
} from "./money";
import { readGrid } from "./table";

export interface UnitRef {
  id: string;
  name: string;
}

export interface Slice {
  id: string;
  fileName: string;
  kind: FileKind;
  unitId: string | null;
  rows: string[][];
  readable: boolean;
  detail: string;
}

const NAME_HINTS: Array<[FileKind, RegExp]> = [
  ["statement", /doordash|ubereats|grubhub|statement|delivery/],
  ["count", /inventory|count|onhand/],
  ["menu", /menu|recipe|plate/],
  ["labor", /labor|payroll|schedule|timecard|punch/],
  ["invoice", /invoice|vendor|purchas/],
  ["pos", /pos|sales|zreport|eod|close|daily/],
];

const CATEGORY_RULES: Array<[Category, RegExp]> = [
  ["beverage", /beverage|beer|wine|liquor|soda|coffee|keg|drink|lager|ale|ipa|cider/],
  ["paper", /paper|packag|napkin|foil|container|glove|supply|supplies/],
  ["delivery", /delivery|doordash|uber|grubhub|commission/],
  ["labor", /labor|payroll|wage/],
  ["food", /food|produce|grocery|beef|chicken|meat|dairy|cheese|cheddar|seafood|dough|cogs/],
  ["other", /other|misc/],
];

export function matchUnit(value: string | undefined, units: UnitRef[]): string | null {
  if (!value) return null;
  const key = headerKey(value);
  if (!key) return null;
  const exact = units.find((unit) => headerKey(unit.name) === key || headerKey(unit.id) === key);
  if (exact) return exact.id;
  return (
    units.find((unit) => {
      const name = headerKey(unit.name);
      return name.length >= 4 && (key.includes(name) || name.includes(key));
    })?.id ?? null
  );
}

export function kindFromName(fileName: string): FileKind {
  const key = headerKey(fileName);
  for (const [kind, pattern] of NAME_HINTS) {
    if (pattern.test(key)) return kind;
  }
  return "unknown";
}

export function detectKinds(fileName: string, rows: string[][]): FileKind[] {
  const { has } = readGrid(rows);
  const scores: Record<FileKind, number> = {
    pos: 0,
    labor: 0,
    invoice: 0,
    menu: 0,
    statement: 0,
    count: 0,
    unknown: 0,
  };
  if (has("commission") || has("marketing") || has("errors") || has("platform")) scores.statement += 5;
  if (has("begin") || has("end")) scores.count += 5;
  if (has("ingredient")) scores.menu += 5;
  if (has("scheduled") || has("clock") || has("labor") || has("wage")) scores.labor += 4;
  if ((has("item") || has("plate")) && (has("price") || has("extension") || has("unitCost"))) {
    scores.invoice += 4;
  }
  if (has("net") || has("gross") || has("comps") || has("voids") || has("foodCost")) scores.pos += 4;
  const nameKind = kindFromName(fileName);
  if (nameKind !== "unknown") scores[nameKind] += 1;
  const found = (Object.keys(scores) as FileKind[]).filter((kind) => kind !== "unknown" && scores[kind] >= 4);
  if (found.length) return found;
  if (nameKind !== "unknown") return [nameKind];
  return ["unknown"];
}

export function categoryFromText(value: string | undefined): { category: Category; explicit: boolean } | null {
  if (!value || !value.trim()) return null;
  const key = value.toLowerCase();
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(key)) return { category, explicit: true };
  }
  return null;
}

export function categoryForLine(categoryCell: string | undefined, item: string | undefined): {
  category: Category;
  label: EvidenceLabel;
  note: string;
} {
  const fromColumn = categoryFromText(categoryCell);
  if (fromColumn && categoryCell && categoryCell.trim()) {
    const bucket = fromColumn.category === "labor" || fromColumn.category === "delivery" ? "other" : fromColumn.category;
    return {
      category: bucket,
      label: "Verified",
      note: bucket === fromColumn.category ? "Category is on the file." : "That line stays in Other. Labor and delivery fees come from their own files.",
    };
  }
  const fromItem = categoryFromText(item);
  if (fromItem && fromItem.category !== "labor" && fromItem.category !== "delivery" && fromItem.category !== "other") {
    return {
      category: fromItem.category,
      label: "Estimated",
      note: "Category read from the item name.",
    };
  }
  return { category: "other", label: "Estimated", note: "No category on the line." };
}

function detailFor(kind: FileKind, unitNamed: boolean): string {
  const base: Record<FileKind, string> = {
    pos: "Read as a POS close.",
    labor: "Read as labor.",
    invoice: "Read as an invoice.",
    menu: "Read as a menu or recipe.",
    statement: "Read as a delivery statement.",
    count: "Read as an inventory count.",
    unknown: "Choose a type. The headers did not settle it.",
  };
  if (!unitNamed) return `${base[kind]} Choose a unit. The file does not name one.`;
  return base[kind];
}

export function slicesFromTable(input: {
  id: string;
  fileName: string;
  rows: string[][];
  units: UnitRef[];
  readable: boolean;
  detail?: string;
  kind?: FileKind;
  unitId?: string | null;
}): Slice[] {
  if (!input.readable) {
    const kind = input.kind ?? kindFromName(input.fileName);
    const named = matchUnit(input.fileName, input.units);
    const unitId =
      input.unitId !== undefined
        ? input.unitId
        : named ?? (input.units.length === 1 ? input.units[0]?.id ?? null : null);
    return [
      {
        id: input.id,
        fileName: input.fileName,
        kind,
        unitId,
        rows: [],
        readable: false,
        detail:
          input.detail ??
          `${input.fileName} is not CSV or Excel. Amounts stay Missing until the rows can be read.`,
      },
    ];
  }

  const kinds = input.kind ? [input.kind] : detectKinds(input.fileName, input.rows);
  const slices: Slice[] = [];
  kinds.forEach((kind, kindIndex) => {
    const id = kinds.length === 1 ? input.id : `${input.id}-${kind}`;
    if (input.unitId !== undefined) {
      slices.push({
        id,
        fileName: input.fileName,
        kind,
        unitId: input.unitId,
        rows: input.rows,
        readable: true,
        detail: detailFor(kind, input.unitId !== null),
      });
      return;
    }
    const { has, body } = readGrid(input.rows);
    if (!has("unit")) {
      const fromName = matchUnit(input.fileName, input.units);
      const unitId = fromName ?? (input.units.length === 1 ? input.units[0]?.id ?? null : null);
      slices.push({
        id,
        fileName: input.fileName,
        kind,
        unitId,
        rows: input.rows,
        readable: true,
        detail: detailFor(kind, unitId !== null),
      });
      return;
    }
    const header = input.rows[0] ?? [];
    const groups = new Map<string, string[][]>();
    const unmatched: string[][] = [];
    for (const row of body) {
      const unitCol = readGrid([header, row]).cell(row, "unit");
      const unitId = matchUnit(unitCol, input.units);
      if (!unitId) unmatched.push(row);
      else {
        const list = groups.get(unitId) ?? [];
        list.push(row);
        groups.set(unitId, list);
      }
    }
    if (groups.size === 0 && unmatched.length === 0) {
      slices.push({
        id,
        fileName: input.fileName,
        kind,
        unitId: null,
        rows: input.rows,
        readable: true,
        detail: "No data rows.",
      });
      return;
    }
    groups.forEach((groupRows, unitId) => {
      slices.push({
        id: `${id}-${unitId}`,
        fileName: input.fileName,
        kind,
        unitId,
        rows: [header, ...groupRows],
        readable: true,
        detail: detailFor(kind, true),
      });
    });
    if (unmatched.length) {
      slices.push({
        id: `${id}-unassigned-${kindIndex}`,
        fileName: input.fileName,
        kind,
        unitId: null,
        rows: [header, ...unmatched],
        readable: true,
        detail: "Choose a unit. A location on the file did not match.",
      });
    }
  });
  return slices;
}
