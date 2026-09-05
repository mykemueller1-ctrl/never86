import { describe, expect, it } from 'vitest';
import {
  CTAP_SEAT1_EMAIL_DEFAULT,
  CTAP_SEAT1_OPERATOR_ID,
  CTAP_SEAT1_PUBLIC_LABEL,
  CTAP_SEAT1_RESTAURANT_DEFAULT,
  ctapSeat1Email,
  isCtapSeat1Email,
  restaurantNameForSeatClaim,
} from './ctapSeat1';
import { FREE_SEAT_ID_FLOOR } from './operatorActivation';
import { OPERATOR_V2_BLUE, OPERATOR_V2_PLATES, nextMissingPlate } from './operatorV2';

describe('CTAP seat 1 canary', () => {
  it('locks the public shop email and restaurant label', () => {
    expect(CTAP_SEAT1_EMAIL_DEFAULT).toBe('communitypizza2026@gmail.com');
    expect(CTAP_SEAT1_RESTAURANT_DEFAULT).toBe('Community Tap');
    expect(CTAP_SEAT1_PUBLIC_LABEL).toMatch(/Community Tap/);
    expect(CTAP_SEAT1_PUBLIC_LABEL).toMatch(/seat 1/);
    expect(CTAP_SEAT1_OPERATOR_ID).toBe(FREE_SEAT_ID_FLOOR);
    expect(ctapSeat1Email()).toBe('communitypizza2026@gmail.com');
    expect(isCtapSeat1Email('  CommunityPizza2026@gmail.com ')).toBe(true);
    expect(isCtapSeat1Email('stranger@example.com')).toBe(false);
  });

  it('forces Community Tap as the restaurant name for the canary email', () => {
    expect(restaurantNameForSeatClaim('communitypizza2026@gmail.com', 'Something Else')).toBe(
      'Community Tap',
    );
    expect(restaurantNameForSeatClaim('owner@other.example', 'Ada’s Pizza')).toBe('Ada’s Pizza');
  });

  it('does not put private dollars, PINs, or staff names in the lock', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const source = readFileSync(require('node:path').resolve('src/lib/ctapSeat1.ts'), 'utf8');
    expect(source).not.toMatch(/\$\d/);
    expect(source).not.toMatch(/\bPIN\b/);
    expect(source).not.toMatch(/karlee|sturtz/i);
  });
});

describe('Operator V2 plates', () => {
  it('ships schedule, labor cards, menu, and order guide suck-in plates in blue', () => {
    expect(OPERATOR_V2_BLUE).toBe('#0066ff');
    expect(OPERATOR_V2_PLATES.map((plate) => plate.id)).toEqual([
      'schedule',
      'labor-cards',
      'menu',
      'order-guide',
    ]);
    expect(nextMissingPlate(new Set()).id).toBe('schedule');
    expect(nextMissingPlate(new Set(['schedule'])).id).toBe('labor-cards');
    expect(OPERATOR_V2_PLATES.every((plate) => plate.ask.length > 20)).toBe(true);
  });
});
