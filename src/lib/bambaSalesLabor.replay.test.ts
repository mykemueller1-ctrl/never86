import { describe, expect, it } from 'vitest';
import { buildBambaSalesLaborDesk } from './bambaSalesLabor/desk';
import { replayAug12SalesLabor, REPLAY_CANARY_CY_SALES, REPLAY_HIGHEST_VOID_STORE } from './bambaSalesLabor/replay';
import { FOREIGN_TENANT_PATTERN } from './bambaSalesLabor/tenant';

describe('bamba sales-labor replay harness', () => {
  it('re-runs the Aug 12 fixture and asserts system CY sales 125273.41', () => {
    const receipt = replayAug12SalesLabor();
    expect(receipt.ok).toBe(true);
    expect(receipt.systemCySales).toBe(125273.41);
    expect(receipt.systemCySales).toBe(REPLAY_CANARY_CY_SALES);
    expect(receipt.businessDate).toBe('2026-08-12');
  });

  it('asserts Landmark has the highest Daily void rate', () => {
    const receipt = replayAug12SalesLabor();
    expect(receipt.highestVoidRateStore).toBe('Landmark');
    expect(receipt.highestVoidRateStore).toBe(REPLAY_HIGHEST_VOID_STORE);
    const daily = buildBambaSalesLaborDesk().periods.daily;
    const ranked = [...daily.stores].sort((a, b) => (b.voidRate ?? 0) - (a.voidRate ?? 0));
    expect(ranked[0]?.store).toBe('Landmark');
    expect(ranked[0]?.voidRate).toBeGreaterThan(ranked[1]?.voidRate ?? 0);
  });

  it('fails the build when the canary drifts', () => {
    const desk = buildBambaSalesLaborDesk();
    expect(desk.periods.daily.system.cySales.value).toBe(125273.41);
    expect(() => {
      if (desk.periods.daily.system.cySales.value !== 125273.41) {
        throw new Error('REPLAY DRIFT');
      }
    }).not.toThrow();
  });

  it('keeps replay memory Bamba-only', () => {
    const receipt = replayAug12SalesLabor();
    expect(JSON.stringify(receipt)).not.toMatch(FOREIGN_TENANT_PATTERN);
  });
});
