import { describe, expect, it } from 'vitest';
import { PDQ_INGEST_PRIMARY_EMAIL } from './pdqIngest';
import { isRegisteredPosFamily, plannedReportAdapterHooks } from './reportAdapters';
import {
  BOH_SEAT2,
  CTAP_PAPERS_WAVES,
  HUMES_LATER_WAVE,
  HYVEE_MONDAY_CONFIRMED,
  bohSeat2RequiredForHyvee,
  ctapPapersWaveOrder,
  humesApInboxForTests,
  humesApInboxLane,
  humesIsThisDraft,
  pdqSalesPrimaryInbox,
} from './ctapPapersWave';

describe('CTAP papers wave lock', () => {
  it('drafts PDQ mornings first, then Hy-Vee liquor — not Humes-first', () => {
    expect(ctapPapersWaveOrder()).toEqual(['pdq-morning', 'hyvee-liquor']);
    expect(CTAP_PAPERS_WAVES[0]).toEqual(expect.objectContaining({ wave: '0', pos: 'pdq' }));
    expect(CTAP_PAPERS_WAVES[1]).toEqual(expect.objectContaining({ wave: '0b', pos: 'hy-vee' }));
    expect(HUMES_LATER_WAVE.wave).toBe('later');
    expect(humesIsThisDraft()).toBe(false);
    expect(isRegisteredPosFamily('humes', 'invoice')).toBe(false);
    expect(plannedReportAdapterHooks().find((row) => row.pos === 'humes')?.status).toBe('hook');
  });

  it('locks Humes as later Tue+Fri AP email + photo OCR backup', () => {
    expect([...HUMES_LATER_WAVE.days]).toEqual(['Tue', 'Fri']);
    expect(humesApInboxLane()).toBe('secondary');
    expect(HUMES_LATER_WAVE.photoOcrBackup).toBe(true);
    expect(humesApInboxForTests()).toMatch(/@/);
  });

  it('locks PDQ sales to the primary inbox', () => {
    expect(pdqSalesPrimaryInbox()).toBe(PDQ_INGEST_PRIMARY_EMAIL);
    expect(pdqSalesPrimaryInbox()).toBe('mykemueller1@gmail.com');
  });

  it('does not require Seat 2 / BOH / PFG day-before for Hy-Vee', () => {
    expect(BOH_SEAT2.role).toBe('boh-seat-2');
    expect(BOH_SEAT2.laterWork).toBe('pfg-day-before');
    expect(BOH_SEAT2.hyveePath).toBe('bar-manager-email');
    expect(bohSeat2RequiredForHyvee()).toBe(false);
  });

  it('locks Hy-Vee Monday as one check, not a default guess', () => {
    expect(HYVEE_MONDAY_CONFIRMED.lock).toBe('one-check');
    expect(HYVEE_MONDAY_CONFIRMED.covers).toMatch(/yellow slips/);
    expect(HYVEE_MONDAY_CONFIRMED.defaultGuess).toBe(false);
  });
});
