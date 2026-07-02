/**
 * CSV PARSERS
 * Real-world Toast and 7shifts export formats parsed into a common data model.
 *
 * Toast exports vary by report type. We support the two most common:
 *   1. "Sales Summary" — daily/weekly sales totals
 *   2. "Product Mix" — item-level sales by quantity and revenue
 *
 * 7shifts exports we support:
 *   1. "Time Punches" — actual hours worked by employee
 *   2. "Labor Cost Report" — daily labor totals
 *
 * Operators forward exports as CSV. Headers vary slightly by Toast org config —
 * we normalize on common header substrings, not exact matches.
 */

import Papa from 'papaparse';

export type ParsedSource = 'toast_sales' | 'toast_product_mix' | '7shifts_punches' | '7shifts_labor' | 'unknown';

export interface ParsedSales {
  source: 'toast_sales';
  totalSales: number;
  netSales?: number;
  taxes?: number;
  guestCount?: number;
  startDate?: string;
  endDate?: string;
  rows: number;
}

export interface ParsedLabor {
  source: '7shifts_labor' | '7shifts_punches';
  totalLaborCost: number;
  totalHours: number;
  totalRegularHours?: number;
  totalOvertimeHours?: number;
  employeeCount?: number;
  startDate?: string;
  endDate?: string;
  rows: number;
}

export interface ParsedProductMix {
  source: 'toast_product_mix';
  items: Array<{
    name: string;
    category?: string;
    quantity: number;
    revenue: number;
  }>;
  totalRevenue: number;
  totalUnits: number;
}

export type ParseResult = ParsedSales | ParsedLabor | ParsedProductMix | { source: 'unknown'; error: string };

/**
 * Auto-detect format by header signature, then dispatch to the right parser.
 */
export function parseCsv(csv: string): ParseResult {
  const trimmed = csv.trim();
  if (!trimmed) return { source: 'unknown', error: 'Empty CSV' };

  // Parse with header detection
  const result = Papa.parse(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,  // we'll cast manually — Toast exports have $ signs
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return { source: 'unknown', error: result.errors[0].message };
  }

  const rows = result.data as Record<string, string>[];
  if (rows.length === 0) return { source: 'unknown', error: 'No data rows found' };

  const headers = Object.keys(rows[0]);
  const headerStr = headers.join('|').toLowerCase();

  // Detect format
  if (headerStr.includes('net sales') || headerStr.includes('total sales') || headerStr.includes('gross sales')) {
    if (headerStr.includes('item') || headerStr.includes('menu')) {
      return parseToastProductMix(rows);
    }
    return parseToastSales(rows);
  }

  if (headerStr.includes('clock in') || headerStr.includes('punch')) {
    return parse7shiftsPunches(rows);
  }

  if (headerStr.includes('labor cost') || headerStr.includes('hours worked')) {
    return parse7shiftsLabor(rows);
  }

  return { source: 'unknown', error: `Could not detect format. Headers: ${headers.slice(0, 5).join(', ')}` };
}

// ---------- Toast Sales ----------

function parseToastSales(rows: Record<string, string>[]): ParsedSales {
  let totalSales = 0;
  let netSales = 0;
  let taxes = 0;
  let guestCount = 0;
  let startDate: string | undefined;
  let endDate: string | undefined;

  const findCol = (...candidates: string[]) => {
    const headers = Object.keys(rows[0]);
    for (const h of headers) {
      const lower = h.toLowerCase();
      for (const c of candidates) {
        if (lower.includes(c.toLowerCase())) return h;
      }
    }
    return undefined;
  };

  const totalCol = findCol('total sales', 'gross sales');
  const netCol = findCol('net sales');
  const taxCol = findCol('tax');
  const guestCol = findCol('guest', 'covers');
  const dateCol = findCol('date', 'business date');

  for (const row of rows) {
    if (totalCol) totalSales += parseMoney(row[totalCol]);
    if (netCol) netSales += parseMoney(row[netCol]);
    if (taxCol) taxes += parseMoney(row[taxCol]);
    if (guestCol) guestCount += parseInt(row[guestCol] || '0', 10) || 0;

    if (dateCol && row[dateCol]) {
      const d = row[dateCol];
      if (!startDate || d < startDate) startDate = d;
      if (!endDate || d > endDate) endDate = d;
    }
  }

  // If we got netSales but no totalSales, use netSales (some Toast exports skip "total")
  if (totalSales === 0 && netSales > 0) {
    totalSales = netSales + taxes;
  }

  return {
    source: 'toast_sales',
    totalSales,
    netSales: netSales || undefined,
    taxes: taxes || undefined,
    guestCount: guestCount || undefined,
    startDate,
    endDate,
    rows: rows.length,
  };
}

// ---------- Toast Product Mix ----------

function parseToastProductMix(rows: Record<string, string>[]): ParsedProductMix {
  const findCol = (...candidates: string[]) => {
    const headers = Object.keys(rows[0]);
    for (const h of headers) {
      const lower = h.toLowerCase();
      for (const c of candidates) {
        if (lower.includes(c.toLowerCase())) return h;
      }
    }
    return undefined;
  };

  const nameCol = findCol('item name', 'menu item', 'item');
  const catCol = findCol('category', 'group', 'menu group');
  const qtyCol = findCol('item qty', 'quantity', 'qty', 'units');
  const revCol = findCol('item net', 'net sales', 'revenue', 'total');

  const items: ParsedProductMix['items'] = [];
  let totalRevenue = 0;
  let totalUnits = 0;

  for (const row of rows) {
    if (!nameCol || !row[nameCol]) continue;
    const qty = qtyCol ? parseInt(row[qtyCol] || '0', 10) || 0 : 0;
    const rev = revCol ? parseMoney(row[revCol]) : 0;
    if (qty === 0 && rev === 0) continue;
    items.push({
      name: row[nameCol].trim(),
      category: catCol ? row[catCol]?.trim() : undefined,
      quantity: qty,
      revenue: rev,
    });
    totalUnits += qty;
    totalRevenue += rev;
  }

  return {
    source: 'toast_product_mix',
    items,
    totalRevenue,
    totalUnits,
  };
}

// ---------- 7shifts Time Punches ----------

function parse7shiftsPunches(rows: Record<string, string>[]): ParsedLabor {
  const findCol = (...candidates: string[]) => {
    const headers = Object.keys(rows[0]);
    for (const h of headers) {
      const lower = h.toLowerCase();
      for (const c of candidates) {
        if (lower.includes(c.toLowerCase())) return h;
      }
    }
    return undefined;
  };

  const hoursCol = findCol('total hours', 'hours worked', 'hours');
  const wageCol = findCol('total wages', 'wages', 'pay');
  const empCol = findCol('employee', 'name', 'user');
  const otCol = findCol('overtime', 'ot hours');
  const regCol = findCol('regular hours');
  const dateCol = findCol('clock in', 'date', 'shift date');

  let totalHours = 0;
  let totalLaborCost = 0;
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;
  const employees = new Set<string>();
  let startDate: string | undefined;
  let endDate: string | undefined;

  for (const row of rows) {
    if (hoursCol) totalHours += parseFloat(row[hoursCol]?.replace(/[,]/g, '') || '0') || 0;
    if (wageCol) totalLaborCost += parseMoney(row[wageCol]);
    if (regCol) totalRegularHours += parseFloat(row[regCol]?.replace(/[,]/g, '') || '0') || 0;
    if (otCol) totalOvertimeHours += parseFloat(row[otCol]?.replace(/[,]/g, '') || '0') || 0;
    if (empCol && row[empCol]) employees.add(row[empCol].trim());
    if (dateCol && row[dateCol]) {
      const d = row[dateCol].split(' ')[0];  // strip time portion
      if (!startDate || d < startDate) startDate = d;
      if (!endDate || d > endDate) endDate = d;
    }
  }

  return {
    source: '7shifts_punches',
    totalLaborCost,
    totalHours,
    totalRegularHours: totalRegularHours || undefined,
    totalOvertimeHours: totalOvertimeHours || undefined,
    employeeCount: employees.size || undefined,
    startDate,
    endDate,
    rows: rows.length,
  };
}

// ---------- 7shifts Labor Cost Report ----------

function parse7shiftsLabor(rows: Record<string, string>[]): ParsedLabor {
  const findCol = (...candidates: string[]) => {
    const headers = Object.keys(rows[0]);
    for (const h of headers) {
      const lower = h.toLowerCase();
      for (const c of candidates) {
        if (lower.includes(c.toLowerCase())) return h;
      }
    }
    return undefined;
  };

  const costCol = findCol('labor cost', 'total labor', 'cost');
  const hoursCol = findCol('hours worked', 'hours');
  const dateCol = findCol('date');

  let totalLaborCost = 0;
  let totalHours = 0;
  let startDate: string | undefined;
  let endDate: string | undefined;

  for (const row of rows) {
    if (costCol) totalLaborCost += parseMoney(row[costCol]);
    if (hoursCol) totalHours += parseFloat(row[hoursCol]?.replace(/[,]/g, '') || '0') || 0;
    if (dateCol && row[dateCol]) {
      const d = row[dateCol];
      if (!startDate || d < startDate) startDate = d;
      if (!endDate || d > endDate) endDate = d;
    }
  }

  return {
    source: '7shifts_labor',
    totalLaborCost,
    totalHours,
    startDate,
    endDate,
    rows: rows.length,
  };
}

// ---------- Helpers ----------

function parseMoney(v: string | undefined | null): number {
  if (!v) return 0;
  // Strip $, commas, parens (negatives), whitespace
  const cleaned = String(v).replace(/[$,\s]/g, '').replace(/[()]/g, '-');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
