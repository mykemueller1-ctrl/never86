import { describe, expect, it } from 'vitest';
import { unattendedRoutineGate } from './unattendedRoutineGate';

describe('unattendedRoutineGate', () => {
  it('stays off with no parses', () => {
    const gate = unattendedRoutineGate([]);
    expect(gate.ok).toBe(false);
    expect(gate.missing).toHaveLength(3);
  });

  it('does not count two parses of the same business date', () => {
    const gate = unattendedRoutineGate([
      { family: 'z-summary', businessDate: '2026-08-24' },
      { family: 'z-summary', businessDate: '2026-08-24' },
      { family: 'hourly', businessDate: '2026-08-24' },
      { family: 'hourly', businessDate: '2026-08-25' },
      { family: 'void-promo', businessDate: '2026-08-24' },
      { family: 'void-promo', businessDate: '2026-08-25' },
    ]);
    expect(gate.ok).toBe(false);
    expect(gate.missing.map((m) => m.family)).toEqual(['z-summary']);
  });

  it('ignores rejected rows and unknown families', () => {
    const gate = unattendedRoutineGate([
      { family: 'z-summary', businessDate: '2026-08-24' },
      { family: 'z-summary', businessDate: '2026-08-25', rejected: true },
      { family: 'hourly', businessDate: '2026-08-24' },
      { family: 'hourly', businessDate: '2026-08-25' },
      { family: 'void-promo', businessDate: '2026-08-24' },
      { family: 'void-promo', businessDate: '2026-08-25' },
      { family: 'unknown', businessDate: '2026-08-26' },
    ]);
    expect(gate.ok).toBe(false);
  });

  it('opens only after two dates per required family', () => {
    const gate = unattendedRoutineGate([
      { family: 'z-summary', businessDate: '2026-08-24' },
      { family: 'z-summary', businessDate: '2026-08-25' },
      { family: 'hourly', businessDate: '2026-08-24' },
      { family: 'hourly', businessDate: '2026-08-25' },
      { family: 'void-promo', businessDate: '2026-08-24' },
      { family: 'void-promo', businessDate: '2026-08-25' },
    ]);
    expect(gate.ok).toBe(true);
    expect(gate.readyFamilies).toEqual(['z-summary', 'hourly', 'void-promo']);
  });
});
