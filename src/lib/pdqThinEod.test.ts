import { describe, expect, it } from 'vitest';
import { parsePdqReport } from './pdqEodParse';
import { PDQ_INGEST_PRIMARY_EMAIL, PDQ_INGEST_SECONDARY_EMAIL } from './pdqIngest';
import {
  PDQ_THIN_EOD,
  chicagoYmd,
  pickPdqPackForDate,
  resolvePdqAskedDate,
  thinEodMissingFacts,
} from './pdqThinEod';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const now = new Date('2026-08-25T17:00:00.000Z');

function load(name: string): string {
  return readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq', name), 'utf8');
}

describe('Thin EOD lock', () => {
  it('is a Verified hard-Missing / secondary-crosscheck lock', () => {
    expect(PDQ_THIN_EOD.noZ).toBe('hard-missing');
    expect(PDQ_THIN_EOD.secondaryCrosscheck).toBe(true);
    expect(PDQ_THIN_EOD.voidOnlyVoidsVerified).toBe(true);
    expect(PDQ_THIN_EOD.noRegen).toBe(true);
    expect(PDQ_THIN_EOD.noOtherDays).toBe(true);
  });

  it('resolves yesterday in Chicago and does not take another day', () => {
    expect(chicagoYmd(now, 0)).toBe('2026-08-25');
    expect(resolvePdqAskedDate('net sales yesterday', now)).toBe('2026-08-24');
    expect(resolvePdqAskedDate('What were net sales Aug 31?', now)).toBe('2026-08-31');
    expect(resolvePdqAskedDate('food today', now)).toBeNull();
  });

  it('uses secondary same-morning Z before Missing, never another date', () => {
    const otherDay = parsePdqReport(load('sample-z-missing-pop.txt'), '8-23-2026 ZReport_Summary.pdf');
    const secondary = parsePdqReport(
      `To: ${PDQ_INGEST_SECONDARY_EMAIL}\n\n${load('sample-z-large-pizzas.txt')}`,
      '8-24-2026 ZReport_Summary.pdf',
    );
    const primaryVoid = parsePdqReport(
      `To: ${PDQ_INGEST_PRIMARY_EMAIL}\n\n${load('sample-void-promo-negatives.txt')}`,
      '8-24-2026 Void_Promo_Report.pdf',
    );
    expect(otherDay && secondary && primaryVoid).toBeTruthy();
    if (!otherDay || !secondary || !primaryVoid) return;
    const packs = [otherDay, secondary, primaryVoid];
    expect(pickPdqPackForDate(packs, 'z-summary', '2026-08-24')?.filename).toBe('8-24-2026 ZReport_Summary.pdf');
    expect(pickPdqPackForDate(packs, 'z-summary', '2026-08-24')?.ingestLane).toBe('secondary');
    expect(pickPdqPackForDate(packs, 'z-summary', '2026-08-25')).toBeNull();
    expect(pickPdqPackForDate(packs, 'void-promo', '2026-08-24')?.family).toBe('void-promo');
    expect(thinEodMissingFacts({ askedDate: '2026-08-25', hasVoids: true }).join(' ')).toMatch(/Hard Missing/);
    expect(thinEodMissingFacts({ askedDate: '2026-08-25', hasVoids: true }).join(' ')).toMatch(/Void-only thin pack/);
  });
});
