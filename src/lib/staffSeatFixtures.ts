import { CTAP_LAB_STATION_SEATS } from './ctapLabPack';
import {
  STATION_SEAT_KEYS,
  staffSeatKind,
  type StaffActor,
  type StaffDirectory,
  type StaffSeatRecord,
  type StationSeatKey,
} from './staffSeatAuth';

export const SYNTHETIC_OPERATOR_A_ID = 101;
export const SYNTHETIC_OPERATOR_B_ID = 202;
export const SYNTHETIC_LOCATION_A_ID = 11;
export const SYNTHETIC_LOCATION_B_ID = 22;
export const SYNTHETIC_BUSINESS_DATE = '2026-08-24';

export type SyntheticRosterRow = {
  externalWorkerId: string;
  displayName: string;
  seatKey: StationSeatKey;
  operatorId: number;
  locationId: number;
  status: 'active';
};

export type SyntheticScheduleRow = {
  externalShiftId: string;
  externalWorkerId: string;
  businessDate: string;
  startsAt: string;
  endsAt: string;
  station: string;
};

const SEAT_LABELS: Record<StationSeatKey, string> = {
  owner: 'Example Owner',
  foh_manager: 'Example FOH Manager',
  kitchen_manager: 'Example Kitchen Manager',
  bartender: 'Example Bartender',
  server: 'Example Server',
  prep: 'Example Prep',
  driver: 'Example Driver',
  line_cook: 'Example Line Cook',
  pizza: 'Example Pizza',
  dishwasher: 'Example Dishwasher',
};

function workerId(operatorId: number, seatKey: StationSeatKey): string {
  return `worker-${operatorId}-${seatKey.replaceAll('_', '-')}`;
}

function seatId(operatorId: number, seatKey: StationSeatKey): string {
  return `seat-${operatorId}-${seatKey.replaceAll('_', '-')}`;
}

function inviteHandle(operatorId: number, seatKey: StationSeatKey): string {
  return `synth-${operatorId}-${seatKey.replaceAll('_', '-')}`;
}

export const SYNTHETIC_STAFF_ROSTER: readonly SyntheticRosterRow[] = STATION_SEAT_KEYS.flatMap((seatKey) => ([
  {
    externalWorkerId: workerId(SYNTHETIC_OPERATOR_A_ID, seatKey),
    displayName: SEAT_LABELS[seatKey],
    seatKey,
    operatorId: SYNTHETIC_OPERATOR_A_ID,
    locationId: SYNTHETIC_LOCATION_A_ID,
    status: 'active' as const,
  },
  {
    externalWorkerId: workerId(SYNTHETIC_OPERATOR_B_ID, seatKey),
    displayName: SEAT_LABELS[seatKey],
    seatKey,
    operatorId: SYNTHETIC_OPERATOR_B_ID,
    locationId: SYNTHETIC_LOCATION_B_ID,
    status: 'active' as const,
  },
]));

const SHIFT_WINDOWS: Record<StationSeatKey, { start: string; end: string; station: string }> = {
  owner: { start: '08:00:00', end: '16:00:00', station: 'owner_desk' },
  foh_manager: { start: '10:00:00', end: '22:00:00', station: 'bar_side' },
  kitchen_manager: { start: '09:00:00', end: '21:00:00', station: 'kitchen' },
  bartender: { start: '16:00:00', end: '23:00:00', station: 'bar' },
  server: { start: '16:00:00', end: '22:00:00', station: 'dining' },
  prep: { start: '07:00:00', end: '15:00:00', station: 'prep' },
  driver: { start: '16:00:00', end: '22:00:00', station: 'delivery' },
  line_cook: { start: '10:00:00', end: '22:00:00', station: 'fry' },
  pizza: { start: '16:00:00', end: '22:00:00', station: 'pizza_side' },
  dishwasher: { start: '16:00:00', end: '23:00:00', station: 'dish' },
};

export const SYNTHETIC_STAFF_SCHEDULE: readonly SyntheticScheduleRow[] = SYNTHETIC_STAFF_ROSTER.map((row) => {
  const window = SHIFT_WINDOWS[row.seatKey];
  return {
    externalShiftId: `shift-${row.operatorId}-${row.seatKey.replaceAll('_', '-')}`,
    externalWorkerId: row.externalWorkerId,
    businessDate: SYNTHETIC_BUSINESS_DATE,
    startsAt: `${SYNTHETIC_BUSINESS_DATE}T${window.start}-05:00`,
    endsAt: `${SYNTHETIC_BUSINESS_DATE}T${window.end}-05:00`,
    station: window.station,
  };
});

export const SYNTHETIC_STAFF_ROSTER_CSV = [
  'external_worker_id,display_name,seat_key,operator_id,location_id,status',
  ...SYNTHETIC_STAFF_ROSTER.map((row) => [
    row.externalWorkerId,
    row.displayName,
    row.seatKey,
    row.operatorId,
    row.locationId,
    row.status,
  ].join(',')),
].join('\n');

export const SYNTHETIC_STAFF_SCHEDULE_CSV = [
  'external_shift_id,external_worker_id,business_date,starts_at,ends_at,station',
  ...SYNTHETIC_STAFF_SCHEDULE.map((row) => [
    row.externalShiftId,
    row.externalWorkerId,
    row.businessDate,
    row.startsAt,
    row.endsAt,
    row.station,
  ].join(',')),
].join('\n');

function toSeatRecord(row: SyntheticRosterRow): StaffSeatRecord {
  return {
    id: seatId(row.operatorId, row.seatKey),
    operatorId: row.operatorId,
    locationId: row.locationId,
    seatKey: row.seatKey,
    label: row.displayName,
    kind: staffSeatKind(row.seatKey),
    status: 'active',
    credentialState: 'not_issued',
    inviteHandle: inviteHandle(row.operatorId, row.seatKey),
    tokenFingerprint: null,
  };
}

export function buildSyntheticStaffDirectory(): StaffDirectory {
  return {
    seats: SYNTHETIC_STAFF_ROSTER.map(toSeatRecord),
    invites: [],
    receipts: [],
  };
}

export function syntheticActor(operatorId: number, seatKey: StationSeatKey): StaffActor {
  const locationId = operatorId === SYNTHETIC_OPERATOR_B_ID
    ? SYNTHETIC_LOCATION_B_ID
    : SYNTHETIC_LOCATION_A_ID;
  return {
    operatorId,
    locationId,
    seatId: seatId(operatorId, seatKey),
    seatKey,
  };
}

export function syntheticSeatId(operatorId: number, seatKey: StationSeatKey): string {
  return seatId(operatorId, seatKey);
}

const PRIVATE_PAYLOAD = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(pin|password|ssn|social security)\b/i,
  /community tap/i,
  /\bsally\b/i,
  /\bkarlee\b/i,
  /\bsturtz\b/i,
  /\bashley\b/i,
  /\bholding\b/i,
  /\$\s?\d{2,}/,
  /\bfacebook\b/i,
];

export function staffFixtureContainsPrivatePayload(value: unknown): boolean {
  const blob = JSON.stringify(value);
  return PRIVATE_PAYLOAD.some((pattern) => pattern.test(blob));
}

export function syntheticRosterUsesLabStationSeats(): boolean {
  return CTAP_LAB_STATION_SEATS.every((seat) => STATION_SEAT_KEYS.includes(seat.seatKey as StationSeatKey));
}
