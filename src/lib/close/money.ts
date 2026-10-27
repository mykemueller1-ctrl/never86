export type EvidenceLabel = "Verified" | "Estimated" | "Missing";

export type FileKind =
  | "pos"
  | "labor"
  | "invoice"
  | "menu"
  | "statement"
  | "count"
  | "unknown";

export type Category = "food" | "beverage" | "paper" | "labor" | "delivery" | "other";

export const CATEGORIES: Category[] = ["food", "beverage", "paper", "labor", "delivery", "other"];

export const CATEGORY_TITLE: Record<Category, string> = {
  food: "Food / COGS",
  beverage: "Beverage",
  paper: "Paper",
  labor: "Labor",
  delivery: "Delivery fees",
  other: "Other",
};

export const CATEGORY_NAME: Record<Category, string> = {
  food: "Food",
  beverage: "Beverage",
  paper: "Paper",
  labor: "Labor",
  delivery: "Delivery fees",
  other: "Other",
};

export const KIND_LABEL: Record<FileKind, string> = {
  pos: "POS close",
  labor: "Labor",
  invoice: "Invoice",
  menu: "Menu",
  statement: "Delivery statement",
  count: "Inventory count",
  unknown: "Unsorted",
};

export interface Figure {
  label: EvidenceLabel;
  amount: number | null;
  missing: string | null;
  note: string;
}

export function missingFigure(missing: string): Figure {
  return { label: "Missing", amount: null, missing, note: missing };
}

export function knownFigure(amount: number, label: Exclude<EvidenceLabel, "Missing">, note: string): Figure {
  return { label, amount, missing: null, note };
}

/** A blank, a dash, or junk is Missing. Zero stays zero when the file says zero. */
export function numberValue(value: string | undefined | null): number | null {
  if (value == null) return null;
  const cleaned = value.replace(/[$,\s%]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "\u2014" || cleaned === "\u2013") return null;
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

export function wholeDollars(amount: number): number {
  return Math.round(amount);
}

export function money(amount: number | null): string {
  if (amount === null) return "Missing";
  const rounded = wholeDollars(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("en-US")}`;
}

export function percentText(amount: number | null): string {
  if (amount === null) return "Missing";
  return `${wholeDollars(amount)}%`;
}

export function weakest(labels: EvidenceLabel[]): EvidenceLabel {
  if (labels.includes("Missing") || labels.length === 0) return "Missing";
  if (labels.includes("Estimated")) return "Estimated";
  return "Verified";
}

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIso(date);
}

export function formatDay(iso: string): string {
  return parseIso(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function weekStartMonday(iso: string): string {
  const date = parseIso(iso);
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return addDays(iso, -offset);
}

export function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed);
  if (!us) return null;
  const year = us[3].length === 2 ? `20${us[3]}` : us[3];
  return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
}

export function headerKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseTarget(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? wholeDollars(raw) : null;
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = numberValue(trimmed);
  return value === null ? null : wholeDollars(value);
}
