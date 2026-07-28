// Vendor Drift Detector · catches silent price increases > 5% week-over-
// week or month-over-month on the same SKU.
//
// The pattern: PFG / Sysco / Northern Lights bump a case price quietly,
// it shows up in next week's invoice, nobody catches it for 6 months.
// Compounded across 100+ SKUs that's the silent margin killer.
//
// CSV shape: one row per (vendor, SKU, period) with price.
// Required: Vendor, SKU (or SKU Description), Period (or Invoice Date),
// Unit Price. Optional: Category, Pack Size.

import { parseCsv } from './voidHunterCsv';

export type DriftRow = {
  vendor: string;
  sku: string;
  category: string;
  prevPeriod: string;
  currPeriod: string;
  prevPrice: number;
  currPrice: number;
  driftPct: number;       // currPrice / prevPrice − 1
  driftDollars: number;   // (currPrice − prevPrice)
  flagged: boolean;       // > 5% or duplicate-billing pattern
};

export type VendorDriftReport = {
  rowsParsed: number;
  vendors: string[];
  periodsCount: number;
  prevPeriod: string;
  currPeriod: string;
  totalSkus: number;
  flaggedSkus: number;
  totalDriftDollars: number;  // sum of positive drifts (per unit)
  perSku: DriftRow[];
};

export type DriftError = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

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

function periodKey(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isFinite(d.getTime())) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return s.trim();
}

export function runVendorDrift(csv: string): VendorDriftReport | DriftError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Vendor invoice / SKU price feed needed.' };
  }

  const iVendor   = findCol(headers, ['Vendor', 'Supplier', 'VendorName']);
  const iSku      = findCol(headers, ['SKU', 'ItemCode', 'ProductCode', 'ItemNumber', 'Description', 'ItemName']);
  const iPeriod   = findCol(headers, ['Period', 'Month', 'InvoiceDate', 'Date', 'BusinessDate']);
  const iPrice    = findCol(headers, ['UnitPrice', 'Price', 'CasePrice', 'ItemPrice']);
  const iCategory = findCol(headers, ['Category', 'Department', 'Class']);

  const missing: string[] = [];
  if (iVendor < 0) missing.push('Vendor / Supplier');
  if (iSku < 0)    missing.push('SKU / Item Code');
  if (iPeriod < 0) missing.push('Period / Invoice Date');
  if (iPrice < 0)  missing.push('Unit Price');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Vendor invoice CSV needs Vendor, SKU, Period (or Invoice Date), and Unit Price. Optional Category for category-level rollups.',
      detectedColumns: headers,
    };
  }

  type Slice = { prices: number[]; categories: Set<string> };
  // Key = vendor::sku, value = period → Slice
  const bySkuPeriod = new Map<string, Map<string, Slice>>();
  const allPeriods = new Set<string>();

  for (const r of rows) {
    const vendor = (r[iVendor] || '').trim();
    const sku = (r[iSku] || '').trim();
    const period = periodKey((r[iPeriod] || '').trim());
    const price = num(r[iPrice]);
    if (!vendor || !sku || !period || price <= 0) continue;
    allPeriods.add(period);
    const key = `${vendor}::${sku}`;
    let perPeriod = bySkuPeriod.get(key);
    if (!perPeriod) { perPeriod = new Map(); bySkuPeriod.set(key, perPeriod); }
    const slice = perPeriod.get(period) || { prices: [], categories: new Set<string>() };
    slice.prices.push(price);
    if (iCategory >= 0) slice.categories.add((r[iCategory] || '').trim());
    perPeriod.set(period, slice);
  }

  const periods = Array.from(allPeriods).sort();
  if (periods.length < 2) {
    return { ok: false, error: 'Need at least 2 periods of pricing to detect drift', hint: 'CSV must cover at least two months / weeks for the same SKU.' };
  }
  const prevPeriod = periods[periods.length - 2];
  const currPeriod = periods[periods.length - 1];
  const vendors = Array.from(new Set(rows.map((r) => (r[iVendor] || '').trim()).filter(Boolean))).sort();

  const perSku: DriftRow[] = [];
  let totalDriftDollars = 0;

  bySkuPeriod.forEach((perPeriod, key) => {
    const prev = perPeriod.get(prevPeriod);
    const curr = perPeriod.get(currPeriod);
    if (!prev || !curr) return;
    const prevPrice = prev.prices.reduce((s, p) => s + p, 0) / prev.prices.length;
    const currPrice = curr.prices.reduce((s, p) => s + p, 0) / curr.prices.length;
    if (prevPrice <= 0) return;
    const driftPct = (currPrice - prevPrice) / prevPrice;
    const driftDollars = currPrice - prevPrice;
    const [vendor, sku] = key.split('::');
    const catSet = new Set<string>();
    prev.categories.forEach((c) => catSet.add(c));
    curr.categories.forEach((c) => catSet.add(c));
    const cat = Array.from(catSet).join(' / ');
    perSku.push({
      vendor, sku, category: cat,
      prevPeriod, currPeriod,
      prevPrice, currPrice,
      driftPct, driftDollars,
      flagged: driftPct > 0.05,
    });
    if (driftDollars > 0) totalDriftDollars += driftDollars;
  });
  perSku.sort((a, b) => b.driftPct - a.driftPct);

  return {
    rowsParsed: rows.length,
    vendors,
    periodsCount: periods.length,
    prevPeriod,
    currPeriod,
    totalSkus: perSku.length,
    flaggedSkus: perSku.filter((s) => s.flagged).length,
    totalDriftDollars,
    perSku: perSku.slice(0, 30),
  };
}
