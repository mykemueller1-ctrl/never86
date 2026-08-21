// Void Hunter's core scoring rule, in one place. The self-serve CSV path
// (voidHunterCsv.ts) and the command-center DB path (voidHunter.ts) fed the
// exact same math from two different pipelines — so a threshold change had to
// be made in two files or the two surfaces would silently disagree. This is
// that shared rule.
import { median } from './csv/core';

export type VoidStoreBase = { name: string; net: number; voids: number; voidRate: number };
export type VoidStoreFlagged = VoidStoreBase & { excessYr: number; flagged: boolean };

export type StoreAnalysis = {
  stores: VoidStoreFlagged[];
  networkNet: number;
  networkVoids: number;
  medianStoreVoidRate: number;
  storesFlagged: number;
};

/**
 * A store whose void rate is above **1.5× the network's own peer median** is a
 * pattern to review (never a verdict). `excessYr` = voids above the peer
 * median, annualized (×3 for a ~4-month ingest window). Returns stores sorted
 * by void rate, plus the network rollups.
 */
export function analyzeStores(stores0: VoidStoreBase[]): StoreAnalysis {
  const networkNet = stores0.reduce((s, x) => s + x.net, 0);
  const networkVoids = stores0.reduce((s, x) => s + x.voids, 0);
  const med = median(stores0.map((s) => s.voidRate));
  const stores = stores0
    .map((s) => ({
      ...s,
      excessYr: Math.round(Math.max(0, s.voids - med * s.net) * 3),
      flagged: med > 0 && s.voidRate > 1.5 * med,
    }))
    .sort((a, b) => b.voidRate - a.voidRate);
  return {
    stores,
    networkNet,
    networkVoids,
    medianStoreVoidRate: med,
    storesFlagged: stores.filter((s) => s.flagged).length,
  };
}

/**
 * An employee is flagged when their void rate is above 1.5× the peer median AND
 * the dollar amount clears a floor, so a tiny check can't trip the flag.
 */
export function isEmployeeFlagged(voidRate: number, voidAmount: number, med: number): boolean {
  return med > 0 && voidRate > 1.5 * med && voidAmount > 200;
}
