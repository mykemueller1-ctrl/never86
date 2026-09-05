import { describe, expect, it } from 'vitest';
import {
  FREE_SEAT_ID_FLOOR,
  MIN_FREE_SEAT_PASSWORD_LEN,
  SeatActivationAbort,
  activationEmailConfigured,
  activationTokenIsConsumable,
  chooseLoginPlane,
  hashActivationToken,
  isFreeSeatOperatorId,
  mintActivationToken,
  normalizeEmail,
  normalizeRestaurant,
  publicActivationAccepted,
  refuseSecondFreeSeat,
  refuseSecondFreeStore,
  setFreeSeatPassword,
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

  it('narrows refuseSecondFreeStore.error for production TypeScript', () => {
    const second = refuseSecondFreeStore(1);
    if (!second.ok) {
      const payload: { ok: false; error: string; status: number } = {
        ok: false,
        error: second.error,
        status: 409,
      };
      expect(payload.error).toMatch(/one store/);
    } else {
      throw new Error('expected refusal');
    }
  });

  it('fails closed when activation email is not configured', () => {
    const prev = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    expect(activationEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = '  ';
    expect(activationEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = 're_test';
    expect(activationEmailConfigured()).toBe(true);
    if (prev === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prev;
  });

  it('never puts a raw token on the public activation body', () => {
    const minted = mintActivationToken(1_700_000_000_000);
    const body = publicActivationAccepted(minted.expiresAt);
    const json = JSON.stringify(body);
    expect(json).not.toContain(minted.rawToken);
    expect(body).not.toHaveProperty('rawToken');
    expect(body).not.toHaveProperty('debugActivatePath');
    expect(body.success).toBe(true);
  });

  it('consumes a token only when unused and unexpired', () => {
    const now = 1_700_000_000_000;
    expect(
      activationTokenIsConsumable({ consumedAt: null, expiresAt: new Date(now + 1) }, now),
    ).toBe(true);
    expect(
      activationTokenIsConsumable({ consumedAt: new Date(now), expiresAt: new Date(now + 1) }, now),
    ).toBe(false);
    expect(
      activationTokenIsConsumable({ consumedAt: null, expiresAt: new Date(now) }, now),
    ).toBe(false);
  });

  it('blocks Neon→OPS same-email bad-password fallback', () => {
    expect(chooseLoginPlane({ passwordHash: 'x' }, false)).toBe('deny-neon');
    expect(chooseLoginPlane({ passwordHash: 'x' }, true)).toBe('neon');
    expect(chooseLoginPlane(null, false)).toBe('ops');
  });

  it('rejects a self-service password shorter than the minimum, before touching Neon', async () => {
    const result = await setFreeSeatPassword(1_000_001, 'owner@example.test', 'short');
    expect(result).toEqual({
      ok: false,
      error: `Password must be at least ${MIN_FREE_SEAT_PASSWORD_LEN} characters.`,
      status: 400,
    });
  });

  it('aborts activation so second-store and id-namespace failures can roll back', () => {
    const second = refuseSecondFreeStore(1);
    if (!second.ok) {
      const abort = new SeatActivationAbort({ ok: false, error: second.error, status: 409 });
      expect(abort.result.ok).toBe(false);
      expect(abort.result.status).toBe(409);
    }
    const idAbort = new SeatActivationAbort({
      ok: false,
      error: 'Free-seat id namespace misconfigured. Contact support.',
      status: 500,
    });
    expect(idAbort.result.status).toBe(500);
  });
});
