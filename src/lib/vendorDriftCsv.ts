// Vendor Drift Detector · compares prices on the latest two invoice dates
// or explicitly supplied months for the same vendor and SKU.
//
// The pattern: PFG / Sysco / Northern Lights bump a case price quietly,
// it shows up in next week's invoice, nobody catches it for 6 months.
// Compounded across 100+ SKUs that's the silent margin killer.
//
// CSV shape: one row per (vendor, SKU, period) with price.
// Required: Vendor, SKU (or SKU Description), Period (or Invoice Date),
// Unit Price. Optional: Category, Pack Size, Billed Unit, Location.

import { parseCsv, findColumn, norm, num } from './csv/core';

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
  flagged: boolean;       // strictly > 5%; not a duplicate-billing finding
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

// parseCsv, findColumn, num imported from ./csv/core

function periodKey(s: string): string | null {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 1 || month < 1 || month > 12) return null;
  if (match[3]) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const day = Number(match[3]);
    if (day < 1 || day > days[month - 1]) return null;
  }
  // Keep the supplied precision. A dated invoice is not a complete week/month.
  return s;
}

function exactColumns(headers: string[], aliases: string[]): number[] {
  const names = new Set(aliases.map(norm));
  return headers.flatMap((header, index) => names.has(norm(header)) ? [index] : []);
}

function comparableValue(value: string | undefined): string {
  // Only formatting is normalized; no pack conversion or unit equivalence is inferred.
  return (value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function runVendorDrift(csv: string): VendorDriftReport | DriftError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Vendor invoice / SKU price feed needed.' };
  }

  const iVendor   = findColumn(headers, ['Vendor', 'Supplier', 'VendorName']);
  const iSku      = findColumn(headers, ['SKU', 'ItemCode', 'ProductCode', 'ItemNumber', 'Description', 'ItemName']);
  const iPeriod   = findColumn(headers, ['Period', 'Month', 'InvoiceDate', 'Date', 'BusinessDate']);
  const iPrice    = findColumn(headers, ['UnitPrice', 'Price', 'CasePrice', 'ItemPrice']);
  const iCategory = findColumn(headers, ['Category', 'Department', 'Class']);
  // Exact matches prevent "Unit" from accidentally selecting "Unit Price".
  const packColumns = exactColumns(headers, ['Pack', 'PackSize', 'PackageSize', 'CasePack', 'PackDescription']);
  const unitColumns = exactColumns(headers, ['BilledUnit', 'BillingUnit', 'UOM', 'UnitOfMeasure', 'PriceUnit', 'PurchaseUnit', 'Unit']);
  const locationColumns = exactColumns(headers, ['Location', 'Restaurant', 'Store', 'Site',
    'LocationId', 'RestaurantId', 'StoreId', 'SiteId', 'LocationName', 'RestaurantName', 'StoreName', 'SiteName']);

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

  type Slice = { prices: number[]; categories: Set<string>; packs: Set<string>; units: Set<string> };
  // A tuple key preserves vendor/SKU boundaries even when either contains punctuation.
  const bySkuPeriod = new Map<string, Map<string, Slice>>();
  const allPeriods = new Set<string>();
  let periodPrecision: number | undefined;
  // Check location columns separately: a location's name need not equal its ID.
  const locations = new Map(locationColumns.map((column) => [column, new Set<string>()]));

  for (const r of rows) {
    const vendor = (r[iVendor] || '').trim();
    const sku = (r[iSku] || '').trim();
    const price = num(r[iPrice]);
    if (!vendor || !sku || price <= 0) continue;
    const period = periodKey((r[iPeriod] || '').trim());
    if (!period) {
      return { ok: false, error: 'Invalid or missing invoice date / period',
        hint: 'Use a real calendar date (YYYY-MM-DD) or a month (YYYY-MM). Week labels, timestamps and ambiguous dates need a clear period first.' };
    }
    if (periodPrecision !== undefined && periodPrecision !== period.length) {
      return { ok: false, error: 'Cannot mix invoice dates and monthly periods',
        hint: 'Compare dated invoices with dated invoices, or supply monthly prices throughout.' };
    }
    periodPrecision = period.length;
    const packs = new Set(packColumns.map((column) => comparableValue(r[column])).filter(Boolean));
    const units = new Set(unitColumns.map((column) => comparableValue(r[column])).filter(Boolean));
    if (packs.size > 1 || units.size > 1) {
      return { ok: false, error: `Conflicting ${packs.size > 1 ? 'pack sizes' : 'billed units'} for ${vendor} / ${sku}`,
        hint: 'Resolve the conflicting columns before comparing prices. No unit or pack conversion has been applied.' };
    }
    for (const [column, values] of locations) {
      // Opaque IDs can be case-sensitive; only human-readable names are case-folded.
      values.add(norm(headers[column]).endsWith('id') ? (r[column] || '').trim() : comparableValue(r[column]));
      if (values.size > 1) {
        return { ok: false, error: 'Location / restaurant values do not match across the supplied prices',
          hint: `Supply prices for one restaurant with consistent ${headers[column]} values. Fill missing locations before comparing.` };
      }
    }
    allPeriods.add(period);
    const key = JSON.stringify([vendor, sku]);
    let perPeriod = bySkuPeriod.get(key);
    if (!perPeriod) { perPeriod = new Map(); bySkuPeriod.set(key, perPeriod); }
    const slice = perPeriod.get(period) || {
      prices: [], categories: new Set<string>(), packs: new Set<string>(), units: new Set<string>(),
    };
    slice.prices.push(price);
    // Empty values remain evidence of a missing dimension if another row supplies it.
    slice.packs.add(Array.from(packs)[0] || '');
    slice.units.add(Array.from(units)[0] || '');
    if (iCategory >= 0) slice.categories.add((r[iCategory] || '').trim());
    perPeriod.set(period, slice);
  }

  const periods = Array.from(allPeriods).sort();
  if (periods.length < 2) {
    return { ok: false, error: 'Need at least 2 periods of pricing to detect drift', hint: 'Supply positive prices for the same vendor and SKU on two invoice dates or in two explicitly supplied months.' };
  }
  const prevPeriod = periods[periods.length - 2];
  const currPeriod = periods[periods.length - 1];
  const vendors = Array.from(new Set(rows.map((r) => (r[iVendor] || '').trim()).filter(Boolean))).sort();

  const perSku: DriftRow[] = [];
  let totalDriftDollars = 0;

  for (const [key, perPeriod] of bySkuPeriod) {
    const prev = perPeriod.get(prevPeriod);
    const curr = perPeriod.get(currPeriod);
    if (!prev || !curr) continue;
    const [vendor, sku] = JSON.parse(key) as [string, string];
    if (new Set([...prev.packs, ...curr.packs]).size > 1 || new Set([...prev.units, ...curr.units]).size > 1) {
      return { ok: false, error: `Pack sizes or billed units do not match for ${vendor} / ${sku}`,
        hint: `Check the pack and billed unit on ${prevPeriod} and ${currPeriod}, including missing values. Compare the same pack and unit; no conversion has been applied.` };
    }
    // Preserve the existing unweighted mean of supplied rows; quantities and
    // duplicate-looking rows do not establish weights or invoice-line identities.
    const prevPrice = prev.prices.reduce((s, p) => s + p, 0) / prev.prices.length;
    const currPrice = curr.prices.reduce((s, p) => s + p, 0) / curr.prices.length;
    if (prevPrice <= 0) continue;
    const driftPct = (currPrice - prevPrice) / prevPrice;
    const driftDollars = currPrice - prevPrice;
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
  }
  if (!perSku.length) {
    return { ok: false, error: `No comparable vendor / SKU prices for ${prevPeriod} and ${currPeriod}`,
      hint: 'The latest two supplied periods need a matching vendor and SKU with positive prices in both. Missing comparisons do not mean prices stayed the same.' };
  }
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
