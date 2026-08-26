import { describe, expect, it } from 'vitest';
import {
  hashActivationToken,
  mintActivationToken,
  normalizeEmail,
  normalizeRestaurant,
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
});
