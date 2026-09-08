import { describe, expect, it } from 'vitest';
import {
  choosePersonLoginPlane,
  copyPersonPasswordHash,
  isPlusAliasEmail,
  pickAccessibleSeat,
  publicSeatsForPicker,
  restaurantsMatch,
  retiredNativeSeatEmail,
  retireNativeOperator,
  revokePersonAccess,
  shouldRetireNativeOperatorEmail,
  validatePersonPassword,
  type AccessibleSeat,
} from './personAuth';
import { MAX_FREE_SEAT_PASSWORD_LEN, MIN_FREE_SEAT_PASSWORD_LEN } from './ownerDeskAuth';

const ctap: AccessibleSeat = {
  operatorId: 1_000_000,
  email: 'ktmaduna@gmail.com',
  restaurantName: 'Community Tap',
  plane: 'neon',
};

const maxGrill: AccessibleSeat = {
  operatorId: 1_000_042,
  email: 'owner@max.test',
  restaurantName: 'New American Grill',
  plane: 'neon',
};

describe('person password lock', () => {
  it('refuses plus-alias emails so CoS cannot mint invented seats', () => {
    expect(isPlusAliasEmail('ktmaduna+ctap@gmail.com')).toBe(true);
    expect(isPlusAliasEmail('ktmaduna+max@gmail.com')).toBe(true);
    expect(isPlusAliasEmail('  KTMaduna@gmail.com ')).toBe(false);
    expect(isPlusAliasEmail('ktmaduna@gmail.com')).toBe(false);
  });

  it('keeps one password plane: person/Neon hit never falls through to OPS', () => {
    expect(choosePersonLoginPlane({ personHash: 'x', neonHash: 'y', personOk: true, neonOk: false })).toBe('person');
    expect(choosePersonLoginPlane({ personHash: 'x', neonHash: 'y', personOk: false, neonOk: true })).toBe('deny');
    expect(choosePersonLoginPlane({ personHash: null, neonHash: 'y', personOk: false, neonOk: false })).toBe('deny');
    expect(choosePersonLoginPlane({ personHash: null, neonHash: 'y', personOk: false, neonOk: true })).toBe('neon');
    expect(choosePersonLoginPlane({ personHash: null, neonHash: null, personOk: false, neonOk: false })).toBe('ops');
  });

  it('opens each isolated store with the same email when store name is supplied', () => {
    const both = [ctap, maxGrill];
    const tap = pickAccessibleSeat(both, 'Community Tap');
    const grill = pickAccessibleSeat(both, 'new american  grill');
    expect(tap).toEqual({ ok: true, seat: ctap });
    expect(grill).toEqual({ ok: true, seat: maxGrill });
    expect(tap.ok && tap.seat.operatorId).not.toBe(grill.ok && grill.seat.operatorId);
  });

  it('asks for a store pick when one email has two seats and no store name', () => {
    const picked = pickAccessibleSeat([ctap, maxGrill]);
    expect(picked.ok).toBe(false);
    if (!picked.ok) {
      expect(picked.code).toBe('pick_store');
      expect(publicSeatsForPicker(picked.seats)).toEqual([
        { restaurantName: 'Community Tap' },
        { restaurantName: 'New American Grill' },
      ]);
    }
  });

  it('does not invent a store match', () => {
    const picked = pickAccessibleSeat([ctap], 'New American Grill');
    expect(picked.ok).toBe(false);
    if (!picked.ok) expect(picked.code).toBe('unknown_store');
    expect(restaurantsMatch('Community Tap', 'community  tap')).toBe(true);
    expect(restaurantsMatch('Community Tap', 'New American Grill')).toBe(false);
  });

  it('refuses plus-alias detach and same-email hash copy before touching Neon', async () => {
    await expect(revokePersonAccess('ktmaduna+fun@gmail.com', 1_000_000)).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    await expect(retireNativeOperator('ktmaduna+fun@gmail.com', 1_000_000)).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    await expect(
      copyPersonPasswordHash('mykemueller1@gmail.com', 'mykemueller1@gmail.com'),
    ).resolves.toMatchObject({ ok: false, status: 400 });
    await expect(copyPersonPasswordHash('owner+max@gmail.com', 'ktmaduna@gmail.com')).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it('retires Fun native email with a hyphen, never a plus-alias', () => {
    expect(retiredNativeSeatEmail(1_000_000)).toBe('fun-retired-1000000@invalid.never86');
    expect(isPlusAliasEmail(retiredNativeSeatEmail(1_000_000))).toBe(false);
    expect(
      shouldRetireNativeOperatorEmail({
        operatorId: 1_000_000,
        operatorEmail: 'mykemueller1@gmail.com',
        personEmail: 'mykemueller1@gmail.com',
        restaurantName: 'Fun',
      }),
    ).toBe(true);
    expect(
      shouldRetireNativeOperatorEmail({
        operatorId: 1_000_007,
        operatorEmail: 'ktmaduna@gmail.com',
        personEmail: 'mykemueller1@gmail.com',
        restaurantName: 'New American Grill',
      }),
    ).toBe(false);
    expect(
      shouldRetireNativeOperatorEmail({
        operatorId: 1_000_007,
        operatorEmail: 'mykemueller1@gmail.com',
        personEmail: 'mykemueller1@gmail.com',
        restaurantName: 'New American Grill',
      }),
    ).toBe(true);
  });

  it('validates password length before hashing', () => {
    expect(validatePersonPassword('short')).toEqual({
      ok: false,
      error: `Password must be at least ${MIN_FREE_SEAT_PASSWORD_LEN} characters.`,
      status: 400,
    });
    expect(validatePersonPassword('x'.repeat(MAX_FREE_SEAT_PASSWORD_LEN + 1)).ok).toBe(false);
    expect(validatePersonPassword('long-enough-password').ok).toBe(true);
  });
});
