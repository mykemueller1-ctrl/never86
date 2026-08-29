import { describe, expect, it } from 'vitest';
import { CTAP_LAB_WEEKDAYS } from './ctapLabPack';
import { STATION_SEAT_KEYS } from './staffSeatAuth';
import {
  SYNTHETIC_LOCATION_A_ID,
  SYNTHETIC_LOCATION_B_ID,
  SYNTHETIC_OPERATOR_A_ID,
  SYNTHETIC_OPERATOR_B_ID,
} from './staffSeatFixtures';
import {
  STAFF_SCHEDULE_PACK_ID,
  STAFF_SCHEDULE_STATUS,
  STAFF_SCHEDULE_WEEK_DATES,
  availabilityVisibleTo,
  buildStaffScheduleDesk,
  buildWeekStrip,
  canSeeNeedsApprovalInbox,
  coverageCountsForWeekday,
  coverageSummary,
  decideApproval,
  findStaffSchedulePrivacyHits,
  myShiftsForSeat,
  needsApprovalInbox,
  sameHouseSameSeat,
  setStandingAvailability,
  submitSwapOrCover,
  submitTimeOff,
} from './staffScheduleDesk';

describe('staff Schedule / Time Off', () => {
  it('builds a week strip and my shifts without invented roster names', () => {
    const fridayPizza = buildStaffScheduleDesk({ seatKey: 'pizza', weekday: 'Friday' });
    expect(fridayPizza.packId).toBe(STAFF_SCHEDULE_PACK_ID);
    expect(fridayPizza.status).toBe(STAFF_SCHEDULE_STATUS);
    expect(fridayPizza.date).toBe(STAFF_SCHEDULE_WEEK_DATES.Friday);
    expect(fridayPizza.weekStrip.map((day) => day.weekday)).toEqual([...CTAP_LAB_WEEKDAYS]);
    expect(fridayPizza.weekStrip.every((day) => day.namedPeople === false)).toBe(true);
    expect(fridayPizza.myShifts.length).toBeGreaterThan(0);
    expect(fridayPizza.myShifts.every((shift) => shift.namedPerson === false)).toBe(true);
    expect(fridayPizza.myShifts.every((shift) => shift.stationLabel === 'Pizza station')).toBe(true);
    expect(fridayPizza.boundary.inventedNames).toBe(false);
    expect(fridayPizza.boundary.neonApply).toBe(false);
    expect(fridayPizza.boundary.liveCredentials).toBe(false);
    expect(fridayPizza.boundary.autoEmail).toBe(false);

    const weekMine = myShiftsForSeat('driver');
    expect(weekMine.some((shift) => shift.daypart === 'weekday_11_1' && shift.slotLabel.includes('unnamed'))).toBe(true);
    expect(weekMine.some((shift) => shift.weekday === 'Friday' && shift.slotLabel === 'Driver slot')).toBe(true);
  });

  it('posts Time Off inside Schedule as full or partial day with date and note', () => {
    const full = submitTimeOff({
      requests: [],
      fromSeatKey: 'server',
      kind: 'full_day',
      weekday: 'Tuesday',
      note: 'Full day off — family',
      at: '2026-08-28T18:00:00.000-05:00',
    });
    expect(full.ok).toBe(true);
    if (full.ok) {
      expect(full.posted.kind).toBe('full_day');
      expect(full.posted.date).toBe('2026-08-25');
      expect(full.posted.window).toBeNull();
      expect(full.posted.note).toBe('Full day off — family');
      expect(full.posted.status).toBe('needs_approval');
      expect(full.posted.routedTo).toBe('Kenzy');
      expect(full.posted.mailSent).toBe(false);
    }

    const partial = submitTimeOff({
      requests: [],
      fromSeatKey: 'driver',
      kind: 'partial_day',
      weekday: 'Wednesday',
      window: '11:00–13:00',
      note: 'Need the 11–1 window',
      at: '2026-08-28T18:05:00.000-05:00',
    });
    expect(partial.ok).toBe(true);
    if (partial.ok) {
      expect(partial.posted.kind).toBe('partial_day');
      expect(partial.posted.date).toBe('2026-08-26');
      expect(partial.posted.window).toBe('11:00–13:00');
      expect(partial.posted.routedTo).toBe('Tom');
    }

    const missingWindow = submitTimeOff({
      requests: [],
      fromSeatKey: 'pizza',
      kind: 'partial_day',
      weekday: 'Friday',
      note: 'Leaving early',
      at: '2026-08-28T18:06:00.000-05:00',
    });
    expect(missingWindow.ok).toBe(false);

    const dollars = submitTimeOff({
      requests: [],
      fromSeatKey: 'server',
      kind: 'full_day',
      weekday: 'Monday',
      note: 'Need $80 off',
      at: '2026-08-28T18:07:00.000-05:00',
    });
    expect(dollars.ok).toBe(false);

    const owner = submitTimeOff({
      requests: [],
      fromSeatKey: 'owner',
      kind: 'full_day',
      weekday: 'Monday',
      note: 'Owner off',
      at: '2026-08-28T18:08:00.000-05:00',
    });
    expect(owner.ok).toBe(false);
  });

  it('allows same-house same-seat swap or cover and rejects cross-house, cross-seat, and cross-tenant', () => {
    expect(sameHouseSameSeat('pizza', 'pizza')).toBe(true);
    expect(sameHouseSameSeat('server', 'bartender')).toBe(false);
    expect(sameHouseSameSeat('server', 'pizza')).toBe(false);
    expect(sameHouseSameSeat('owner', 'owner')).toBe(false);

    const swap = submitSwapOrCover({
      requests: [],
      kind: 'swap',
      fromSeatKey: 'pizza',
      counterpartSeatKey: 'pizza',
      weekday: 'Friday',
      note: 'Swap this pizza slot with another pizza slot in this house',
      at: '2026-08-28T19:00:00.000-05:00',
    });
    expect(swap.ok).toBe(true);
    if (swap.ok) {
      expect(swap.posted.namedPerson).toBe(false);
      expect(swap.posted.status).toBe('needs_approval');
      expect(swap.posted.routedTo).toBe('Tom');
      expect(swap.posted.mailSent).toBe(false);
    }

    const cover = submitSwapOrCover({
      requests: [],
      kind: 'cover',
      fromSeatKey: 'server',
      counterpartSeatKey: 'server',
      weekday: 'Saturday',
      note: 'Cover this server slot',
      at: '2026-08-28T19:01:00.000-05:00',
    });
    expect(cover.ok).toBe(true);

    const crossSeat = submitSwapOrCover({
      requests: [],
      kind: 'cover',
      fromSeatKey: 'pizza',
      counterpartSeatKey: 'line_cook',
      weekday: 'Friday',
      note: 'Cover line',
      at: '2026-08-28T19:02:00.000-05:00',
    });
    expect(crossSeat.ok).toBe(false);
    if (!crossSeat.ok) expect(crossSeat.error).toMatch(/same-house and same-seat/i);

    const crossHouse = submitSwapOrCover({
      requests: [],
      kind: 'swap',
      fromSeatKey: 'server',
      counterpartSeatKey: 'driver',
      weekday: 'Friday',
      note: 'Cross house',
      at: '2026-08-28T19:03:00.000-05:00',
    });
    expect(crossHouse.ok).toBe(false);

    const crossTenant = submitSwapOrCover({
      requests: [],
      kind: 'cover',
      fromSeatKey: 'pizza',
      counterpartSeatKey: 'pizza',
      weekday: 'Friday',
      note: 'Other house pizza slot',
      at: '2026-08-28T19:04:00.000-05:00',
      operatorId: SYNTHETIC_OPERATOR_A_ID,
      locationId: SYNTHETIC_LOCATION_A_ID,
      counterpartOperatorId: SYNTHETIC_OPERATOR_B_ID,
      counterpartLocationId: SYNTHETIC_LOCATION_B_ID,
    });
    expect(crossTenant.ok).toBe(false);
    if (!crossTenant.ok) expect(crossTenant.error).toMatch(/tenant/i);
  });

  it('stores standing availability as station windows, not people', () => {
    const posted = setStandingAvailability({
      rows: [],
      seatKey: 'pizza',
      weekday: 'Friday',
      window: 'night',
      available: true,
    });
    expect(posted.ok).toBe(true);
    if (posted.ok) {
      expect(posted.posted.namedPerson).toBe(false);
      expect(posted.posted.stationLabel).toBe('Pizza station');
      expect(posted.posted.available).toBe(true);
    }

    const owner = setStandingAvailability({
      rows: [],
      seatKey: 'owner',
      weekday: 'Monday',
      window: 'day',
      available: true,
    });
    expect(owner.ok).toBe(false);

    const rows = posted.ok ? posted.rows : [];
    expect(availabilityVisibleTo('server', rows)).toEqual([]);
    expect(availabilityVisibleTo('kitchen_manager', rows)).toHaveLength(1);
    expect(availabilityVisibleTo('foh_manager', rows)).toEqual([]);
  });

  it('posts CTap board coverage as slot counts with no invented names', () => {
    const friday = coverageCountsForWeekday('Friday');
    const saturday = coverageCountsForWeekday('Saturday');
    for (const day of [friday, saturday]) {
      expect(day).toEqual(expect.arrayContaining([
        expect.objectContaining({ station: 'pizza', slotsNeeded: 5, namedPerson: false }),
        expect.objectContaining({ station: 'line', slotsNeeded: 3, namedPerson: false }),
        expect.objectContaining({ station: 'dish', slotsNeeded: 1, namedPerson: false }),
        expect.objectContaining({ station: 'driver', slotsNeeded: 3, namedPerson: false }),
      ]));
    }
    expect(coverageSummary('Friday')).toMatch(/5 pizza/i);
    expect(coverageSummary('Friday')).toMatch(/3 line/i);
    expect(coverageSummary('Friday')).toMatch(/1 dish/i);
    expect(coverageSummary('Friday')).toMatch(/3 driver/i);

    const wednesday = coverageCountsForWeekday('Wednesday');
    expect(wednesday.some((row) => (
      row.daypart === 'weekday_11_1'
      && row.station === 'driver'
      && row.slotsNeeded === 1
      && row.slotLabel === 'Weekday 11–1 driver slot (unnamed)'
    ))).toBe(true);

    const monday = coverageCountsForWeekday('Monday');
    expect(monday.some((row) => row.station === 'foh_back')).toBe(false);
    expect(JSON.stringify([friday, saturday, wednesday, monday])).not.toMatch(/karlee|ashley|sturtz|holding/i);
    expect(JSON.stringify(friday)).not.toMatch(/\b(Tom|Kenzy)\b/);
  });

  it('shows Needs Approval only to managers for their house', () => {
    expect(canSeeNeedsApprovalInbox('foh_manager')).toBe(true);
    expect(canSeeNeedsApprovalInbox('kitchen_manager')).toBe(true);
    expect(canSeeNeedsApprovalInbox('owner')).toBe(true);
    expect(canSeeNeedsApprovalInbox('server')).toBe(false);
    expect(canSeeNeedsApprovalInbox('pizza')).toBe(false);

    const fohOff = submitTimeOff({
      requests: [],
      fromSeatKey: 'server',
      kind: 'full_day',
      weekday: 'Tuesday',
      note: 'Need Tuesday off',
      at: '2026-08-28T20:00:00.000-05:00',
    });
    const bohOff = submitTimeOff({
      requests: [],
      fromSeatKey: 'pizza',
      kind: 'partial_day',
      weekday: 'Friday',
      window: '16:00–22:00',
      note: 'Need Friday night pizza slot',
      at: '2026-08-28T20:01:00.000-05:00',
    });
    expect(fohOff.ok && bohOff.ok).toBe(true);
    const timeOff = fohOff.ok && bohOff.ok ? [...fohOff.requests, ...bohOff.requests] : [];

    expect(needsApprovalInbox({ seatKey: 'server', timeOff, swaps: [] })).toEqual([]);
    expect(needsApprovalInbox({ seatKey: 'foh_manager', timeOff, swaps: [] }).map((row) => row.fromSeatKey)).toEqual(['server']);
    expect(needsApprovalInbox({ seatKey: 'kitchen_manager', timeOff, swaps: [] }).map((row) => row.fromSeatKey)).toEqual(['pizza']);
    expect(needsApprovalInbox({ seatKey: 'owner', timeOff, swaps: [] })).toHaveLength(2);

    const denied = decideApproval({
      managerSeatKey: 'server',
      itemId: timeOff[0]?.id ?? 'missing',
      decision: 'approved',
      timeOff,
      swaps: [],
    });
    expect(denied.ok).toBe(false);

    const crossHouse = decideApproval({
      managerSeatKey: 'foh_manager',
      itemId: timeOff[1]?.id ?? 'missing',
      decision: 'approved',
      timeOff,
      swaps: [],
    });
    expect(crossHouse.ok).toBe(false);

    const approved = decideApproval({
      managerSeatKey: 'foh_manager',
      itemId: timeOff[0]?.id ?? 'missing',
      decision: 'approved',
      timeOff,
      swaps: [],
    });
    expect(approved.ok).toBe(true);
    if (approved.ok) expect(approved.timeOff[0]?.status).toBe('approved');
  });

  it('keeps private CTap names, phones, and credentials out of the schedule pack', () => {
    const desks = STATION_SEAT_KEYS.map((seatKey) =>
      buildStaffScheduleDesk({ seatKey, weekday: 'Friday' }),
    );
    expect(findStaffSchedulePrivacyHits(desks)).toEqual([]);
    expect(findStaffSchedulePrivacyHits(buildWeekStrip())).toEqual([]);
    const blob = JSON.stringify(desks);
    expect(blob).not.toMatch(/karlee|sturtz|ashley|holding/i);
    expect(blob).not.toMatch(/invite token|password|pin/i);
    expect(blob).toMatch(/unnamed/);
    expect(blob).toMatch(/canSeeNeedsApprovalInbox/);
  });
});
