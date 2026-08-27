import { parseCsv } from './csv/core';
import type {
  ActionShiftRoleKey,
  ActionShiftSetupIssue,
  ActionShiftSetupPlan,
} from './actionShiftSetup';

export const ACTION_SHIFT_WEEKLY_TEMPLATE = [
  'employee,date,start time,end time,station,date,start time,end time,station',
  'Example Bar,8/26/2026,Open,4:00 PM,BAR SIDE,8/27/2026,4:00 PM,CLOSE,BAR SIDE',
  'Example Server,8/26/2026,11:00 AM,5:00 PM,WAITRESS,8/27/2026,RO,,,',
].join('\n');

type WeeklySeat = ActionShiftSetupPlan['seats'][number];

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

export function isWeeklyDepartmentSheet(headers: string[]): boolean {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  const employee = normalized[0] === 'employee' || normalized[0] === 'name';
  const dates = normalized.filter((header) => header === 'date').length;
  const stations = normalized.filter((header) => header === 'station').length;
  return employee && dates >= 2 && stations >= 2;
}

function toIsoDate(value: string): string | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = match[1].padStart(2, '0');
  const day = match[2].padStart(2, '0');
  const iso = `${match[3]}-${month}-${day}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== iso ? null : iso;
}

function clockToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minutes > 59) return null;
  if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
  else hour = hour === 12 ? 12 : hour + 12;
  return hour * 60 + minutes;
}

function minutesToIso(date: string, minutes: number, offset: string, nextDay = false): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const businessDate = nextDay
    ? new Date(new Date(`${date}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : date;
  return `${businessDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${offset}`;
}

function tokenKind(value: string): 'ro' | 'open' | 'close' | 'clock' | 'empty' | 'other' {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'empty';
  if (normalized === 'ro' || normalized === 'r/o' || normalized === 'requested off') return 'ro';
  if (normalized === 'open') return 'open';
  if (normalized === 'close') return 'close';
  if (clockToMinutes(value) != null) return 'clock';
  return 'other';
}

type ResolveClockInput = {
  value: string;
  kind: 'start' | 'end';
  storeOpen?: string;
  storeClose?: string;
};

function resolveClock(input: ResolveClockInput): { ok: true; minutes: number } | { ok: false; reason: ActionShiftSetupIssue['reason'] } {
  const kind = tokenKind(input.value);
  if (kind === 'clock') return { ok: true, minutes: clockToMinutes(input.value)! };
  if (kind === 'open') {
    const minutes = input.storeOpen ? clockToMinutes(input.storeOpen) : null;
    return minutes == null ? { ok: false, reason: 'unresolved_open_close' } : { ok: true, minutes };
  }
  if (kind === 'close') {
    const minutes = input.storeClose ? clockToMinutes(input.storeClose) : null;
    return minutes == null ? { ok: false, reason: 'unresolved_open_close' } : { ok: true, minutes };
  }
  if (kind === 'empty' || kind === 'other') return { ok: false, reason: 'missing_required_value' };
  return { ok: false, reason: 'missing_required_value' };
}

export function buildWeeklyDepartmentPlan(input: {
  rosterSeats: WeeklySeat[];
  scheduleCsv: string;
  providerKey: string;
  generatedAt: string;
  issues: ActionShiftSetupIssue[];
  rolePacks: Record<ActionShiftRoleKey, readonly string[]>;
  stationRole: (value: string | undefined) => ActionShiftRoleKey | null;
  storeOpen?: string;
  storeClose?: string;
  timezoneOffset?: string;
}): { ok: true; plan: ActionShiftSetupPlan } {
  const offset = input.timezoneOffset?.trim() || '-05:00';
  const schedule = parseCsv(input.scheduleCsv);
  const headers = schedule.headers.map((header) => header.trim().toLowerCase());
  const seatsByName = new Map(input.rosterSeats.map((seat) => [seat.displayName.trim().toLowerCase(), seat]));
  const issues = [...input.issues];
  const shifts: ActionShiftSetupPlan['shifts'] = [];
  const seenShiftIds = new Set<string>();

  schedule.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const displayName = normalize(row[0]);
    if (!displayName) {
      issues.push({ source: 'schedule', row: rowNumber, externalId: '', reason: 'missing_required_value' });
      return;
    }
    const seat = seatsByName.get(displayName.toLowerCase());
    if (!seat) {
      issues.push({ source: 'schedule', row: rowNumber, externalId: displayName, reason: 'worker_not_found' });
      return;
    }

    for (let cursor = 1; cursor + 3 < Math.max(row.length, headers.length); cursor += 4) {
      const dateValue = normalize(row[cursor]);
      const startValue = normalize(row[cursor + 1]);
      const endValue = normalize(row[cursor + 2]);
      const stationValue = normalize(row[cursor + 3]);
      if (!dateValue && !startValue && !endValue && !stationValue) continue;
      if (tokenKind(startValue) === 'ro' || tokenKind(endValue) === 'ro') continue;

      const businessDate = toIsoDate(dateValue);
      if (!businessDate) {
        issues.push({ source: 'schedule', row: rowNumber, externalId: seat.externalWorkerId, reason: 'invalid_business_date' });
        continue;
      }
      if (!startValue || !endValue) {
        issues.push({ source: 'schedule', row: rowNumber, externalId: seat.externalWorkerId, reason: 'missing_required_value' });
        continue;
      }

      const start = resolveClock({ value: startValue, kind: 'start', storeOpen: input.storeOpen, storeClose: input.storeClose });
      const end = resolveClock({ value: endValue, kind: 'end', storeOpen: input.storeOpen, storeClose: input.storeClose });
      if (!start.ok) {
        issues.push({ source: 'schedule', row: rowNumber, externalId: seat.externalWorkerId, reason: start.reason });
        continue;
      }
      if (!end.ok) {
        issues.push({ source: 'schedule', row: rowNumber, externalId: seat.externalWorkerId, reason: end.reason });
        continue;
      }

      const wrapsMidnight = end.minutes <= start.minutes;
      const startsAt = minutesToIso(businessDate, start.minutes, offset);
      const endsAt = minutesToIso(businessDate, end.minutes, offset, wrapsMidnight);
      if (new Date(endsAt) <= new Date(startsAt)) {
        issues.push({ source: 'schedule', row: rowNumber, externalId: seat.externalWorkerId, reason: 'invalid_time_window' });
        continue;
      }

      let roleKey = seat.roleKey;
      if (stationValue) {
        const stationRole = input.stationRole(stationValue);
        if (!stationRole) {
          issues.push({ source: 'schedule', row: rowNumber, externalId: seat.externalWorkerId, reason: 'unsupported_station' });
          continue;
        }
        roleKey = stationRole;
      }

      const externalShiftId = `${seat.externalWorkerId}:${businessDate}:${roleKey}:${start.minutes}`;
      if (seenShiftIds.has(externalShiftId.toLowerCase())) {
        issues.push({ source: 'schedule', row: rowNumber, externalId: externalShiftId, reason: 'duplicate_external_shift_id' });
        continue;
      }
      seenShiftIds.add(externalShiftId.toLowerCase());
      shifts.push({
        externalShiftId,
        externalWorkerId: seat.externalWorkerId,
        displayName: seat.displayName,
        roleKey,
        businessDate,
        startsAt,
        endsAt,
        checklistItems: input.rolePacks[roleKey],
      });
    }
  });

  return {
    ok: true,
    plan: {
      providerKey: input.providerKey,
      generatedAt: input.generatedAt,
      seats: input.rosterSeats,
      shifts,
      issues,
    },
  };
}
