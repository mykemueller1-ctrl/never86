import {
  buildStaffRoleDayDesk,
  storeWeekdayToday,
  type StaffRoleDayDesk,
  type StaffRoleDayView,
} from './staffRoleDayPack';
import { type CtapLabWeekday } from './ctapLabPack';
import {
  CREW_STATION_SEAT_KEYS,
  type StationSeatKey,
} from './staffSeatAuth';

export const STAFF_WORKER_HOME_PACK_ID = 'staff-worker-home-v1';
export const STAFF_WORKER_HOME_STATUS = 'drafted' as const;

/** Floor path only. No bag-as-cue. No counting. */
export const STAFF_FLOOR_PATH = 'Ticket out of the printer. Driver area. Dispatch.';

export const STAFF_COMM_ROOMS = ['all', 'foh', 'boh'] as const;
export type StaffCommRoom = (typeof STAFF_COMM_ROOMS)[number];

export const FOH_HOUSE_SEATS: readonly StationSeatKey[] = ['foh_manager', 'bartender', 'server'];
export const BOH_HOUSE_SEATS: readonly StationSeatKey[] = [
  'kitchen_manager',
  'prep',
  'driver',
  'line_cook',
  'pizza',
  'dishwasher',
];
export const MISS_BOARD_SEATS: readonly StationSeatKey[] = ['owner', 'foh_manager', 'kitchen_manager'];

export type StaffHouse = 'foh' | 'boh' | 'both';

export type StaffCommMessage = {
  id: string;
  room: StaffCommRoom;
  fromSeatKey: StationSeatKey;
  body: string;
  at: string;
  delivery: 'in_app_note';
  mailSent: false;
};

export type StaffRequestOff = {
  id: string;
  fromSeatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  note: string;
  routedTo: 'Kenzy' | 'Tom';
  routedRoleTitle: 'FOH lead' | 'Kitchen lead';
  house: 'foh' | 'boh';
  delivery: 'in_app_note';
  mailSent: false;
  moneyKind: 'none';
};

export type StaffChecklistMiss = {
  id: string;
  seatKey: StationSeatKey;
  stationLabel: string;
  weekday: CtapLabWeekday;
  item: string;
};

export type StaffRequestOffRoute = {
  house: 'foh' | 'boh';
  routedTo: 'Kenzy' | 'Tom';
  routedRoleTitle: 'FOH lead' | 'Kitchen lead';
  delivery: 'in_app_note';
  mailSent: false;
  moneyKind: 'none';
  dollars: 'never';
};

export function staffHouseForSeat(seatKey: StationSeatKey): StaffHouse {
  if (seatKey === 'owner') return 'both';
  if ((FOH_HOUSE_SEATS as readonly string[]).includes(seatKey)) return 'foh';
  return 'boh';
}

export function canViewMissBoard(seatKey: StationSeatKey): boolean {
  return (MISS_BOARD_SEATS as readonly string[]).includes(seatKey);
}

export function canReadCommRoom(seatKey: StationSeatKey, room: StaffCommRoom): boolean {
  if (canViewMissBoard(seatKey) || seatKey === 'owner') return true;
  if (room === 'all') return true;
  const house = staffHouseForSeat(seatKey);
  if (room === 'foh') return house === 'foh' || house === 'both';
  return house === 'boh' || house === 'both';
}

export function canPostCommRoom(seatKey: StationSeatKey, room: StaffCommRoom): boolean {
  return canReadCommRoom(seatKey, room);
}

export function roomsVisibleTo(seatKey: StationSeatKey): StaffCommRoom[] {
  return STAFF_COMM_ROOMS.filter((room) => canReadCommRoom(seatKey, room));
}

export function messagesVisibleTo(
  seatKey: StationSeatKey,
  messages: readonly StaffCommMessage[],
): StaffCommMessage[] {
  return messages.filter((message) => canReadCommRoom(seatKey, message.room));
}

export function requestOffRoute(seatKey: StationSeatKey): StaffRequestOffRoute | null {
  if (seatKey === 'owner') return null;
  const house = staffHouseForSeat(seatKey);
  if (house === 'foh') {
    return {
      house: 'foh',
      routedTo: 'Kenzy',
      routedRoleTitle: 'FOH lead',
      delivery: 'in_app_note',
      mailSent: false,
      moneyKind: 'none',
      dollars: 'never',
    };
  }
  return {
    house: 'boh',
    routedTo: 'Tom',
    routedRoleTitle: 'Kitchen lead',
    delivery: 'in_app_note',
    mailSent: false,
    moneyKind: 'none',
    dollars: 'never',
  };
}

export function postCommMessage(input: {
  messages: readonly StaffCommMessage[];
  fromSeatKey: StationSeatKey;
  room: StaffCommRoom;
  body: string;
  at: string;
}):
  | { ok: true; messages: StaffCommMessage[]; posted: StaffCommMessage }
  | { ok: false; error: string; messages: readonly StaffCommMessage[] } {
  const body = input.body.trim();
  if (!body) return { ok: false, error: 'In-app note is empty.', messages: input.messages };
  if (!canPostCommRoom(input.fromSeatKey, input.room)) {
    return { ok: false, error: 'Crew talks inside their house. Managers see all.', messages: input.messages };
  }
  const posted: StaffCommMessage = {
    id: `comm-${input.at}-${input.fromSeatKey}-${input.room}`,
    room: input.room,
    fromSeatKey: input.fromSeatKey,
    body,
    at: input.at,
    delivery: 'in_app_note',
    mailSent: false,
  };
  return { ok: true, messages: [...input.messages, posted], posted };
}

export function submitRequestOff(input: {
  requests: readonly StaffRequestOff[];
  fromSeatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  note: string;
  at: string;
}):
  | { ok: true; requests: StaffRequestOff[]; posted: StaffRequestOff }
  | { ok: false; error: string; requests: readonly StaffRequestOff[] } {
  const route = requestOffRoute(input.fromSeatKey);
  if (!route) {
    return { ok: false, error: 'Owner does not request off on this desk. Dollars never.', requests: input.requests };
  }
  const note = input.note.trim();
  if (!note) return { ok: false, error: 'Request-off note is empty.', requests: input.requests };
  if (/\$|\bdollar|\bwage|\bpay(check)?\b/i.test(note)) {
    return { ok: false, error: 'Request off is in-app only and never carries dollars.', requests: input.requests };
  }
  const posted: StaffRequestOff = {
    id: `off-${input.at}-${input.fromSeatKey}`,
    fromSeatKey: input.fromSeatKey,
    weekday: input.weekday,
    note,
    routedTo: route.routedTo,
    routedRoleTitle: route.routedRoleTitle,
    house: route.house,
    delivery: 'in_app_note',
    mailSent: false,
    moneyKind: 'none',
  };
  return { ok: true, requests: [...input.requests, posted], posted };
}

export function requestsVisibleTo(
  seatKey: StationSeatKey,
  requests: readonly StaffRequestOff[],
): StaffRequestOff[] {
  if (seatKey === 'owner') return [...requests];
  if (seatKey === 'foh_manager') {
    return requests.filter((row) => row.house === 'foh' || row.fromSeatKey === seatKey);
  }
  if (seatKey === 'kitchen_manager') {
    return requests.filter((row) => row.house === 'boh' || row.fromSeatKey === seatKey);
  }
  return requests.filter((row) => row.fromSeatKey === seatKey);
}

/** Synthetic misses use station labels only. No roster names. */
export const SYNTHETIC_CHECKLIST_MISSES: readonly StaffChecklistMiss[] = [
  {
    id: 'miss-server-wednesday-buff',
    seatKey: 'server',
    stationLabel: 'Server station',
    weekday: 'Wednesday',
    item: 'Buff floors',
  },
  {
    id: 'miss-bartender-friday-fruit',
    seatKey: 'bartender',
    stationLabel: 'Bartender station',
    weekday: 'Friday',
    item: 'Cut fruit/extra for weekend',
  },
  {
    id: 'miss-dish-monday-close',
    seatKey: 'dishwasher',
    stationLabel: 'Dishwasher station',
    weekday: 'Monday',
    item: 'Close: drain, clean arms/screens/trays/curtains, sanitize interior, wipe exterior, leave door open, and log completion',
  },
  {
    id: 'miss-line-thursday-fry',
    seatKey: 'line_cook',
    stationLabel: 'Line cook station',
    weekday: 'Thursday',
    item: 'Confirm fryer oil is at the mark and at temp before the first drop',
  },
];

export function missesVisibleTo(seatKey: StationSeatKey): StaffChecklistMiss[] {
  if (!canViewMissBoard(seatKey)) return [];
  return [...SYNTHETIC_CHECKLIST_MISSES];
}

export function crewCannotSeePeerMisses(seatKey: StationSeatKey): boolean {
  return (CREW_STATION_SEAT_KEYS as readonly string[]).includes(seatKey)
    && missesVisibleTo(seatKey).length === 0;
}

export const SYNTHETIC_COMM_SEED: readonly StaffCommMessage[] = [
  {
    id: 'seed-all-open',
    room: 'all',
    fromSeatKey: 'foh_manager',
    body: 'House note: ticket out of the printer. Driver area. Dispatch. In-app only.',
    at: '2026-08-28T16:00:00.000-05:00',
    delivery: 'in_app_note',
    mailSent: false,
  },
  {
    id: 'seed-foh',
    room: 'foh',
    fromSeatKey: 'server',
    body: 'FOH house: specials board is the waitress quiz — wing specials, fish fry, medium pizza. No dollars.',
    at: '2026-08-28T16:05:00.000-05:00',
    delivery: 'in_app_note',
    mailSent: false,
  },
  {
    id: 'seed-boh',
    room: 'boh',
    fromSeatKey: 'kitchen_manager',
    body: 'BOH house: ticket out of the printer. Driver area. Dispatch.',
    at: '2026-08-28T16:10:00.000-05:00',
    delivery: 'in_app_note',
    mailSent: false,
  },
];

export function showsFloorPath(seatKey: StationSeatKey): boolean {
  return seatKey === 'kitchen_manager'
    || seatKey === 'driver'
    || seatKey === 'line_cook'
    || seatKey === 'pizza';
}

export function buildStaffWorkerHome(input: {
  seatKey: StationSeatKey;
  weekday?: CtapLabWeekday;
  view?: StaffRoleDayView;
}): {
  packId: typeof STAFF_WORKER_HOME_PACK_ID;
  status: typeof STAFF_WORKER_HOME_STATUS;
  seatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  house: StaffHouse;
  rooms: StaffCommRoom[];
  checklist: StaffRoleDayDesk;
  requestOff: StaffRequestOffRoute | null;
  missBoard: StaffChecklistMiss[];
  floorPath: string | null;
  boundary: {
    liveCredentials: false;
    autoEmail: false;
    inventedDollars: false;
    counting: false;
    peerMissesVisibleToCrew: false;
  };
} {
  const weekday = input.weekday ?? storeWeekdayToday();
  const checklist = buildStaffRoleDayDesk({
    seatKey: input.seatKey,
    weekday,
    view: input.view ?? 'today',
  });
  return {
    packId: STAFF_WORKER_HOME_PACK_ID,
    status: STAFF_WORKER_HOME_STATUS,
    seatKey: input.seatKey,
    weekday,
    house: staffHouseForSeat(input.seatKey),
    rooms: roomsVisibleTo(input.seatKey),
    checklist,
    requestOff: requestOffRoute(input.seatKey),
    missBoard: missesVisibleTo(input.seatKey),
    floorPath: showsFloorPath(input.seatKey) ? STAFF_FLOOR_PATH : null,
    boundary: {
      liveCredentials: false,
      autoEmail: false,
      inventedDollars: false,
      counting: false,
      peerMissesVisibleToCrew: false,
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

export function findStaffWorkerHomePrivacyHits(value: unknown): string[] {
  const text = JSON.stringify(value);
  return PRIVATE_HITS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}
