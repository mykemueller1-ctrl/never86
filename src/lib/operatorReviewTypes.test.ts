import { describe, expect, it } from 'vitest';
import { localReviewEnabled, spiritCostPerPour } from './operatorReviewTypes';

describe('private local review boundary', () => {
  it('never enables a customer snapshot in production, even with a configured path', () => {
    expect(localReviewEnabled('production', 'localhost:3101', '/private/snapshot.json')).toBe(false);
  });
  it('requires an explicitly configured development snapshot and exact loopback host', () => {
    expect(localReviewEnabled('development', '127.0.0.1:3101', '/private/snapshot.json')).toBe(true);
    expect(localReviewEnabled('development', 'localhost:3101', undefined)).toBe(false);
    for (const host of ['never86.ai', 'localhost.evil.example', 'localhost@evil.example', null]) {
      expect(localReviewEnabled('development', host, '/private/snapshot.json')).toBe(false);
    }
  });
});

describe('spirit cost from supplied measurements', () => {
  it('converts US fluid ounces to ml and does not include mixer costs', () => {
    expect(spiritCostPerPour(25, 750, 1.5)).toBeCloseTo(1.478676478, 6);
  });
  it('rejects unusable measurements instead of showing a dollar result', () => {
    for (const cost of [0, -1, NaN, Infinity]) expect(spiritCostPerPour(cost, 750, 1.5)).toBeNull();
    expect(spiritCostPerPour(25, 0, 1.5)).toBeNull();
  });
});
