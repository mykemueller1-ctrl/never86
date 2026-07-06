import { describe, it, expect } from 'vitest';
import { pointsWorth, usd } from './roi';

describe('pointsWorth', () => {
  it('computes monthly + annual for 2 points', () => {
    expect(pointsWorth(60000, 2)).toEqual({ monthly: 1200, annual: 14400 });
  });
  it('defaults to 2 points', () => {
    expect(pointsWorth(60000)).toEqual({ monthly: 1200, annual: 14400 });
  });
  it('scales with points', () => {
    expect(pointsWorth(100000, 4)).toEqual({ monthly: 4000, annual: 48000 });
  });
  it('clamps bad/negative input to 0', () => {
    expect(pointsWorth(-5000, 2)).toEqual({ monthly: 0, annual: 0 });
    expect(pointsWorth(NaN, 2)).toEqual({ monthly: 0, annual: 0 });
    expect(pointsWorth(50000, -1)).toEqual({ monthly: 0, annual: 0 });
  });
});

describe('usd', () => {
  it('formats whole dollars with commas', () => {
    expect(usd(14400)).toBe('$14,400');
    expect(usd(1199.6)).toBe('$1,200');
  });
});
