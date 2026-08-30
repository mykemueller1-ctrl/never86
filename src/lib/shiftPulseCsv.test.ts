import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runShiftPulse } from './shiftPulseCsv';

const sample = readFileSync(join(__dirname, '../../public/samples/swarm/shift-pulse.csv'), 'utf8');

describe('runShiftPulse', () => {
  it('scores tonight from a CSV without a live feed', () => {
    const result = runShiftPulse(sample);
    expect(result).not.toHaveProperty('ok', false);
    if ('ok' in result) return;
    expect(result.store).toBe('Sample Store One');
    expect(result.forecastNet).toBe(4400);
    expect(result.actualNet).toBe(4444);
    expect(result.pacingPct).toBeCloseTo(101, 0);
    expect(result.stations).toHaveLength(3);
    expect(result.zeroCompStreak).toBe(2);
    expect(result.portalLoginRequired).toBe(false);
    expect(result.sourceStatus).toBe('unverified');
  });

  it('rejects headers-only without throwing', () => {
    const result = runShiftPulse('Store,Forecast Net,Actual Net\n');
    expect(result).toEqual(expect.objectContaining({ ok: false }));
  });
});
