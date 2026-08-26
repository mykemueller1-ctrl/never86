import { describe, expect, it } from 'vitest';
import {
  FREE_SEAT_ID_FLOOR,
  hashActivationToken,
  isFreeSeatOperatorId,
  mintActivationToken,
  normalizeEmail,
  normalizeRestaurant,
  refuseSecondFreeSeat,
  refuseSecondFreeStore,
} from './operatorActivation';

describe('operatorActivation pure helpers', () => {
  it('normalizes email case and trim', () => {
    expect(normalizeEmail('  Myke@N86.APP ')).toBe('myke@n86.app');
  });

  it('collapses restaurant whitespace', () => {
    expect(normalizeRestaurant('  Community   Tap  ')).toBe('Community Tap');
  });

  it('hashes tokens stably and never echoes plaintext', () => {
    const a = mintActivationToken(1_700_000_000_000);
    const b = hashActivationToken(a.rawToken);
    expect(b).toBe(a.tokenHash);
    expect(a.tokenHash).not.toContain(a.rawToken);
    expect(a.tokenHash).toHaveLength(64);
    expect(a.expiresAt.getTime()).toBe(1_700_000_000_000 + 1000 * 60 * 60 * 24);
  });

  it('mints unique raw tokens', () => {
    const a = mintActivationToken();
    const b = mintActivationToken();
    expect(a.rawToken).not.toBe(b.rawToken);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it('keeps free-seat ids above OPS collision floor', () => {
    expect(isFreeSeatOperatorId(FREE_SEAT_ID_FLOOR)).toBe(true);
    expect(isFreeSeatOperatorId(FREE_SEAT_ID_FLOOR - 1)).toBe(false);
    expect(isFreeSeatOperatorId(3)).toBe(false);
  });

  it('blocks a second free store or seat', () => {
    expect(refuseSecondFreeStore(1)).toEqual({
      ok: false,
      error: 'The free plan is one store. Extra locations are paid expansion.',
    });
    expect(refuseSecondFreeSeat(1)).toEqual({
      ok: false,
      error: 'The free plan is one login. Extra seats are paid expansion.',
    });
    expect(refuseSecondFreeStore(0).ok).toBe(true);
  });
});
