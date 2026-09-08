import { describe, expect, it } from 'vitest';
import {
  CTAP_SEAT1_POS,
  CTAP_TOAST_CONTAMINANT_FAIL,
  assertNoToastPosForCtapSales,
  ctapSeatHasToastContaminant,
  isCtapSeat1Id,
  toastMayAnswerSeat,
} from './ctapPosLock';
import { CTAP_SEAT1_OPERATOR_ID } from './ctapSeat1';

describe('CTAP Seat 1 POS lock', () => {
  it('locks Seat 1 to PDQ and refuses Toast on CTAP ids', () => {
    expect(CTAP_SEAT1_POS).toBe('pdq');
    expect(isCtapSeat1Id('demo:ctap-seat1')).toBe(true);
    expect(isCtapSeat1Id('demo:ctap-void-only')).toBe(true);
    expect(isCtapSeat1Id(`seat:${CTAP_SEAT1_OPERATOR_ID}`)).toBe(true);
    expect(isCtapSeat1Id('community-tap-seat-1')).toBe(true);
    expect(toastMayAnswerSeat('demo:ctap-seat1')).toBe(false);
    expect(toastMayAnswerSeat('demo:nag-toast')).toBe(true);
    expect(toastMayAnswerSeat('demo:alpha')).toBe(true);
  });

  it('Fails if a Toast pack is treated as CTAP sales', () => {
    expect(() => assertNoToastPosForCtapSales('pdq')).not.toThrow();
    expect(() => assertNoToastPosForCtapSales('hy-vee')).not.toThrow();
    expect(() => assertNoToastPosForCtapSales('toast')).toThrow(CTAP_TOAST_CONTAMINANT_FAIL);
  });

  it('marks NAG Toast / Taco Bamba filenames as contaminant', () => {
    expect(ctapSeatHasToastContaminant([
      { filename: 'SalesSummary_2026-08-31.csv' },
    ])).toBe(true);
    expect(ctapSeatHasToastContaminant([
      { filename: 'missions/kristin-nag/related-not-nag-tacobamba/LaborBreakDown.csv' },
    ])).toBe(true);
    expect(ctapSeatHasToastContaminant([
      { filename: '8-24-2026 ZReport_Summary.pdf' },
    ])).toBe(false);
  });
});
