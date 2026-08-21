import { describe, it, expect } from 'vitest';
import { analyzeStores, isEmployeeFlagged } from './voidAnalysis';

describe('analyzeStores', () => {
  const stores0 = [
    { name: 'A', net: 10000, voids: 100, voidRate: 0.01 },
    { name: 'B', net: 10000, voids: 200, voidRate: 0.02 },
    { name: 'C', net: 10000, voids: 400, voidRate: 0.04 },
  ];
  const r = analyzeStores(stores0);

  it('rolls up the network', () => {
    expect(r.networkNet).toBe(30000);
    expect(r.networkVoids).toBe(700);
    expect(r.medianStoreVoidRate).toBe(0.02);
  });
  it('flags only stores above 1.5× the peer median', () => {
    expect(r.storesFlagged).toBe(1);
    expect(r.stores.find((s) => s.name === 'C')!.flagged).toBe(true);
    expect(r.stores.find((s) => s.name === 'B')!.flagged).toBe(false);
  });
  it('sorts by void rate desc', () => {
    expect(r.stores.map((s) => s.name)).toEqual(['C', 'B', 'A']);
  });
  it('annualizes excess voids above the peer median (×3)', () => {
    // C: (400 − 0.02*10000) * 3 = 200*3 = 600
    expect(r.stores.find((s) => s.name === 'C')!.excessYr).toBe(600);
    expect(r.stores.find((s) => s.name === 'A')!.excessYr).toBe(0);
  });
  it('does not flag when there is no peer median (single store)', () => {
    const solo = analyzeStores([{ name: 'A', net: 10000, voids: 5000, voidRate: 0.5 }]);
    // med == the store's own rate → nothing is > 1.5× itself
    expect(solo.storesFlagged).toBe(0);
  });
});

describe('isEmployeeFlagged', () => {
  const med = 0.02;
  it('flags high rate above the dollar floor', () => {
    expect(isEmployeeFlagged(0.04, 500, med)).toBe(true);
  });
  it('respects the $200 floor', () => {
    expect(isEmployeeFlagged(0.04, 100, med)).toBe(false);
  });
  it('respects the 1.5× rate threshold', () => {
    expect(isEmployeeFlagged(0.025, 500, med)).toBe(false);
  });
  it('never flags with no peer median', () => {
    expect(isEmployeeFlagged(0.9, 5000, 0)).toBe(false);
  });
});
