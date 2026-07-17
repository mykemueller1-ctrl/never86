// Shared CSV core for every leak agent (Void Hunter, Leak Detector, Labor
// Drift, Tip Variance, Vendor Drift, Beverage Score, Catering Leak).
//
// Before this module each agent re-implemented its own `parseCsv`,
// `findColumn`, `num`, `norm`, and `median` — so a parser fix or a bug lived
// in one agent but not the others. This is the single, tested source of truth
// for turning a messy POS export into typed values. Agents keep only their own
// column aliases and their own negative-token lists (which legitimately
// differ), and pull the mechanics from here.

/** Standard shape every agent returns when it can't analyze the CSV. */
export type CsvAnalysisError = {
  ok: false;
  error: string;
  hint?: string;
  detectedColumns?: string[];
};

/** Normalize a header for comparison: lowercase, strip everything non-alphanumeric. */
export function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Minimal but correct CSV parser. Handles quoted fields containing commas,
 * escaped double-quotes (""), a UTF-8 BOM, and CRLF/CR line endings. Toast,
 * Square, Clover, and PDQ all export this shape. Returns trimmed headers +
 * raw string rows.
 */
export function parseCsv(input: string): { headers: string[]; rows: string[][] } {
  const text = input.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim();
  if (!text) return { headers: [], rows: [] };
  const out: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; continue; }
      if (c === '"') { inQuotes = false; continue; }
      field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\n') { row.push(field); out.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); out.push(row); }
  const [headers, ...rows] = out;
  return { headers: (headers ?? []).map((h) => h.trim()), rows };
}

/**
 * Find the index of the column that best matches one of `aliases`. Exact
 * (normalized) match wins over substring match, and aliases are tried in
 * priority order. `negativeTokens` disqualifies a header even on a match —
 * used to skip count/qty columns when the agent wants the dollar column
 * (e.g. Square's "Items Voided" count vs "Refunds" dollars). Returns -1 if
 * nothing matches.
 */
export function findColumn(
  headers: string[],
  aliases: string[],
  negativeTokens: string[] = [],
): number {
  const lc = headers.map(norm);
  const ok = (i: number) => !negativeTokens.some((n) => lc[i].includes(n));
  // Exact match first — strongest signal.
  for (const alias of aliases) {
    const a = norm(alias);
    const exact = lc.findIndex((h, i) => h === a && ok(i));
    if (exact >= 0) return exact;
  }
  // Then substring match.
  for (const alias of aliases) {
    const a = norm(alias);
    for (let i = 0; i < lc.length; i++) {
      if (lc[i].includes(a) && ok(i)) return i;
    }
  }
  return -1;
}

/** Parse a money/number cell: strips $, commas, whitespace. Non-numeric → 0. */
export function num(s: string | undefined): number {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Interpret a cell as a truthy flag (1/y/yes/true/void/comp/refund…). */
export function bool(s: string | undefined): boolean {
  if (!s) return false;
  const t = String(s).toLowerCase().trim();
  return t === '1' || t === 'y' || t === 'yes' || t === 'true' || t === 'voided'
    || t === 'void' || t === 'comp' || t === 'comped' || t === 'refund' || t === 'refunded';
}

/** Median of a numeric list. Empty → 0. */
export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Parse a date cell to epoch ms, or null if unparseable. */
export function parseDate(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

/** Count/quantity tokens most agents want to avoid when seeking a $ column. */
export const NOT_A_COUNT = ['count', 'qty', 'quantity', 'numof', 'items', 'transactions'];
