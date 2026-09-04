import { describe, expect, it } from 'vitest';
import {
  PDQ_EOD_EXPORT_PATH,
  buildIncompletePdqPacketActionShift,
  describePdqEodPacket,
  expectedPdqEodFilenames,
  pdqEodFilenamePrefix,
} from './pdqEodPacket';

describe('PDQ EOD packet contract', () => {
  it('expects three native PDFs for 2026-09-02', () => {
    expect(pdqEodFilenamePrefix('2026-09-02')).toBe('9-2-2026');
    expect(expectedPdqEodFilenames('2026-09-02')).toEqual({
      'z-summary': '9-2-2026 ZReport_Summary.pdf',
      hourly: '9-2-2026 Hourly_Sales_Report.pdf',
      'void-promo': '9-2-2026 Void_Promo_Report.pdf',
    });
  });

  it('labels a Void-only night as Missing Evidence with the export path', () => {
    const packet = describePdqEodPacket({
      businessDate: '2026-09-02',
      landed: ['void-promo'],
    });
    expect(packet.complete).toBe(false);
    expect(packet.missing).toEqual(['z-summary', 'hourly']);
    expect(packet.missingEvidence.join('\n')).toMatch(/9-2-2026 ZReport_Summary\.pdf/);
    expect(packet.missingEvidence.join('\n')).toMatch(/9-2-2026 Hourly_Sales_Report\.pdf/);
    expect(packet.missingEvidence.join('\n')).toMatch(/Missing Evidence, not \$0/);
    expect(packet.exportPath).toBe(PDQ_EOD_EXPORT_PATH);
    expect(packet.exportPath).toMatch(/PDQ Reports/);
    expect(packet.exportPath).toMatch(/No POS portal password/);
  });

  it('builds one close-packet Action Shift without inventing sales dollars', () => {
    const shift = buildIncompletePdqPacketActionShift({
      store: 'Sample Kitchen Lab',
      businessDate: '2026-09-02',
      landed: ['void-promo'],
      missing: ['z-summary', 'hourly'],
    });
    expect(shift.morningActions).toHaveLength(1);
    expect(shift.morningActions[0].id).toBe('close-packet');
    expect(shift.morningActions[0].dollarsObserved).toBeNull();
    expect(shift.summary).toMatch(/Missing Evidence/);
    expect(shift.summary).toMatch(/not a \$0 night/);
    expect(shift.summary).not.toMatch(/\$\d{2,}/);
    expect(shift.morningActions[0].move).toMatch(/9-2-2026 ZReport_Summary\.pdf/);
    expect(shift.morningActions[0].move).toMatch(/native PDFs from PDQ Reports/);
  });
});
