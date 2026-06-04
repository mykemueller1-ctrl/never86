// Leak Detector — pure CSV analyzer for ticket-level POS exports
// (Toast Sales Detail, Square Transactions, Clover Reports, PDQ ticket
// export). Where Void Hunter operates on per-employee aggregates, this
// operates on per-ticket rows and surfaces composite signals: void-
// after-payment, cash-only voiders, promo stacking, comp abuse,
// discount-after-close.

import { parseCsv } from './voidHunterCsv';

export type EmployeeFlag = {
  store: string;
  name: string;
  count: number;
  dollars: number;
  rate: number;
  peerRate: number;
};

export type EmployeeRow = {
  store: string;
  name: string;
  ticketsRung: number;
  netSales: number;
  voidsDollars: number;
  voidsCount: number;
  cashVoidsCount: number;
  compsDollars: number;
  compsCount: number;
  discountsDollars: number;
  discountsCount: number;
  voidAfterPaymentCount: number;
  promoStackedCount: number;
  discountAfterCloseCount: number;
  riskScore: number;
};

export type LeakReport = {
  rowsParsed: number;
  ticketsAnalyzed: number;
  stores: string[];
  networkNet: number;
  networkVoids: number;
  networkComps: number;
  networkDiscounts: number;
  signals: {
    voidAfterPayment:    { totalCount: number; totalDollars: number; flagged: EmployeeFlag[] };
    cashOnlyVoiders:     EmployeeFlag[];
    promoStacking:       { totalCount: number; totalDollars: number; flagged: EmployeeFlag[] };
    compAbuse:           EmployeeFlag[];
    discountAfterClose:  { totalCount: number; totalDollars: number; flagged: EmployeeFlag[] };
  };
  employees: EmployeeRow[];
};

export type LeakError = {
  ok: false;
  error: string;
  hint?: string;
  detectedColumns?: string[];
};

const NOT_A_COUNT = ['count', 'qty', 'quantity', 'numof', 'items', 'transactions', 'tickets'];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findColumn(
  headers: string[],
  aliases: string[],
  opts: { excludeNeg?: boolean; preferDollar?: boolean } = {},
): number {
  const lc = headers.map(norm);
  const negFilter = (i: number) =>
    !opts.excludeNeg || !NOT_A_COUNT.some((n) => lc[i].includes(n));
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) {
      if (lc[i] === an && negFilter(i)) return i;
    }
  }
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) {
      if (lc[i].includes(an) && negFilter(i)) return i;
    }
  }
  return -1;
}

const num = (s: string | undefined): number => {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const bool = (s: string | undefined): boolean => {
  if (!s) return false;
  const t = String(s).toLowerCase().trim();
  return t === '1' || t === 'y' || t === 'yes' || t === 'true' || t === 'voided'
      || t === 'void' || t === 'comp' || t === 'comped' || t === 'refund' || t === 'refunded';
};

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function runLeakDetector(csv: string): LeakReport | LeakError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Ticket-level export with header row required.' };
  }

  const iStore    = findColumn(headers, ['Location', 'LocationName', 'Store', 'StoreName', 'Site']);
  const iEmployee = findColumn(headers, ['Employee', 'EmployeeName', 'Cashier', 'CashierName', 'Server', 'ServerName', 'TeamMember', 'Name']);
  const iNet      = findColumn(headers, ['TicketTotal', 'NetAmount', 'NetSales', 'Net', 'Total', 'Amount'], { excludeNeg: true });
  const iTender   = findColumn(headers, ['Tender', 'PaymentType', 'PaymentMethod', 'PayType']);
  const iVoidAmt  = findColumn(headers, ['VoidAmount', 'VoidTotal', 'VoidedAmount', 'VoidDollars', 'Void$', 'Voids'], { excludeNeg: true });
  const iVoidFlag = findColumn(headers, ['VoidFlag', 'IsVoid', 'Voided', 'VoidStatus', 'Void']);
  const iCompAmt  = findColumn(headers, ['CompAmount', 'CompTotal', 'CompDollars', 'Comp$', 'Comps'], { excludeNeg: true });
  const iCompFlag = findColumn(headers, ['CompFlag', 'IsComp', 'Comped', 'CompStatus']);
  const iDiscAmt  = findColumn(headers, ['DiscountAmount', 'DiscountTotal', 'Discount$', 'PromoAmount', 'PromoTotal', 'Discounts', 'Promo']);
  const iDiscCount= findColumn(headers, ['DiscountCount', 'NumDiscounts', 'PromoCount', 'DiscountsApplied']);
  const iPostVoid = findColumn(headers, ['VoidAfterPayment', 'PostVoid', 'PostPayVoid', 'VoidedAfterPayment']);
  const iPaid     = findColumn(headers, ['PaidFlag', 'IsPaid', 'Paid', 'PaymentStatus', 'TenderApplied']);
  const iClosedTs = findColumn(headers, ['ClosedAt', 'ClosedTime', 'TicketClose']);
  const iDiscTs   = findColumn(headers, ['DiscountTime', 'DiscountAt', 'DiscountAppliedAt']);

  const missing: string[] = [];
  if (iStore < 0)    missing.push('Location / Store');
  if (iEmployee < 0) missing.push('Employee / Cashier');
  if (iNet < 0)      missing.push('Ticket Total / Net Amount');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Ticket-level CSV needs at least Location, Employee, and Ticket Total. Optional: Tender, Void $, Void Flag, Comp $, Discount $, Discount Count, PostVoid, Closed-At/Discount-At timestamps.',
      detectedColumns: headers,
    };
  }

  type Row = {
    store: string;
    employee: string;
    net: number;
    tender: string;
    voidAmt: number;
    voided: boolean;
    compAmt: number;
    comped: boolean;
    discountAmt: number;
    discountCount: number;
    postVoid: boolean;
    paid: boolean;
    discAfterClose: boolean;
  };
  const parsed: Row[] = [];
  for (const r of rows) {
    const store = (r[iStore] || '').trim();
    const employee = (r[iEmployee] || '').trim();
    if (!store || !employee) continue;
    const tender = iTender >= 0 ? (r[iTender] || '').trim().toLowerCase() : '';
    const voidAmt = iVoidAmt >= 0 ? num(r[iVoidAmt]) : 0;
    const voided = iVoidFlag >= 0 ? bool(r[iVoidFlag]) : voidAmt > 0;
    const compAmt = iCompAmt >= 0 ? num(r[iCompAmt]) : 0;
    const comped = iCompFlag >= 0 ? bool(r[iCompFlag]) : compAmt > 0;
    const discountAmt = iDiscAmt >= 0 ? num(r[iDiscAmt]) : 0;
    const discountCount = iDiscCount >= 0 ? Math.round(num(r[iDiscCount])) : (discountAmt > 0 ? 1 : 0);
    const paid = iPaid >= 0 ? bool(r[iPaid]) : false;
    const postVoid = iPostVoid >= 0 ? bool(r[iPostVoid]) : (voided && paid);
    let discAfterClose = false;
    if (iClosedTs >= 0 && iDiscTs >= 0) {
      const closed = r[iClosedTs] ? Date.parse(r[iClosedTs]) : NaN;
      const disc   = r[iDiscTs]   ? Date.parse(r[iDiscTs])   : NaN;
      discAfterClose = Number.isFinite(closed) && Number.isFinite(disc) && disc > closed;
    }
    parsed.push({
      store, employee,
      net: num(r[iNet]),
      tender,
      voidAmt, voided,
      compAmt, comped,
      discountAmt, discountCount,
      postVoid, paid, discAfterClose,
    });
  }

  if (!parsed.length) {
    return { ok: false, error: 'No valid data rows', hint: 'Check that Location and Employee columns are populated.' };
  }

  // Aggregate per (store, employee)
  const byEmp = new Map<string, EmployeeRow>();
  for (const r of parsed) {
    const key = `${r.store}::${r.employee}`;
    let agg = byEmp.get(key);
    if (!agg) {
      agg = {
        store: r.store, name: r.employee,
        ticketsRung: 0, netSales: 0,
        voidsDollars: 0, voidsCount: 0, cashVoidsCount: 0,
        compsDollars: 0, compsCount: 0,
        discountsDollars: 0, discountsCount: 0,
        voidAfterPaymentCount: 0,
        promoStackedCount: 0,
        discountAfterCloseCount: 0,
        riskScore: 0,
      };
      byEmp.set(key, agg);
    }
    agg.ticketsRung += 1;
    agg.netSales += r.net;
    if (r.voided) {
      agg.voidsCount += 1;
      agg.voidsDollars += r.voidAmt;
      if (r.tender.includes('cash')) agg.cashVoidsCount += 1;
    }
    if (r.comped) {
      agg.compsCount += 1;
      agg.compsDollars += r.compAmt;
    }
    if (r.discountAmt > 0) {
      agg.discountsDollars += r.discountAmt;
      agg.discountsCount += r.discountCount > 0 ? r.discountCount : 1;
    }
    if (r.postVoid) agg.voidAfterPaymentCount += 1;
    if (r.discountCount >= 2) agg.promoStackedCount += 1;
    if (r.discAfterClose) agg.discountAfterCloseCount += 1;
  }

  const employees = Array.from(byEmp.values());
  const stores = Array.from(new Set(employees.map((e) => e.store))).sort();

  // Network totals
  const networkNet       = employees.reduce((s, e) => s + e.netSales, 0);
  const networkVoids     = employees.reduce((s, e) => s + e.voidsDollars, 0);
  const networkComps     = employees.reduce((s, e) => s + e.compsDollars, 0);
  const networkDiscounts = employees.reduce((s, e) => s + e.discountsDollars, 0);

  // Peer medians for the comp-abuse and cash-void signals
  const compRates = employees.map((e) => (e.netSales > 0 ? e.compsDollars / e.netSales : 0));
  const medCompRate = median(compRates);
  const voidRates = employees.map((e) => (e.netSales > 0 ? e.voidsDollars / e.netSales : 0));
  const medVoidRate = median(voidRates);

  // ── Signal computation ────────────────────────────────────────────────

  // Void-after-payment: surface employees with at least one + the network total
  const vapRows: EmployeeFlag[] = employees
    .filter((e) => e.voidAfterPaymentCount > 0)
    .map((e) => ({
      store: e.store, name: e.name,
      count: e.voidAfterPaymentCount,
      dollars: e.voidsDollars, // best proxy in aggregate
      rate: e.ticketsRung > 0 ? e.voidAfterPaymentCount / e.ticketsRung : 0,
      peerRate: 0,
    }))
    .sort((a, b) => b.count - a.count);
  const vapTotalCount = vapRows.reduce((s, r) => s + r.count, 0);
  const vapTotalDollars = parsed.filter((r) => r.postVoid).reduce((s, r) => s + (r.voidAmt || r.net), 0);

  // Cash-only voiders: voids count >= 5 AND cash-tender voids / total voids >= 0.8
  const cashOnly: EmployeeFlag[] = employees
    .filter((e) => e.voidsCount >= 5 && e.cashVoidsCount / e.voidsCount >= 0.8)
    .map((e) => ({
      store: e.store, name: e.name,
      count: e.cashVoidsCount, dollars: e.voidsDollars,
      rate: e.cashVoidsCount / e.voidsCount,
      peerRate: 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // Promo stacking: tickets where >=2 discounts applied
  const psRows: EmployeeFlag[] = employees
    .filter((e) => e.promoStackedCount > 0)
    .map((e) => ({
      store: e.store, name: e.name,
      count: e.promoStackedCount, dollars: e.discountsDollars,
      rate: e.ticketsRung > 0 ? e.promoStackedCount / e.ticketsRung : 0,
      peerRate: 0,
    }))
    .sort((a, b) => b.count - a.count);
  const psTotalCount = psRows.reduce((s, r) => s + r.count, 0);
  const psTotalDollars = parsed.filter((r) => r.discountCount >= 2).reduce((s, r) => s + r.discountAmt, 0);

  // Comp abuse: above 1.5× peer median, OR absolute >10% of own revenue
  // (absolute floor catches the single-bad-actor case where peer median = 0).
  // Both gates require comp$ > $200 to avoid noise on small-revenue employees.
  const compAbuse: EmployeeFlag[] = employees
    .filter((e) => {
      if (e.compsDollars < 200) return false;
      const rate = e.netSales > 0 ? e.compsDollars / e.netSales : 0;
      const aboveMedian   = medCompRate > 0 && rate > 1.5 * medCompRate;
      const aboveAbsolute = rate > 0.10;
      return aboveMedian || aboveAbsolute;
    })
    .map((e) => ({
      store: e.store, name: e.name,
      count: e.compsCount, dollars: e.compsDollars,
      rate: e.netSales > 0 ? e.compsDollars / e.netSales : 0,
      peerRate: medCompRate,
    }))
    .sort((a, b) => b.rate - a.rate);

  // Discount-after-close
  const dacRows: EmployeeFlag[] = employees
    .filter((e) => e.discountAfterCloseCount > 0)
    .map((e) => ({
      store: e.store, name: e.name,
      count: e.discountAfterCloseCount, dollars: e.discountsDollars,
      rate: e.ticketsRung > 0 ? e.discountAfterCloseCount / e.ticketsRung : 0,
      peerRate: 0,
    }))
    .sort((a, b) => b.count - a.count);
  const dacTotalCount = dacRows.reduce((s, r) => s + r.count, 0);
  const dacTotalDollars = parsed.filter((r) => r.discAfterClose).reduce((s, r) => s + r.discountAmt, 0);

  // Composite risk score, 0-100, used to sort the employee table.
  // Each leg uses peer median when one is meaningful, falls back to an
  // absolute threshold otherwise (catches the single-bad-actor case).
  for (const e of employees) {
    let score = 0;
    if (e.netSales > 0) {
      const r = e.voidsDollars / e.netSales;
      if (medVoidRate > 0 && r > 1.5 * medVoidRate) score += Math.min(30, (r / medVoidRate) * 10);
      else if (r > 0.05 && e.voidsDollars > 100) score += Math.min(30, r * 300);
    }
    if (e.netSales > 0) {
      const r = e.compsDollars / e.netSales;
      if (medCompRate > 0 && r > 1.5 * medCompRate) score += Math.min(25, (r / medCompRate) * 10);
      else if (r > 0.10 && e.compsDollars > 200) score += Math.min(25, r * 100);
    }
    if (e.voidsCount >= 5 && e.cashVoidsCount / e.voidsCount >= 0.8) score += 20;
    if (e.voidAfterPaymentCount > 0) score += Math.min(25, e.voidAfterPaymentCount * 3);
    if (e.promoStackedCount > 0) score += Math.min(15, e.promoStackedCount * 2);
    if (e.discountAfterCloseCount > 0) score += Math.min(15, e.discountAfterCloseCount * 3);
    e.riskScore = Math.round(score);
  }
  employees.sort((a, b) => b.riskScore - a.riskScore);

  return {
    rowsParsed: parsed.length,
    ticketsAnalyzed: parsed.length,
    stores,
    networkNet,
    networkVoids,
    networkComps,
    networkDiscounts,
    signals: {
      voidAfterPayment:   { totalCount: vapTotalCount, totalDollars: vapTotalDollars, flagged: vapRows.slice(0, 15) },
      cashOnlyVoiders:    cashOnly.slice(0, 15),
      promoStacking:      { totalCount: psTotalCount,  totalDollars: psTotalDollars,  flagged: psRows.slice(0, 15) },
      compAbuse:          compAbuse.slice(0, 15),
      discountAfterClose: { totalCount: dacTotalCount, totalDollars: dacTotalDollars, flagged: dacRows.slice(0, 15) },
    },
    employees: employees.slice(0, 30),
  };
}
