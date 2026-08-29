import { CTAP_LAB_WEEKDAYS, type CtapLabWeekday } from './ctapLabPack';
import {
  barWeekExtrasForWeekday,
  barWeekShortLabel,
  type CtapBarWeekExtra,
} from './ctapBarWeekExtras';
import {
  SYNTHETIC_LOCATION_A_ID,
  SYNTHETIC_OPERATOR_A_ID,
} from './staffSeatFixtures';
import { sameStaffTenant, type StationSeatKey } from './staffSeatAuth';
import {
  requestOffRoute,
  staffHouseForSeat,
  type StaffHouse,
  type StaffRequestOff,
  type StaffRequestOffRoute,
} from './staffWorkerHome';

/**
 * Staff Schedule / Time Off for Worker Home.
 * Coverage is slot counts, never invented roster names.
 * Live credentials, Neon apply, and mail stay blocked.
 */
export const STAFF_SCHEDULE_PACK_ID = 'staff-schedule-v2';
export const STAFF_SCHEDULE_STATUS = 'drafted' as const;
export const STAFF_SCHEDULE_TIMEZONE = 'America/Chicago';

/** Synthetic preview week. Not a live CTap board. */
export const STAFF_SCHEDULE_WEEK_DATES: Record<CtapLabWeekday, string> = {
  Monday: '2026-08-24',
  Tuesday: '2026-08-25',
  Wednesday: '2026-08-26',
  Thursday: '2026-08-27',
  Friday: '2026-08-28',
  Saturday: '2026-08-29',
  Sunday: '2026-08-30',
};

export type StaffCoverageStation = 'pizza' | 'line' | 'dish' | 'driver' | 'foh_front' | 'foh_back';
export type StaffCoverageDaypart = 'day' | 'night' | 'weekday_11_1';
export type StaffTimeOffKind = 'full_day' | 'partial_day';
export type StaffCoverKind = 'swap' | 'cover';
export type StaffApprovalStatus = 'needs_approval' | 'approved' | 'denied';
export type StaffAvailabilityWindow = 'day' | 'night' | 'weekday_11_1';

export type StaffCoverageCount = {
  id: string;
  weekday: CtapLabWeekday;
  date: string;
  daypart: StaffCoverageDaypart;
  station: StaffCoverageStation;
  slotsNeeded: number;
  slotLabel: string;
  namedPerson: false;
};

export type StaffWeekStripDay = {
  weekday: CtapLabWeekday;
  date: string;
  summary: string;
  barWeekShortLabel: string;
  slotTotal: number;
  namedPeople: false;
};

export type StaffMyShift = {
  id: string;
  weekday: CtapLabWeekday;
  date: string;
  daypart: StaffCoverageDaypart;
  slotLabel: string;
  stationLabel: string;
  namedPerson: false;
};

export type StaffTimeOffRequest = StaffRequestOff & {
  operatorId: number;
  locationId: number;
  kind: StaffTimeOffKind;
  date: string;
  window: string | null;
  status: StaffApprovalStatus;
};

export type StaffSwapCoverRequest = {
  id: string;
  kind: StaffCoverKind;
  operatorId: number;
  locationId: number;
  counterpartOperatorId: number;
  counterpartLocationId: number;
  fromSeatKey: StationSeatKey;
  counterpartSeatKey: StationSeatKey;
  house: 'foh' | 'boh';
  weekday: CtapLabWeekday;
  date: string;
  note: string;
  status: StaffApprovalStatus;
  routedTo: 'Kenzy' | 'Tom';
  routedRoleTitle: 'FOH lead' | 'Kitchen lead';
  delivery: 'in_app_note';
  mailSent: false;
  namedPerson: false;
};

export type StaffStandingAvailability = {
  id: string;
  operatorId: number;
  locationId: number;
  seatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  window: StaffAvailabilityWindow;
  available: boolean;
  stationLabel: string;
  namedPerson: false;
};

export type StaffApprovalItem = {
  id: string;
  kind: 'time_off' | 'swap' | 'cover';
  status: StaffApprovalStatus;
  house: 'foh' | 'boh';
  fromSeatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  date: string;
  note: string;
  routedTo: 'Kenzy' | 'Tom';
  mailSent: false;
};

export type StaffScheduleDesk = {
  packId: typeof STAFF_SCHEDULE_PACK_ID;
  status: typeof STAFF_SCHEDULE_STATUS;
  timezone: typeof STAFF_SCHEDULE_TIMEZONE;
  seatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  date: string;
  house: StaffHouse;
  weekStrip: readonly StaffWeekStripDay[];
  myShifts: readonly StaffMyShift[];
  coverage: readonly StaffCoverageCount[];
  barWeekShortLabel: string;
  barWeekExtras: readonly CtapBarWeekExtra[];
  requestOff: StaffRequestOffRoute | null;
  canSeeNeedsApprovalInbox: boolean;
  boundary: {
    liveCredentials: false;
    autoEmail: false;
    inventedNames: false;
    neonApply: false;
  };
};

const WEEKDAYS_MON_THU: readonly CtapLabWeekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const WEEKDAYS_FRI_SAT: readonly CtapLabWeekday[] = ['Friday', 'Saturday'];

const STATION_FOR_SEAT: Partial<Record<StationSeatKey, StaffCoverageStation>> = {
  pizza: 'pizza',
  line_cook: 'line',
  dishwasher: 'dish',
  driver: 'driver',
  server: 'foh_front',
  bartender: 'foh_front',
};

const STATION_LABEL: Record<StaffCoverageStation, string> = {
  pizza: 'Pizza slot',
  line: 'Line slot',
  dish: 'Dish slot',
  driver: 'Driver slot',
  foh_front: 'FOH front slot',
  foh_back: 'FOH back-room slot',
};

const SEAT_STATION_LABEL: Record<StationSeatKey, string> = {
  owner: 'Owner desk',
  foh_manager: 'FOH lead desk',
  kitchen_manager: 'Kitchen lead desk',
  bartender: 'Bartender station',
  server: 'Server station',
  prep: 'Prep station',
  driver: 'Driver station',
  line_cook: 'Line station',
  pizza: 'Pizza station',
  dishwasher: 'Dish station',
};

export function dateForScheduleWeekday(weekday: CtapLabWeekday): string {
  return STAFF_SCHEDULE_WEEK_DATES[weekday];
}

export function coverageCountsForWeekday(weekday: CtapLabWeekday): StaffCoverageCount[] {
  const date = dateForScheduleWeekday(weekday);
  const rows: StaffCoverageCount[] = [];

  if (WEEKDAYS_FRI_SAT.includes(weekday)) {
    rows.push(
      count(weekday, date, 'night', 'pizza', 5),
      count(weekday, date, 'night', 'line', 3),
      count(weekday, date, 'night', 'dish', 1),
      count(weekday, date, 'night', 'driver', 3),
    );
  }

  if (WEEKDAYS_MON_THU.includes(weekday)) {
    rows.push({
      id: `cov-${weekday}-weekday_11_1-driver`,
      weekday,
      date,
      daypart: 'weekday_11_1',
      station: 'driver',
      slotsNeeded: 1,
      slotLabel: 'Weekday 11–1 driver slot (unnamed)',
      namedPerson: false,
    });
    rows.push(count(weekday, date, 'day', 'foh_front', 1));
  }

  if (weekday !== 'Monday') {
    rows.push(
      count(weekday, date, 'night', 'foh_front', 2),
      count(weekday, date, 'night', 'foh_back', 1),
    );
  }

  if (weekday === 'Sunday') {
    rows.push(count(weekday, date, 'night', 'driver', 2));
  }

  return rows;
}

function count(
  weekday: CtapLabWeekday,
  date: string,
  daypart: StaffCoverageDaypart,
  station: StaffCoverageStation,
  slotsNeeded: number,
): StaffCoverageCount {
  return {
    id: `cov-${weekday}-${daypart}-${station}`,
    weekday,
    date,
    daypart,
    station,
    slotsNeeded,
    slotLabel: STATION_LABEL[station],
    namedPerson: false,
  };
}

export function coverageSummary(weekday: CtapLabWeekday): string {
  const rows = coverageCountsForWeekday(weekday);
  if (rows.length === 0) return 'No counted slots';
  return rows
    .map((row) => `${row.slotsNeeded} ${row.slotLabel.replace(/ slot$/i, '').toLowerCase()}`)
    .join(' · ');
}

export function buildWeekStrip(): StaffWeekStripDay[] {
  return CTAP_LAB_WEEKDAYS.map((weekday) => {
    const coverage = coverageCountsForWeekday(weekday);
    return {
      weekday,
      date: dateForScheduleWeekday(weekday),
      summary: coverageSummary(weekday),
      barWeekShortLabel: barWeekShortLabel(weekday),
      slotTotal: coverage.reduce((sum, row) => sum + row.slotsNeeded, 0),
      namedPeople: false,
    };
  });
}

export function myShiftsForSeat(seatKey: StationSeatKey, weekday?: CtapLabWeekday): StaffMyShift[] {
  const days = weekday ? [weekday] : [...CTAP_LAB_WEEKDAYS];
  const station = STATION_FOR_SEAT[seatKey];
  const shifts: StaffMyShift[] = [];

  for (const day of days) {
    const date = dateForScheduleWeekday(day);
    if (station) {
      for (const row of coverageCountsForWeekday(day).filter((item) => item.station === station)) {
        shifts.push({
          id: `mine-${seatKey}-${row.id}`,
          weekday: day,
          date,
          daypart: row.daypart,
          slotLabel: row.slotLabel,
          stationLabel: SEAT_STATION_LABEL[seatKey],
          namedPerson: false,
        });
      }
    } else if (seatKey === 'prep' && WEEKDAYS_MON_THU.includes(day)) {
      shifts.push({
        id: `mine-prep-${day}-day`,
        weekday: day,
        date,
        daypart: 'day',
        slotLabel: 'Prep day slot (unnamed)',
        stationLabel: SEAT_STATION_LABEL.prep,
        namedPerson: false,
      });
    }
  }

  return shifts;
}

export function canSeeNeedsApprovalInbox(seatKey: StationSeatKey): boolean {
  return seatKey === 'owner' || seatKey === 'foh_manager' || seatKey === 'kitchen_manager';
}

export function sameHouseSameSeat(fromSeatKey: StationSeatKey, counterpartSeatKey: StationSeatKey): boolean {
  if (fromSeatKey === 'owner' || counterpartSeatKey === 'owner') return false;
  if (fromSeatKey !== counterpartSeatKey) return false;
  const fromHouse = staffHouseForSeat(fromSeatKey);
  const toHouse = staffHouseForSeat(counterpartSeatKey);
  return fromHouse === toHouse && fromHouse !== 'both';
}

function dollarsInNote(note: string): boolean {
  return /\$|\bdollar|\bwage|\bpay(check)?\b/i.test(note);
}

export function submitTimeOff(input: {
  requests: readonly StaffTimeOffRequest[];
  fromSeatKey: StationSeatKey;
  kind: StaffTimeOffKind;
  weekday: CtapLabWeekday;
  note: string;
  at: string;
  date?: string;
  window?: string | null;
  operatorId?: number;
  locationId?: number;
}):
  | { ok: true; requests: StaffTimeOffRequest[]; posted: StaffTimeOffRequest }
  | { ok: false; error: string; requests: readonly StaffTimeOffRequest[] } {
  const route = requestOffRoute(input.fromSeatKey);
  if (!route) {
    return { ok: false, error: 'Owner does not request time off on this desk. Dollars never.', requests: input.requests };
  }
  const note = input.note.trim();
  if (!note) return { ok: false, error: 'Time off needs a note.', requests: input.requests };
  if (dollarsInNote(note)) {
    return { ok: false, error: 'Time off is in-app only and never carries dollars.', requests: input.requests };
  }
  if (input.kind === 'partial_day' && !input.window?.trim()) {
    return { ok: false, error: 'Partial-day time off needs a window.', requests: input.requests };
  }
  const posted: StaffTimeOffRequest = {
    id: `off-${input.at}-${input.fromSeatKey}`,
    operatorId: input.operatorId ?? SYNTHETIC_OPERATOR_A_ID,
    locationId: input.locationId ?? SYNTHETIC_LOCATION_A_ID,
    fromSeatKey: input.fromSeatKey,
    kind: input.kind,
    weekday: input.weekday,
    date: input.date ?? dateForScheduleWeekday(input.weekday),
    window: input.kind === 'partial_day' ? input.window?.trim() ?? null : null,
    note,
    routedTo: route.routedTo,
    routedRoleTitle: route.routedRoleTitle,
    house: route.house,
    delivery: 'in_app_note',
    mailSent: false,
    moneyKind: 'none',
    status: 'needs_approval',
  };
  return { ok: true, requests: [...input.requests, posted], posted };
}

export function submitSwapOrCover(input: {
  requests: readonly StaffSwapCoverRequest[];
  kind: StaffCoverKind;
  fromSeatKey: StationSeatKey;
  counterpartSeatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  note: string;
  at: string;
  operatorId?: number;
  locationId?: number;
  counterpartOperatorId?: number;
  counterpartLocationId?: number;
}):
  | { ok: true; requests: StaffSwapCoverRequest[]; posted: StaffSwapCoverRequest }
  | { ok: false; error: string; requests: readonly StaffSwapCoverRequest[] } {
  const route = requestOffRoute(input.fromSeatKey);
  if (!route) {
    return { ok: false, error: 'Owner does not swap or cover on this desk.', requests: input.requests };
  }
  const note = input.note.trim();
  if (!note) return { ok: false, error: 'Swap or cover needs a note.', requests: input.requests };
  if (dollarsInNote(note)) {
    return { ok: false, error: 'Swap or cover is in-app only and never carries dollars.', requests: input.requests };
  }
  if (!sameHouseSameSeat(input.fromSeatKey, input.counterpartSeatKey)) {
    return {
      ok: false,
      error: 'Swap or cover stays same-house and same-seat. Slots, not people.',
      requests: input.requests,
    };
  }
  const actor = {
    operatorId: input.operatorId ?? SYNTHETIC_OPERATOR_A_ID,
    locationId: input.locationId ?? SYNTHETIC_LOCATION_A_ID,
  };
  const counterpart = {
    operatorId: input.counterpartOperatorId ?? SYNTHETIC_OPERATOR_A_ID,
    locationId: input.counterpartLocationId ?? SYNTHETIC_LOCATION_A_ID,
  };
  if (!sameStaffTenant(actor, counterpart)) {
    return { ok: false, error: 'Swap or cover cannot cross the tenant line.', requests: input.requests };
  }
  const posted: StaffSwapCoverRequest = {
    id: `${input.kind}-${input.at}-${input.fromSeatKey}`,
    kind: input.kind,
    operatorId: actor.operatorId,
    locationId: actor.locationId,
    counterpartOperatorId: counterpart.operatorId,
    counterpartLocationId: counterpart.locationId,
    fromSeatKey: input.fromSeatKey,
    counterpartSeatKey: input.counterpartSeatKey,
    house: route.house,
    weekday: input.weekday,
    date: dateForScheduleWeekday(input.weekday),
    note,
    status: 'needs_approval',
    routedTo: route.routedTo,
    routedRoleTitle: route.routedRoleTitle,
    delivery: 'in_app_note',
    mailSent: false,
    namedPerson: false,
  };
  return { ok: true, requests: [...input.requests, posted], posted };
}

export function setStandingAvailability(input: {
  rows: readonly StaffStandingAvailability[];
  seatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  window: StaffAvailabilityWindow;
  available: boolean;
  operatorId?: number;
  locationId?: number;
}):
  | { ok: true; rows: StaffStandingAvailability[]; posted: StaffStandingAvailability }
  | { ok: false; error: string; rows: readonly StaffStandingAvailability[] } {
  if (input.seatKey === 'owner') {
    return { ok: false, error: 'Owner desk does not post standing availability on the floor board.', rows: input.rows };
  }
  const operatorId = input.operatorId ?? SYNTHETIC_OPERATOR_A_ID;
  const locationId = input.locationId ?? SYNTHETIC_LOCATION_A_ID;
  const posted: StaffStandingAvailability = {
    id: `avail-${operatorId}-${input.seatKey}-${input.weekday}-${input.window}`,
    operatorId,
    locationId,
    seatKey: input.seatKey,
    weekday: input.weekday,
    window: input.window,
    available: input.available,
    stationLabel: SEAT_STATION_LABEL[input.seatKey],
    namedPerson: false,
  };
  const rows = input.rows.filter((row) => row.id !== posted.id);
  return { ok: true, rows: [...rows, posted], posted };
}

export function availabilityVisibleTo(
  seatKey: StationSeatKey,
  rows: readonly StaffStandingAvailability[],
): StaffStandingAvailability[] {
  if (seatKey === 'owner') return [...rows];
  if (seatKey === 'foh_manager') {
    return rows.filter((row) => staffHouseForSeat(row.seatKey) === 'foh' || row.seatKey === seatKey);
  }
  if (seatKey === 'kitchen_manager') {
    return rows.filter((row) => staffHouseForSeat(row.seatKey) === 'boh' || row.seatKey === seatKey);
  }
  return rows.filter((row) => row.seatKey === seatKey);
}

export function needsApprovalInbox(input: {
  seatKey: StationSeatKey;
  timeOff: readonly StaffTimeOffRequest[];
  swaps: readonly StaffSwapCoverRequest[];
}): StaffApprovalItem[] {
  if (!canSeeNeedsApprovalInbox(input.seatKey)) return [];
  const items: StaffApprovalItem[] = [
    ...input.timeOff.map((row) => ({
      id: row.id,
      kind: 'time_off' as const,
      status: row.status,
      house: row.house,
      fromSeatKey: row.fromSeatKey,
      weekday: row.weekday,
      date: row.date,
      note: row.note,
      routedTo: row.routedTo,
      mailSent: row.mailSent,
    })),
    ...input.swaps.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      house: row.house,
      fromSeatKey: row.fromSeatKey,
      weekday: row.weekday,
      date: row.date,
      note: row.note,
      routedTo: row.routedTo,
      mailSent: row.mailSent,
    })),
  ].filter((row) => row.status === 'needs_approval');

  if (input.seatKey === 'owner') return items;
  if (input.seatKey === 'foh_manager') return items.filter((row) => row.house === 'foh');
  return items.filter((row) => row.house === 'boh');
}

export function decideApproval(input: {
  managerSeatKey: StationSeatKey;
  itemId: string;
  decision: 'approved' | 'denied';
  timeOff: readonly StaffTimeOffRequest[];
  swaps: readonly StaffSwapCoverRequest[];
}):
  | { ok: true; timeOff: StaffTimeOffRequest[]; swaps: StaffSwapCoverRequest[] }
  | { ok: false; error: string; timeOff: readonly StaffTimeOffRequest[]; swaps: readonly StaffSwapCoverRequest[] } {
  if (!canSeeNeedsApprovalInbox(input.managerSeatKey)) {
    return {
      ok: false,
      error: 'Needs Approval is a manager inbox. Crew does not decide it.',
      timeOff: input.timeOff,
      swaps: input.swaps,
    };
  }
  const inbox = needsApprovalInbox({
    seatKey: input.managerSeatKey,
    timeOff: input.timeOff,
    swaps: input.swaps,
  });
  if (!inbox.some((row) => row.id === input.itemId)) {
    return {
      ok: false,
      error: 'That request is outside this house inbox.',
      timeOff: input.timeOff,
      swaps: input.swaps,
    };
  }
  return {
    ok: true,
    timeOff: input.timeOff.map((row) => (row.id === input.itemId ? { ...row, status: input.decision } : row)),
    swaps: input.swaps.map((row) => (row.id === input.itemId ? { ...row, status: input.decision } : row)),
  };
}

export function buildStaffScheduleDesk(input: {
  seatKey: StationSeatKey;
  weekday: CtapLabWeekday;
}): StaffScheduleDesk {
  return {
    packId: STAFF_SCHEDULE_PACK_ID,
    status: STAFF_SCHEDULE_STATUS,
    timezone: STAFF_SCHEDULE_TIMEZONE,
    seatKey: input.seatKey,
    weekday: input.weekday,
    date: dateForScheduleWeekday(input.weekday),
    house: staffHouseForSeat(input.seatKey),
    weekStrip: buildWeekStrip(),
    myShifts: myShiftsForSeat(input.seatKey, input.weekday),
    coverage: coverageCountsForWeekday(input.weekday),
    barWeekShortLabel: barWeekShortLabel(input.weekday),
    barWeekExtras: barWeekExtrasForWeekday(input.weekday),
    requestOff: requestOffRoute(input.seatKey),
    canSeeNeedsApprovalInbox: canSeeNeedsApprovalInbox(input.seatKey),
    boundary: {
      liveCredentials: false,
      autoEmail: false,
      inventedNames: false,
      neonApply: false,
    },
  };
}

const PRIVATE_HITS: readonly RegExp[] = [
  /\bkarlee\b/i,
  /\bsturtz\b/i,
  /\bashley\b/i,
  /\bholding\b/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(pin|password|ssn|social security)\b/i,
  /\$\s?\d{2,4}\s*\/\s*week/i,
  /\bfacebook\b/i,
];

export function findStaffSchedulePrivacyHits(value: unknown): string[] {
  const text = JSON.stringify(value);
  return PRIVATE_HITS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}
