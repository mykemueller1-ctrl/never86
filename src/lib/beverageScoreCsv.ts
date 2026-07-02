// Beverage Cost Score · pours-vs-POS shrink heuristic.
//
// Two CSVs · one merged shape preferred:
// - bottle / inventory close with starting + ending + theoretical pours
// - OR a single CSV with both poured (from POS) and consumed (from inventory)
//
// Surfaces per-store shrink (consumed − poured), per-category drift
// (liquor vs beer vs wine), and a Beverage Cost Score 0-100 (100 = perfect
// pour, 60 = roughly industry baseline, < 40 = pour-cost crisis).
//
// This is the "free outreach hook" called out in the brief — a one-page
// score we can hand a prospect after one CSV drop.

import { parseCsv } from './voidHunterCsv';

export type BevCategoryRow = {
  category: string;       // 'Liquor' | 'Beer' | 'Wine' | 'NA' | other
  consumed: number;       // bottles / units consumed (from inventory)
  poured: number;         // bottles / units poured (from POS pours)
  shrinkUnits: number;    // consumed − poured
  shrinkPct: number;      // shrink as % of consumed
  revenueLost: number;    // shrink × avg unit price (if provided)
};

export type StoreBev = {
  store: string;
  bcsScore: number;       // 0-100
  consumed: number;
  poured: number;
  shrinkUnits: number;
  shrinkPct: number;
  revenueLost: number;
  byCategory: BevCategoryRow[];
};

export type BevReport = {
  rowsParsed: number;
  storesCount: number;
  networkConsumed: number;
  networkPoured: number;
  networkShrinkUnits: number;
  networkShrinkPct: number;
  networkRevenueLost: number;
  networkBcsScore: number;
  perStore: StoreBev[];
};

export type BevError = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

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

function classifyCategory(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('liquor') || s.includes('spirit') || s.includes('whisk') || s.includes('vodka') || s.includes('gin') || s.includes('rum') || s.includes('tequila')) return 'Liquor';
  if (s.includes('beer') || s.includes('draft') || s.includes('ipa') || s.includes('lager')) return 'Beer';
  if (s.includes('wine') || s.includes('chardonnay') || s.includes('cabernet') || s.includes('merlot')) return 'Wine';
  if (s.includes('na ') || s.includes('non-alc') || s.includes('soda') || s.includes('juice') || s.includes('soft')) return 'NA';
  return raw || 'Other';
}

// BCS scoring: 0 shrink → 100; 5% shrink → 80; 15% shrink → 50; ≥30% → 0
function scoreForShrinkPct(shrinkPct: number): number {
  if (shrinkPct <= 0) return 100;
  if (shrinkPct >= 0.30) return 0;
  // Linear from 0% → 100, 30% → 0
  return Math.max(0, Math.min(100, Math.round(100 - (shrinkPct / 0.30) * 100)));
}

export function runBeverageCostScore(csv: string): BevReport | BevError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Beverage inventory + pour close needed.' };
  }

  const iStore    = findCol(headers, ['Location', 'LocationName', 'Store', 'Site', 'Restaurant']);
  const iCategory = findCol(headers, ['Category', 'Department', 'Class']);
  const iConsumed = findCol(headers, ['Consumed', 'UnitsConsumed', 'InventoryConsumed', 'BottlesUsed', 'PhysicalDelta']);
  const iPoured   = findCol(headers, ['Poured', 'POSPours', 'UnitsPoured', 'BottlesPoured', 'TheoreticalPour']);
  const iUnitPrice= findCol(headers, ['UnitPrice', 'AvgUnitPrice', 'AvgPrice', 'RetailPrice']);

  const missing: string[] = [];
  if (iStore < 0)    missing.push('Location / Store');
  if (iCategory < 0) missing.push('Category / Department');
  if (iConsumed < 0) missing.push('Consumed / Units Consumed');
  if (iPoured < 0)   missing.push('Poured / POS Pours');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Beverage CSV needs Location, Category, Consumed (inventory delta), Poured (from POS). Optional Unit Price for revenue-lost calculation.',
      detectedColumns: headers,
    };
  }

  type Row = { store: string; category: string; consumed: number; poured: number; unitPrice: number };
  const parsed: Row[] = [];
  for (const r of rows) {
    const store = (r[iStore] || '').trim();
    if (!store) continue;
    parsed.push({
      store,
      category: classifyCategory((r[iCategory] || '').trim()),
      consumed: num(r[iConsumed]),
      poured: num(r[iPoured]),
      unitPrice: iUnitPrice >= 0 ? num(r[iUnitPrice]) : 0,
    });
  }
  if (!parsed.length) {
    return { ok: false, error: 'No valid rows after parsing', hint: 'Check Location and category columns are populated.' };
  }

  // Aggregate per store, per category
  const byStore = new Map<string, Map<string, { consumed: number; poured: number; revenueLost: number }>>();
  for (const r of parsed) {
    let perCat = byStore.get(r.store);
    if (!perCat) { perCat = new Map(); byStore.set(r.store, perCat); }
    const agg = perCat.get(r.category) || { consumed: 0, poured: 0, revenueLost: 0 };
    agg.consumed += r.consumed;
    agg.poured += r.poured;
    const shrink = Math.max(0, r.consumed - r.poured);
    agg.revenueLost += shrink * r.unitPrice;
    perCat.set(r.category, agg);
  }

  const perStore: StoreBev[] = Array.from(byStore.entries()).map(([store, cats]) => {
    const byCategory: BevCategoryRow[] = Array.from(cats.entries()).map(([category, v]) => {
      const shrinkUnits = Math.max(0, v.consumed - v.poured);
      const shrinkPct = v.consumed > 0 ? shrinkUnits / v.consumed : 0;
      return { category, consumed: v.consumed, poured: v.poured, shrinkUnits, shrinkPct, revenueLost: v.revenueLost };
    }).sort((a, b) => b.shrinkUnits - a.shrinkUnits);
    const consumed = byCategory.reduce((s, c) => s + c.consumed, 0);
    const poured = byCategory.reduce((s, c) => s + c.poured, 0);
    const shrinkUnits = byCategory.reduce((s, c) => s + c.shrinkUnits, 0);
    const revenueLost = byCategory.reduce((s, c) => s + c.revenueLost, 0);
    const shrinkPct = consumed > 0 ? shrinkUnits / consumed : 0;
    return {
      store,
      bcsScore: scoreForShrinkPct(shrinkPct),
      consumed, poured, shrinkUnits, shrinkPct, revenueLost,
      byCategory,
    };
  }).sort((a, b) => a.bcsScore - b.bcsScore);

  const networkConsumed = perStore.reduce((s, x) => s + x.consumed, 0);
  const networkPoured = perStore.reduce((s, x) => s + x.poured, 0);
  const networkShrinkUnits = perStore.reduce((s, x) => s + x.shrinkUnits, 0);
  const networkRevenueLost = perStore.reduce((s, x) => s + x.revenueLost, 0);
  const networkShrinkPct = networkConsumed > 0 ? networkShrinkUnits / networkConsumed : 0;

  return {
    rowsParsed: parsed.length,
    storesCount: perStore.length,
    networkConsumed,
    networkPoured,
    networkShrinkUnits,
    networkShrinkPct,
    networkRevenueLost,
    networkBcsScore: scoreForShrinkPct(networkShrinkPct),
    perStore,
  };
}
