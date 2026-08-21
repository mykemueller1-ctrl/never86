// Refund Auditor — the 8th leak agent. Voids cancel a sale *before* payment;
// refunds return money *after* it's collected, so refund abuse (comps to self,
// friends, or post-close returns) is a different, higher-trust leak. The math
// is the same peer-band shape as Void Hunter, so it reuses the shared scoring
// rule (analyzeStores / isEmployeeFlagged) and the tested csv/core.
import { parseCsv, findColumn, num, NOT_A_COUNT, type CsvAnalysisError } from './csv/core';
import { analyzeStores, isEmployeeFlagged } from './voidAnalysis';

export type RefundStore = {
  name: string;
  net: number;
  refunds: number;
  refundRate: number;
  excessYr: number;
  flagged: boolean;
};
export type RefundEmployee = {
  store: string;
  name: string;
  net: number;
  refundAmount: number;
  refundRate: number;
  flagged: boolean;
};
export type RefundAuditorReport = {
  rowsParsed: number;
  networkNet: number;
  networkRefunds: number;
  networkRefundRate: number;
  medianStoreRefundRate: number;
  storesFlagged: number;
  stores: RefundStore[];
  employees: RefundEmployee[];
};

export function runRefundAuditor(csv: string): RefundAuditorReport | CsvAnalysisError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Make sure the first row is column headers and there are data rows below.' };
  }

  const iStore = findColumn(headers, ['Location', 'LocationName', 'Store', 'StoreName', 'Site', 'Restaurant']);
  const iEmployee = findColumn(headers, ['Employee', 'EmployeeName', 'Cashier', 'CashierName', 'TeamMember', 'Staff', 'Server', 'ServerName', 'Name']);
  const iNet = findColumn(headers, ['NetSales', 'NetTotal', 'PeriodNet', 'Net', 'Sales', 'Gross', 'Total'], NOT_A_COUNT);
  const iRefund = findColumn(
    headers,
    ['RefundAmount', 'RefundTotal', 'RefundedAmount', 'RefundedSales', 'RefundDollars', 'Refunds', 'Refunded', 'ReturnAmount', 'Returns'],
    NOT_A_COUNT,
  );

  const missing: string[] = [];
  if (iStore < 0) missing.push('Location / Store');
  if (iEmployee < 0) missing.push('Employee / Name');
  if (iNet < 0) missing.push('Net Sales');
  if (iRefund < 0) missing.push('Refund Amount');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Your CSV should have at least Location, Employee, Net Sales, and Refund Amount columns. (Aliases accepted.)',
      detectedColumns: headers,
    };
  }

  const byStoreEmp = rows
    .map((r) => ({
      store: (r[iStore] || '').trim(),
      name: (r[iEmployee] || '').trim(),
      net: num(r[iNet]),
      refund: num(r[iRefund]),
    }))
    .filter((r) => r.store && r.name);

  if (!byStoreEmp.length) {
    return { ok: false, error: 'No valid data rows after parsing', hint: 'Check that the Location and Employee columns are populated.' };
  }

  // Aggregate to stores and score with the shared peer-band rule (refunds map
  // onto the rule's generic "amount above the peer median").
  const storeMap = new Map<string, { net: number; voids: number }>();
  for (const r of byStoreEmp) {
    const prev = storeMap.get(r.store) || { net: 0, voids: 0 };
    storeMap.set(r.store, { net: prev.net + r.net, voids: prev.voids + r.refund });
  }
  const stores0 = Array.from(storeMap.entries()).map(([name, v]) => ({
    name,
    net: v.net,
    voids: v.voids,
    voidRate: v.net > 0 ? v.voids / v.net : 0,
  }));
  const { stores: scored, networkNet, networkVoids: networkRefunds, medianStoreVoidRate: med, storesFlagged } = analyzeStores(stores0);
  const stores: RefundStore[] = scored.map((s) => ({
    name: s.name,
    net: s.net,
    refunds: s.voids,
    refundRate: s.voidRate,
    excessYr: s.excessYr,
    flagged: s.flagged,
  }));

  const employees: RefundEmployee[] = byStoreEmp
    .filter((r) => r.refund > 0)
    .map((r) => {
      const rate = r.net > 0 ? r.refund / r.net : 0;
      return {
        store: r.store,
        name: r.name,
        net: r.net,
        refundAmount: r.refund,
        refundRate: rate,
        flagged: isEmployeeFlagged(rate, r.refund, med),
      };
    })
    .sort((a, b) => b.refundAmount - a.refundAmount)
    .slice(0, 15);

  return {
    rowsParsed: byStoreEmp.length,
    networkNet,
    networkRefunds,
    networkRefundRate: networkNet > 0 ? networkRefunds / networkNet : 0,
    medianStoreRefundRate: med,
    storesFlagged,
    stores,
    employees,
  };
}
