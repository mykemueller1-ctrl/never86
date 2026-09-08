import { describe, expect, it } from 'vitest';
import { CTAP_SEAT1_OPERATOR_ID, CTAP_SEAT1_PUBLIC_LABEL } from './ctapSeat1';
import {
  NAG_SEAT_RESTAURANT_NAME,
  deskHeaderIsolated,
  deskSeatLabel,
  deskSeatTitle,
  isCtapSeat,
  isNagRestaurantName,
  restaurantNameHintFromOperatorId,
  toastMayAnswerSeat,
} from './seatIsolation';

describe('Max Grill / New American Grill seat isolation', () => {
  it('locks the present store name to New American Grill, not Max Grill', () => {
    expect(NAG_SEAT_RESTAURANT_NAME).toBe('New American Grill');
    expect(isNagRestaurantName('New American Grill')).toBe(true);
    expect(isNagRestaurantName('--The New American Grill')).toBe(true);
    expect(isNagRestaurantName('The New American Grill')).toBe(true);
    expect(isNagRestaurantName('Max Grill')).toBe(true);
    expect(deskSeatLabel('Max Grill')).toBe('New American Grill');
    expect(deskSeatLabel('  The New American Grill  ')).toBe('New American Grill');
    expect(isNagRestaurantName('Community Tap')).toBe(false);
  });

  it('never mixes New American Grill with Community Tap Seat 1 on the header', () => {
    const visible = deskSeatLabel('New American Grill');
    const title = deskSeatTitle('New American Grill');
    expect(visible).toBe('New American Grill');
    expect(title).toBe('New American Grill');
    expect(title).not.toMatch(/Community Tap/i);
    expect(title).not.toMatch(/seat\s*1/i);
    expect(title).not.toBe(CTAP_SEAT1_PUBLIC_LABEL);
    expect(deskHeaderIsolated(visible, title)).toBe(true);
    expect(deskHeaderIsolated('New American Grill', CTAP_SEAT1_PUBLIC_LABEL)).toBe(false);
  });

  it('keeps Community Tap Seat 1 on the CTAP canary only', () => {
    expect(deskSeatLabel('Community Tap')).toBe('Community Tap');
    expect(deskSeatTitle('Community Tap')).toBe(CTAP_SEAT1_PUBLIC_LABEL);
    expect(deskHeaderIsolated(deskSeatLabel('Community Tap'), deskSeatTitle('Community Tap'))).toBe(true);
  });

  it('does not treat the free-seat floor id as Community Tap when the store is NAG', () => {
    const floor = `seat:${CTAP_SEAT1_OPERATOR_ID}`;
    expect(isCtapSeat(floor, 'New American Grill')).toBe(false);
    expect(isCtapSeat(floor, 'Community Tap')).toBe(true);
    expect(isCtapSeat(floor)).toBe(false);
    expect(toastMayAnswerSeat(floor, 'New American Grill')).toBe(true);
    expect(toastMayAnswerSeat(floor, 'Community Tap')).toBe(false);
    expect(toastMayAnswerSeat('demo:nag-toast')).toBe(true);
    expect(toastMayAnswerSeat('demo:ctap-seat1')).toBe(false);
    expect(restaurantNameHintFromOperatorId('demo:nag-toast')).toBe('New American Grill');
    expect(restaurantNameHintFromOperatorId('demo:ctap-void-only')).toBe('Community Tap');
  });
});
