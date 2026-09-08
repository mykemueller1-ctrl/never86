import { readFileSync } from 'node:fs';
import path from 'node:path';
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
import { CTAP_TOAST_CONTAMINANT_SOURCE, reportSourceTagsForSeat } from './reportAdapters';

describe('CTAP Seat 1 POS lock', () => {
  it('locks Seat 1 to PDQ and refuses Toast on CTAP ids', () => {
    expect(CTAP_SEAT1_POS).toBe('pdq');
    expect(isCtapSeat1Id('demo:ctap-seat1')).toBe(true);
    expect(isCtapSeat1Id('demo:ctap-void-only')).toBe(true);
    expect(isCtapSeat1Id(`seat:${CTAP_SEAT1_OPERATOR_ID}`, 'Community Tap')).toBe(true);
    expect(isCtapSeat1Id(`seat:${CTAP_SEAT1_OPERATOR_ID}`, 'New American Grill')).toBe(false);
    expect(isCtapSeat1Id('community-tap-seat-1')).toBe(true);
    expect(toastMayAnswerSeat('demo:ctap-seat1')).toBe(false);
    expect(toastMayAnswerSeat('demo:nag-toast')).toBe(true);
    expect(toastMayAnswerSeat('demo:alpha')).toBe(true);
    expect(toastMayAnswerSeat(`seat:${CTAP_SEAT1_OPERATOR_ID}`, 'New American Grill')).toBe(true);
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

  it('does not store Toast parse $ on a CTAP seat; NAG still can', () => {
    const bytes = new Uint8Array(readFileSync(path.join(process.cwd(), 'tests/fixtures/toast', 'SalesSummary_2026-08-31.csv')));
    const ctap = reportSourceTagsForSeat('demo:ctap-seat1', 'SalesSummary_2026-08-31.csv', bytes);
    expect(ctap.map((tag) => tag.source)).toEqual([CTAP_TOAST_CONTAMINANT_SOURCE]);
    expect(ctap.map((tag) => tag.source).join(' ')).not.toMatch(/1211\.85|36827\.34|toast-parse:v1:/);

    const nag = reportSourceTagsForSeat('demo:nag-toast', 'SalesSummary_2026-08-31.csv', bytes);
    expect(nag.some((tag) => tag.source.startsWith('toast-parse:v1:'))).toBe(true);
  });
});
