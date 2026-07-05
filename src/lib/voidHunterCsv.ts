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

// CSV mechanics (parser, column detection, number parsing, median) live in the
// shared `csv/core` module so every agent stays consistent. Imported for local
// use and re-exported here for the six sibling agents that already import these
// names from this module.
import { parseCsv, findColumn, num, median, NOT_A_COUNT, type CsvAnalysisError } from './csv/core';
export { parseCsv, findColumn, num, median, NOT_A_COUNT };
export type { CsvAnalysisError };

export function runVoidHunter(csv: string): VoidHunterCsv | CsvAnalysisError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Make sure the first row is column headers and there are data rows below.' };
  }

  const iStore    = findColumn(headers, ['Location', 'LocationName', 'Store', 'StoreName', 'Site', 'Restaurant']);
  // Employee should not be the Store column (which can also contain "name").
  // We bias toward strings that strongly imply an employee identifier.
  const iEmployee = findColumn(
    headers,
    ['Employee', 'EmployeeName', 'Cashier', 'CashierName', 'TeamMember', 'Staff', 'Server', 'ServerName', 'Name'],
    [],
  );
  const iNet  = findColumn(
    headers,
    ['NetSales', 'NetTotal', 'PeriodNet', 'Net', 'Sales', 'Gross', 'Total'],
    NOT_A_COUNT,
  );
  // Void $ — preferred priority:
  //   1. Explicit "Void $" headers (VoidAmount, VoidTotal, VoidedSales…)
  //   2. Explicit "Refund $" headers (RefundAmount…)
  //   3. Generic "Voids" / "Void" (filtered against NOT_A_COUNT so we don't
  //      grab "Items Voided" count columns)
  //   4. Generic "Refunds" / "Refunded" — last fallback (Square convention
  //      where a refund column doubles as the void$ surface)
  const iVoid = findColumn(
    headers,
    ['VoidAmount', 'VoidTotal', 'VoidedAmount', 'VoidedSales', 'VoidSales',
     'VoidDollars',
     'RefundAmount', 'RefundedAmount', 'RefundTotal',
     'Voids', 'Void',
     'Refunds', 'Refunded'],
    NOT_A_COUNT,
  );

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
