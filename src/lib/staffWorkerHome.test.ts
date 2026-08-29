import { describe, expect, it } from 'vitest';
import { STATION_SEAT_KEYS } from './staffSeatAuth';
import { CTAP_LAB_WEEKDAYS } from './ctapLabPack';
import {
  BOH_HOUSE_SEATS,
  FOH_HOUSE_SEATS,
  STAFF_FLOOR_PATH,
  STAFF_WORKER_HOME_STATUS,
  SYNTHETIC_CHECKLIST_MISSES,
  SYNTHETIC_COMM_SEED,
  buildStaffWorkerHome,
  canPostCommRoom,
  canReadCommRoom,
  canViewMissBoard,
  crewCannotSeePeerMisses,
  findStaffWorkerHomePrivacyHits,
  messagesVisibleTo,
  missesVisibleTo,
  postCommMessage,
  requestOffRoute,
  requestsVisibleTo,
  submitRequestOff,
} from './staffWorkerHome';

describe('staff Worker Home', () => {
  it('wires role-day checklists by seat and weekday and keeps login/mail boundaries', () => {
    const mondayServer = buildStaffWorkerHome({ seatKey: 'server', weekday: 'Monday' });
    const fridayBartender = buildStaffWorkerHome({ seatKey: 'bartender', weekday: 'Friday' });
    expect(mondayServer.status).toBe(STAFF_WORKER_HOME_STATUS);
    expect(mondayServer.checklist.seatKey).toBe('server');
    expect(mondayServer.checklist.checklist.map((row) => row.id)).toEqual([
      'waitstaff-open-monday',
      'waitstaff-close-monday',
    ]);
    expect(fridayBartender.checklist.checklist.every((row) => row.id.startsWith('bar-'))).toBe(true);
    expect(mondayServer.boundary.liveCredentials).toBe(false);
    expect(mondayServer.boundary.autoEmail).toBe(false);
    expect(mondayServer.boundary.inventedDollars).toBe(false);
    expect(mondayServer.boundary.counting).toBe(false);
  });

  it('lets staff talk in All plus their house; managers see all; crew cannot see the other house', () => {
    expect(canReadCommRoom('server', 'all')).toBe(true);
    expect(canReadCommRoom('server', 'foh')).toBe(true);
    expect(canReadCommRoom('server', 'boh')).toBe(false);
    expect(canPostCommRoom('server', 'boh')).toBe(false);
    expect(canReadCommRoom('prep', 'boh')).toBe(true);
    expect(canReadCommRoom('prep', 'foh')).toBe(false);
    expect(canReadCommRoom('foh_manager', 'boh')).toBe(true);
    expect(canReadCommRoom('kitchen_manager', 'foh')).toBe(true);
    expect(canReadCommRoom('owner', 'all')).toBe(true);

    const serverView = messagesVisibleTo('server', SYNTHETIC_COMM_SEED).map((row) => row.room);
    expect(serverView).toEqual(['all', 'foh']);
    const dishView = messagesVisibleTo('dishwasher', SYNTHETIC_COMM_SEED).map((row) => row.room);
    expect(dishView).toEqual(['all', 'boh']);
    expect(messagesVisibleTo('owner', SYNTHETIC_COMM_SEED)).toHaveLength(SYNTHETIC_COMM_SEED.length);

    const denied = postCommMessage({
      messages: SYNTHETIC_COMM_SEED,
      fromSeatKey: 'server',
      room: 'boh',
      body: 'should not post',
      at: '2026-08-28T18:00:00.000-05:00',
    });
    expect(denied.ok).toBe(false);
  });

  it('routes request off FOH to Kenzy and BOH/drivers to Tom, in-app only, dollars never', () => {
    for (const seat of FOH_HOUSE_SEATS) {
      expect(requestOffRoute(seat)).toMatchObject({
        routedTo: 'Kenzy',
        mailSent: false,
        dollars: 'never',
        delivery: 'in_app_note',
      });
    }
    for (const seat of BOH_HOUSE_SEATS) {
      expect(requestOffRoute(seat)).toMatchObject({
        routedTo: 'Tom',
        mailSent: false,
        dollars: 'never',
      });
    }
    expect(requestOffRoute('driver')?.routedTo).toBe('Tom');
    expect(requestOffRoute('owner')).toBeNull();

    const posted = submitRequestOff({
      requests: [],
      fromSeatKey: 'server',
      weekday: 'Tuesday',
      note: 'Need Tuesday dinner off',
      at: '2026-08-28T18:00:00.000-05:00',
    });
    expect(posted.ok).toBe(true);
    if (posted.ok) {
      expect(posted.posted.routedTo).toBe('Kenzy');
      expect(posted.posted.mailSent).toBe(false);
      expect(requestsVisibleTo('bartender', posted.requests)).toEqual([]);
      expect(requestsVisibleTo('foh_manager', posted.requests)).toHaveLength(1);
      expect(requestsVisibleTo('kitchen_manager', posted.requests)).toEqual([]);
    }

    const dollars = submitRequestOff({
      requests: [],
      fromSeatKey: 'driver',
      weekday: 'Friday',
      note: 'Need $50 off',
      at: '2026-08-28T18:00:00.000-05:00',
    });
    expect(dollars.ok).toBe(false);
    if (!dollars.ok) expect(dollars.error).toMatch(/never carries dollars/i);
  });

  it('shows the miss board only to owner, FOH manager, and kitchen manager', () => {
    expect(canViewMissBoard('owner')).toBe(true);
    expect(canViewMissBoard('foh_manager')).toBe(true);
    expect(canViewMissBoard('kitchen_manager')).toBe(true);
    expect(missesVisibleTo('owner')).toEqual([...SYNTHETIC_CHECKLIST_MISSES]);
    expect(missesVisibleTo('server')).toEqual([]);
    expect(missesVisibleTo('driver')).toEqual([]);
    expect(crewCannotSeePeerMisses('server')).toBe(true);
    expect(crewCannotSeePeerMisses('line_cook')).toBe(true);
    expect(buildStaffWorkerHome({ seatKey: 'server' }).missBoard).toEqual([]);
    expect(buildStaffWorkerHome({ seatKey: 'foh_manager' }).missBoard.length).toBeGreaterThan(0);
  });

  it('uses floor words ticket, printer, driver area, dispatch and keeps private names out', () => {
    expect(STAFF_FLOOR_PATH).toBe('Ticket out of the printer. Driver area. Dispatch.');
    expect(buildStaffWorkerHome({ seatKey: 'kitchen_manager' }).floorPath).toBe(STAFF_FLOOR_PATH);
    expect(buildStaffWorkerHome({ seatKey: 'server' }).floorPath).toBeNull();
    const homes = STATION_SEAT_KEYS.flatMap((seatKey) =>
      CTAP_LAB_WEEKDAYS.map((weekday) => buildStaffWorkerHome({ seatKey, weekday })),
    );
    expect(findStaffWorkerHomePrivacyHits(homes)).toEqual([]);
    expect(findStaffWorkerHomePrivacyHits(SYNTHETIC_CHECKLIST_MISSES)).toEqual([]);
    const blob = JSON.stringify(homes);
    expect(blob).not.toMatch(/karlee|sturtz|ashley|holding/i);
    expect(blob).not.toMatch(/count the drawer|cash count/i);
    expect(blob).toMatch(/Kenzy/);
    expect(blob).toMatch(/Tom/);
  });
});
