// Catering Leak · invoice-vs-POS reconciliation gap detector.
//
// Operators run catering orders that never make it onto a POS ticket
// (or get rung up incorrectly). The gap shows up only when you match
// signed invoices against POS catering category sales. Per-store, per-
// customer, per-event.
//
// Two CSVs · one merged shape. Either:
// - A SINGLE CSV with both invoice + POS columns (e.g., a reconciler
//   that already paired them up), OR
// - A POS catering category export with order_id + amount, and we
//   detect the gap as orders > 0 with no POS match marker
//
// The simplest defensible CSV shape: Location, OrderID, Customer,
// EventDate, InvoiceAmount, POSAmount, OrderStatus. The gap is
// invoice − POS where POS < invoice. Concentration by customer
// surfaces "this one corporate account always under-rings."

import { parseCsv } from './voidHunterCsv';

export type CustomerConcentration = {
  customer: string;
  orders: number;
  totalGap: number;
  totalInvoice: number;
  gapShare: number; // gap as % of own invoice total
};

export type StoreLeak = {
  store: string;
  orders: number;
  totalInvoice: number;
  totalPos: number;
  totalGap: number;
  gapRatio: number; // gap / invoice
};

export type OrderRow = {
  store: string;
  orderId: string;
  customer: string;
  eventDate: string;
  invoiceAmount: number;
  posAmount: number;
  gap: number;
};

export type CateringReport = {
  rowsParsed: number;
  orders: number;
  stores: string[];
  totalInvoice: number;
  totalPos: number;
  totalGap: number;
  gapRatio: number;
  perStore: StoreLeak[];
  topCustomerConcentration: CustomerConcentration[];
  unmatchedOrders: OrderRow[]; // invoice > 0 AND pos === 0
  flaggedOrders: OrderRow[];   // gap > $50 AND gap/invoice > 0.10
};

export type CateringError = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

function norm(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function findCol(headers: string[], aliases: string[]): number {
  const lc = headers.map(norm);
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) if (lc[i] === an) return i;
  }
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) if (lc[i].includes(an)) return i;
  }
  return -1;
}

const num = (s: string | undefined): number => {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export function runCateringLeak(csv: string): CateringReport | CateringError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Catering reconciliation export with header row required.' };
  }

  const iStore    = findCol(headers, ['Location', 'LocationName', 'Store', 'Site']);
  const iOrderId  = findCol(headers, ['OrderID', 'OrderNumber', 'InvoiceNumber', 'TicketID']);
  const iCustomer = findCol(headers, ['Customer', 'CustomerName', 'Client', 'Account', 'BusinessName']);
  const iDate     = findCol(headers, ['EventDate', 'OrderDate', 'BusinessDate', 'Date']);
  const iInvoice  = findCol(headers, ['InvoiceAmount', 'InvoiceTotal', 'CateringInvoice', 'InvoiceNet', 'Invoice']);
  const iPos      = findCol(headers, ['POSAmount', 'POSTotal', 'CateringPOS', 'POSNet', 'POSSales', 'TicketTotal']);

  const missing: string[] = [];
  if (iStore < 0)    missing.push('Location / Store');
  if (iCustomer < 0) missing.push('Customer / Client');
  if (iInvoice < 0)  missing.push('Invoice Amount');
  if (iPos < 0)      missing.push('POS Amount');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Catering CSV needs Location, Customer, Invoice Amount, POS Amount. Optional Order ID + Event Date for the unmatched / flagged order list.',
      detectedColumns: headers,
    };
  }

  const allRows: OrderRow[] = [];
  for (const r of rows) {
    const store = (r[iStore] || '').trim();
    const customer = (r[iCustomer] || '').trim();
    if (!store || !customer) continue;
    const invoice = num(r[iInvoice]);
    const pos = num(r[iPos]);
    if (invoice <= 0 && pos <= 0) continue;
    allRows.push({
      store,
      orderId: iOrderId >= 0 ? (r[iOrderId] || '').trim() : '',
      customer,
      eventDate: iDate >= 0 ? (r[iDate] || '').trim() : '',
      invoiceAmount: invoice,
      posAmount: pos,
      gap: Math.max(0, invoice - pos),
    });
  }

  if (!allRows.length) {
    return { ok: false, error: 'No valid order rows after parsing', hint: 'Check Location/Customer/Invoice/POS columns are populated.' };
  }

  // Network totals
  const totalInvoice = allRows.reduce((s, r) => s + r.invoiceAmount, 0);
  const totalPos = allRows.reduce((s, r) => s + r.posAmount, 0);
  const totalGap = allRows.reduce((s, r) => s + r.gap, 0);
  const stores = Array.from(new Set(allRows.map((r) => r.store))).sort();

  // Per-store
  const byStore = new Map<string, StoreLeak>();
  for (const r of allRows) {
    let agg = byStore.get(r.store);
    if (!agg) {
      agg = { store: r.store, orders: 0, totalInvoice: 0, totalPos: 0, totalGap: 0, gapRatio: 0 };
      byStore.set(r.store, agg);
    }
    agg.orders += 1;
    agg.totalInvoice += r.invoiceAmount;
    agg.totalPos += r.posAmount;
    agg.totalGap += r.gap;
  }
  const perStore = Array.from(byStore.values())
    .map((s) => ({ ...s, gapRatio: s.totalInvoice > 0 ? s.totalGap / s.totalInvoice : 0 }))
    .sort((a, b) => b.totalGap - a.totalGap);

  // Customer concentration
  const byCustomer = new Map<string, { orders: number; totalGap: number; totalInvoice: number }>();
  for (const r of allRows) {
    let agg = byCustomer.get(r.customer);
    if (!agg) { agg = { orders: 0, totalGap: 0, totalInvoice: 0 }; byCustomer.set(r.customer, agg); }
    agg.orders += 1;
    agg.totalGap += r.gap;
    agg.totalInvoice += r.invoiceAmount;
  }
  const topCustomerConcentration = Array.from(byCustomer.entries())
    .map(([customer, v]) => ({
      customer,
      orders: v.orders,
      totalGap: v.totalGap,
      totalInvoice: v.totalInvoice,
      gapShare: v.totalInvoice > 0 ? v.totalGap / v.totalInvoice : 0,
    }))
    .filter((c) => c.totalGap > 100)
    .sort((a, b) => b.totalGap - a.totalGap)
    .slice(0, 15);

  // Unmatched orders: invoice > 0 AND pos === 0
  const unmatchedOrders = allRows
    .filter((r) => r.invoiceAmount > 0 && r.posAmount === 0)
    .sort((a, b) => b.invoiceAmount - a.invoiceAmount)
    .slice(0, 25);

  // Flagged orders: gap > $50 AND gap/invoice > 10% (excluding fully-unmatched)
  const flaggedOrders = allRows
    .filter((r) => r.invoiceAmount > 0 && r.posAmount > 0 && r.gap > 50 && r.gap / r.invoiceAmount > 0.10)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 25);

  return {
    rowsParsed: rows.length,
    orders: allRows.length,
    stores,
    totalInvoice,
    totalPos,
    totalGap,
    gapRatio: totalInvoice > 0 ? totalGap / totalInvoice : 0,
    perStore,
    topCustomerConcentration,
    unmatchedOrders,
    flaggedOrders,
  };
}
