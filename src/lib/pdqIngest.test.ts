import { describe, expect, it } from 'vitest';
import { CTAP_SEAT1_EMAIL_DEFAULT } from './ctapSeat1';
import {
  PDQ_INGEST_PRIMARY_EMAIL,
  PDQ_INGEST_SECONDARY_EMAIL,
  detectPdqIngestLane,
  pdqIngestLaneLabel,
  pdqIngestLaneRank,
} from './pdqIngest';

describe('PDQ ingest lanes (CoS lock)', () => {
  it('ranks primary fuller EOD over secondary CC', () => {
    expect(PDQ_INGEST_PRIMARY_EMAIL).toBe('mykemueller1@gmail.com');
    expect(PDQ_INGEST_SECONDARY_EMAIL).toBe(CTAP_SEAT1_EMAIL_DEFAULT);
    expect(detectPdqIngestLane(`To: ${PDQ_INGEST_PRIMARY_EMAIL}`)).toBe('primary');
    expect(detectPdqIngestLane(`To: ${PDQ_INGEST_SECONDARY_EMAIL}`)).toBe('secondary');
    expect(detectPdqIngestLane(
      `To: ${PDQ_INGEST_PRIMARY_EMAIL}\nCc: ${PDQ_INGEST_SECONDARY_EMAIL}`,
    )).toBe('primary');
    expect(pdqIngestLaneRank('primary')).toBeGreaterThan(pdqIngestLaneRank('secondary'));
    expect(pdqIngestLaneLabel('primary')).toMatch(/fuller EOD/);
    expect(pdqIngestLaneLabel('secondary')).toMatch(/ZReport-only/);
    expect(pdqIngestLaneLabel('primary')).not.toMatch(/@/);
    expect(pdqIngestLaneLabel('secondary')).not.toMatch(/@/);
  });
});
