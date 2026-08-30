import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runThreePFeeFinder } from './threePFeeFinderCsv';

const sample = readFileSync(join(__dirname, '../../public/samples/swarm/3p-fee-finder.csv'), 'utf8');

describe('runThreePFeeFinder', () => {
  it('runs Quick Win math on the sample statement CSV', () => {
    const result = runThreePFeeFinder(sample);
    expect(result).not.toHaveProperty('ok', false);
    if ('ok' in result) return;
    expect(result.portalLoginRequired).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].documentedDeductions).toBe(730);
    expect(result.rows[0].observedMarketplaceCostPct).toBeCloseTo(14.6, 5);
    expect(result.rows[0].expectedPayout).toBe(4270);
    expect(result.rows[0].payoutVariance).toBe(0);
    expect(result.rows[0].sourceStatus).toBe('unverified');
    expect(result.rows[0].claimBoundary).toMatch(/not a contract test/i);
  });

  it('rejects an empty file without throwing', () => {
    const result = runThreePFeeFinder('');
    expect(result).toEqual(expect.objectContaining({ ok: false }));
  });
});
