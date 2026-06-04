// Pure-CSV Void Hunter — runs the same analysis as the DB-backed
// version (src/lib/voidHunter.ts) without requiring an ops DB. Used by
// the self-serve /connect upload path so an operator can drop a CSV
// export and see the leak immediately.

export type VoidStoreCsv = {
  name: string;
  net: number;
  voids: number;
  voidRate: number;
  excessYr: number;
  flagged: boolean;
};
export type VoidEmployeeCsv = {
  store: string;
  name: string;
  net: number;
  voidAmount: number;
  voidRate: number;
  flagged: boolean;
};
export type VoidHunterCsv = {
  rowsParsed: number;
  networkNet: number;
  networkVoids: number;
  networkVoidRate: number;
  medianStoreVoidRate: number;
  storesFlagged: number;
  stores: VoidStoreCsv[];
  employees: VoidEmployeeCsv[];
};

// Minimal CSV parser — handles quoted fields containing commas. Toast,
// Square, and Clover all export this format. Returns { headers, rows }.
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

// Column aliases — try a few common header names for each logical field.
// Returns the index, or -1 if none match.
function findCol(headers: string[], aliases: string[]): number {
  const lc = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const alias of aliases) {
    const a = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    const i = lc.findIndex((h) => h === a || h.includes(a));
    if (i >= 0) return i;
  }
  return -1;
}

const num = (s: string | undefined): number => {
  if (!s) return 0;
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type CsvAnalysisError = {
  ok: false;
  error: string;
  hint?: string;
  detectedColumns?: string[];
};

export function runVoidHunter(csv: string): VoidHunterCsv | CsvAnalysisError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Make sure the first row is column headers and there are data rows below.' };
  }

  const iStore    = findCol(headers, ['Location', 'Store', 'Site', 'Restaurant']);
  const iEmployee = findCol(headers, ['Employee', 'Name', 'EmployeeName', 'Staff']);
  const iNet      = findCol(headers, ['NetSales', 'Net', 'Sales', 'Gross', 'Total']);
  const iVoid     = findCol(headers, ['VoidAmount', 'Voids', 'VoidTotal', 'VoidedAmount', 'Void$', 'VoidDollars']);

  const missing: string[] = [];
  if (iStore < 0)    missing.push('Location / Store');
  if (iEmployee < 0) missing.push('Employee / Name');
  if (iNet < 0)      missing.push('Net Sales');
  if (iVoid < 0)     missing.push('Void Amount');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Your CSV should have at least Location, Employee, Net Sales, and Void Amount columns. (Aliases accepted.)',
      detectedColumns: headers,
    };
  }

  // Build employee-level view, then aggregate by store.
  const byStoreEmp = rows
    .map((r) => ({
      store: (r[iStore] || '').trim(),
      name:  (r[iEmployee] || '').trim(),
      net:   num(r[iNet]),
      void:  num(r[iVoid]),
    }))
    .filter((r) => r.store && r.name);

  if (!byStoreEmp.length) {
    return { ok: false, error: 'No valid data rows after parsing', hint: 'Check that the Location and Employee columns are populated.' };
  }

  const storeMap = new Map<string, { net: number; voids: number }>();
  for (const r of byStoreEmp) {
    const prev = storeMap.get(r.store) || { net: 0, voids: 0 };
    storeMap.set(r.store, { net: prev.net + r.net, voids: prev.voids + r.void });
  }
  const stores0 = Array.from(storeMap.entries()).map(([name, v]) => ({
    name,
    net: v.net,
    voids: v.voids,
    voidRate: v.net > 0 ? v.voids / v.net : 0,
  }));
  const networkNet = stores0.reduce((s, x) => s + x.net, 0);
  const networkVoids = stores0.reduce((s, x) => s + x.voids, 0);
  const med = median(stores0.map((s) => s.voidRate));

  const stores: VoidStoreCsv[] = stores0
    .map((s) => ({
      ...s,
      // Excess voids vs peer median, annualized (×3 if this was a 4-month period — keep modest)
      excessYr: Math.round(Math.max(0, s.voids - med * s.net) * 3),
      flagged: med > 0 && s.voidRate > 1.5 * med,
    }))
    .sort((a, b) => b.voidRate - a.voidRate);

  const employees: VoidEmployeeCsv[] = byStoreEmp
    .filter((r) => r.void > 0)
    .map((r) => {
      const rate = r.net > 0 ? r.void / r.net : 0;
      return {
        store: r.store,
        name: r.name,
        net: r.net,
        voidAmount: r.void,
        voidRate: rate,
        flagged: med > 0 && rate > 1.5 * med && r.void > 200,
      };
    })
    .sort((a, b) => b.voidAmount - a.voidAmount)
    .slice(0, 15);

  return {
    rowsParsed: byStoreEmp.length,
    networkNet,
    networkVoids,
    networkVoidRate: networkNet > 0 ? networkVoids / networkNet : 0,
    medianStoreVoidRate: med,
    storesFlagged: stores.filter((s) => s.flagged).length,
    stores,
    employees,
  };
}
