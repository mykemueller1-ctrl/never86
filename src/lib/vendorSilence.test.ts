import { describe, expect, it } from 'vitest';
import { buildVendorSilenceTicket } from './vendorSilence';

describe('vendor silence ticket', () => {
  it('opens one review ticket when an approved cadence is exceeded', () => {
    const result = buildVendorSilenceTicket({
      vendor: 'Example Produce',
      store: 'Test Store',
      owner: 'Kitchen manager',
      lastSeenDate: '2026-08-17',
      asOfDate: '2026-08-22',
      expectedCadenceDays: 4,
    });

    expect(result).toEqual({
      ok: true,
      result: expect.objectContaining({
        daysQuiet: 5,
        thresholdDays: 4,
        status: 'review',
        ticketAction: 'open',
        sourceStatus: 'unverified',
      }),
    });
  });

  it('keeps onboarding signals advisory and pauses selected days', () => {
    const result = buildVendorSilenceTicket({
      vendor: 'Example Linen',
      lastSeenDate: '2026-08-14',
      asOfDate: '2026-08-22',
      expectedCadenceDays: 4,
      pauseWeekends: true,
      pausedDates: ['2026-08-17'],
      programStartedDate: '2026-08-15',
    });

    expect(result).toEqual({
      ok: true,
      result: expect.objectContaining({
        daysQuiet: 4,
        status: 'advisory',
        ticketAction: 'none',
      }),
    });
  });

  it('does not create a duplicate ticket', () => {
    const result = buildVendorSilenceTicket({
      vendor: 'Example Beverage',
      lastSeenDate: '2026-08-10',
      asOfDate: '2026-08-22',
      expectedCadenceDays: 7,
      existingOpenTicketId: 'vendor-42',
    });

    expect(result).toEqual({
      ok: true,
      result: expect.objectContaining({
        status: 'review',
        ticketAction: 'keep-open',
        ticketId: 'vendor-42',
      }),
    });
  });

  it('rejects invalid dates and guessed cadence', () => {
    expect(buildVendorSilenceTicket({
      vendor: 'Example',
      lastSeenDate: '2026-02-30',
      asOfDate: '2026-08-22',
      expectedCadenceDays: 4,
    })).toEqual({ ok: false, error: 'lastSeenDate must be a real calendar date.' });

    expect(buildVendorSilenceTicket({
      vendor: 'Example',
      lastSeenDate: '2026-08-20',
      asOfDate: '2026-08-22',
      expectedCadenceDays: 0,
    })).toEqual({ ok: false, error: 'expectedCadenceDays must be a positive whole number.' });
  });
});
