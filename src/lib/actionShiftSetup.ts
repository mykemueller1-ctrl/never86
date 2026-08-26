import { findColumn, parseCsv } from './csv/core';

export const ACTION_SHIFT_ROLE_PACKS = {
  owner: [
    'Morning: approve the ranked actions, owners, targets, and evidence boundary',
    'Day: clear escalations that require operator authority',
    'Night: review exceptions, missing evidence, and tomorrow owner',
  ],
  general_manager: [
    'Open: review staffing, callouts, reservations, prior-night exceptions, and targets',
    'Mid: verify cash, labor, food-safety, and guest-recovery owners',
    'Close: approve deposit, labor exceptions, manager log, and unresolved handoff',
  ],
  manager: [
    'Open: review staffing, callouts, reservations, and prior-night exceptions',
    'Mid: verify cash, labor, food-safety, and guest-recovery owners',
    'Close: approve deposit, labor exceptions, manager log, and unresolved handoff',
  ],
  shift_lead: [
    'Open: confirm station coverage and first breaks',
    'Mid: record shift change, 86 list, and unresolved guest issues',
    'Close: verify side work, cash handoff, and manager escalation',
  ],
  kitchen_manager: [
    'Open: temperatures, prep plan, pars, and vendor exceptions',
    'Mid: line check, waste record, 86 list, and labor move',
    'Close: cooling, labels, equipment, waste, and sanitation proof',
  ],
  prep_cook: [
    'Start: review prep list, pars, labels, and thaw plan',
    'Shift: record completed batches, waste, and shortages',
    'Finish: label, rotate, clean station, and hand off unfinished prep',
  ],
  line_cook: [
    'Open: station setup, temperatures, tools, and pars',
    'Shift: record 86 items, waste, and food-safety exceptions',
    'Close: cool, label, clean, restock, and sign station handoff',
  ],
  cook: [
    'Open: assigned station, temperatures, tools, prep, and pars',
    'Shift: record shortages, waste, and food-safety exceptions',
    'Close: cool, label, clean, restock, and sign the kitchen handoff',
  ],
  dishwasher: [
    'Start: machine temperatures, chemicals, sinks, and clean storage',
    'Shift: maintain clean flow, trash, floors, and chemical levels',
    'Close: machine, drains, floors, trash, and final sanitation check',
  ],
  bartender: [
    'Open: drawer, wells, fruit, beer, wine, and bar cleanliness',
    'Shift: comps, spills, tabs, stock exceptions, and guest recovery',
    'Close: drawer handoff, bottles, coolers, taps, waste, and sanitation',
  ],
  server: [
    'Open: section, tables, side work, specials, and 86 list',
    'Shift: guest recovery, payment exceptions, and section handoff',
    'Close: side work, checkout, cash owed, and manager sign-off',
  ],
  host: [
    'Open: reservations, waitlist, menus, phones, and entry area',
    'Shift: quote accuracy, seating notes, and guest recovery handoff',
    'Close: reservations handoff, menus, entry area, and lost-and-found',
  ],
  driver: [
    'Start: vehicle, hot bags, route tools, and assigned orders',
    'Shift: delivery exceptions, payment issues, and guest recovery handoff',
    'Close: cash handoff, equipment return, mileage, and unresolved orders',
  ],
  staff: [
    'Start: uniform, station readiness, safety issues, and shift priorities',
    'Shift: record shortages, guest issues, and required handoffs',
    'Close: assigned side work, cleaning, equipment, and supervisor sign-off',
  ],
} as const;

export type ActionShiftRoleKey = keyof typeof ACTION_SHIFT_ROLE_PACKS;

export const ACTION_SHIFT_ROSTER_TEMPLATE = [
  'external_worker_id,display_name,role_key,status',
  'worker-001,Example Manager,manager,active',
  'worker-002,Example Cook,line_cook,active',
].join('\n');

export const ACTION_SHIFT_SCHEDULE_TEMPLATE = [
  'external_shift_id,external_worker_id,business_date,starts_at,ends_at',
  'shift-001,worker-001,2026-08-26,2026-08-26T08:00:00-05:00,2026-08-26T16:00:00-05:00',
  'shift-002,worker-002,2026-08-26,2026-08-26T10:00:00-05:00,2026-08-26T18:00:00-05:00',
].join('\n');

export type ActionShiftSetupIssue = {
  source: 'roster' | 'schedule';
  row: number;
  externalId: string;
  reason:
    | 'missing_required_value'
    | 'duplicate_external_worker_id'
    | 'duplicate_external_shift_id'
    | 'unsupported_role'
    | 'inactive_worker'
    | 'worker_not_found'
    | 'invalid_business_date'
    | 'invalid_time_window';
};

export type ActionShiftSetupPlan = {
  providerKey: string;
  generatedAt: string;
  seats: Array<{
    externalWorkerId: string;
    displayName: string;
    roleKey: ActionShiftRoleKey;
    checklistItems: readonly string[];
  }>;
  shifts: Array<{
    externalShiftId: string;
    externalWorkerId: string;
    displayName: string;
    roleKey: ActionShiftRoleKey;
    businessDate: string;
    startsAt: string;
    endsAt: string;
    checklistItems: readonly string[];
  }>;
  issues: ActionShiftSetupIssue[];
};

type BuildSetupInput = {
  rosterCsv: string;
  scheduleCsv: string;
  providerKey: string;
  generatedAt?: string;
};

type ColumnSpec = { key: string; aliases: string[] };

const ROSTER_COLUMNS: ColumnSpec[] = [
  { key: 'externalWorkerId', aliases: ['external_worker_id', 'worker_id', 'employee_id', 'user_id'] },
  { key: 'displayName', aliases: ['display_name', 'employee_name', 'worker_name', 'name'] },
  { key: 'roleKey', aliases: ['role_key', 'role', 'job', 'position'] },
  { key: 'status', aliases: ['status', 'employee_status', 'worker_status'] },
];

const SCHEDULE_COLUMNS: ColumnSpec[] = [
  { key: 'externalShiftId', aliases: ['external_shift_id', 'shift_id', 'schedule_id'] },
  { key: 'externalWorkerId', aliases: ['external_worker_id', 'worker_id', 'employee_id', 'user_id'] },
  { key: 'businessDate', aliases: ['business_date', 'shift_date', 'date'] },
  { key: 'startsAt', aliases: ['starts_at', 'start_time', 'start'] },
  { key: 'endsAt', aliases: ['ends_at', 'end_time', 'end'] },
];

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function normalizeKey(value: string | undefined): string {
  return normalize(value).toLowerCase().replace(/[\s-]+/g, '_');
}

const ROLE_ALIASES: Record<string, ActionShiftRoleKey> = {
  gm: 'general_manager',
  general_manager: 'general_manager',
  manager: 'manager',
  kitchen_lead: 'kitchen_manager',
  kitchen_manager: 'kitchen_manager',
  chef: 'kitchen_manager',
  sous_chef: 'kitchen_manager',
  shift_lead: 'shift_lead',
  supervisor: 'shift_lead',
  prep: 'prep_cook',
  prep_cook: 'prep_cook',
  cook: 'cook',
  line: 'line_cook',
  line_cook: 'line_cook',
  server: 'server',
  bartender: 'bartender',
  host: 'host',
  driver: 'driver',
  dishwasher: 'dishwasher',
  crew: 'staff',
  staff: 'staff',
  owner: 'owner',
};

function columnMap(headers: string[], specs: ColumnSpec[]): Record<string, number> | null {
  const entries = specs.map((spec) => [spec.key, findColumn(headers, spec.aliases)] as const);
  if (entries.some(([, index]) => index < 0)) return null;
  return Object.fromEntries(entries);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isRoleKey(value: string): value is ActionShiftRoleKey {
  return Object.prototype.hasOwnProperty.call(ACTION_SHIFT_ROLE_PACKS, value);
}

function canonicalRoleKey(value: string | undefined): ActionShiftRoleKey | null {
  const normalized = normalizeKey(value);
  const aliased = ROLE_ALIASES[normalized] ?? normalized;
  return isRoleKey(aliased) ? aliased : null;
}

function csvStructureError(input: string): string | null {
  let inQuotes = false;
  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== '"') continue;
    if (inQuotes && input[index + 1] === '"') {
      index += 1;
      continue;
    }
    inQuotes = !inQuotes;
  }
  return inQuotes ? 'contains an unclosed quoted field' : null;
}

export function buildActionShiftSetupPlan(
  input: BuildSetupInput,
): { ok: true; plan: ActionShiftSetupPlan } | { ok: false; error: string } {
  const providerKey = normalizeKey(input.providerKey);
  if (!providerKey) return { ok: false, error: 'Enter the schedule or time-clock provider key.' };

  const rosterStructureError = csvStructureError(input.rosterCsv);
  if (rosterStructureError) return { ok: false, error: `Roster CSV ${rosterStructureError}.` };
  const scheduleStructureError = csvStructureError(input.scheduleCsv);
  if (scheduleStructureError) return { ok: false, error: `Schedule CSV ${scheduleStructureError}.` };

  const roster = parseCsv(input.rosterCsv);
  const schedule = parseCsv(input.scheduleCsv);
  if (roster.rows.length === 0) return { ok: false, error: 'Roster CSV has no data rows.' };
  if (schedule.rows.length === 0) return { ok: false, error: 'Schedule CSV has no data rows.' };
  if (roster.rows.some((row) => row.length !== roster.headers.length)) {
    return { ok: false, error: 'Roster CSV has a row with the wrong number of columns.' };
  }
  if (schedule.rows.some((row) => row.length !== schedule.headers.length)) {
    return { ok: false, error: 'Schedule CSV has a row with the wrong number of columns.' };
  }

  const rosterColumns = columnMap(roster.headers, ROSTER_COLUMNS);
  if (!rosterColumns) {
    return {
      ok: false,
      error: 'Roster needs external_worker_id, display_name, role_key, and status columns.',
    };
  }
  const scheduleColumns = columnMap(schedule.headers, SCHEDULE_COLUMNS);
  if (!scheduleColumns) {
    return {
      ok: false,
      error: 'Schedule needs external_shift_id, external_worker_id, business_date, starts_at, and ends_at columns.',
    };
  }

  const issues: ActionShiftSetupIssue[] = [];
  const seats: ActionShiftSetupPlan['seats'] = [];
  const seatByExternalId = new Map<string, ActionShiftSetupPlan['seats'][number]>();
  const seenWorkerIds = new Set<string>();

  roster.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const externalWorkerId = normalize(row[rosterColumns.externalWorkerId]);
    const displayName = normalize(row[rosterColumns.displayName]);
    const rawRoleKey = normalizeKey(row[rosterColumns.roleKey]);
    const roleKey = canonicalRoleKey(rawRoleKey);
    const status = normalizeKey(row[rosterColumns.status]);
    if (!externalWorkerId || !displayName || !rawRoleKey || !status) {
      issues.push({ source: 'roster', row: rowNumber, externalId: externalWorkerId, reason: 'missing_required_value' });
      return;
    }
    const workerKey = externalWorkerId.toLowerCase();
    if (seenWorkerIds.has(workerKey)) {
      issues.push({ source: 'roster', row: rowNumber, externalId: externalWorkerId, reason: 'duplicate_external_worker_id' });
      return;
    }
    seenWorkerIds.add(workerKey);
    if (!roleKey) {
      issues.push({ source: 'roster', row: rowNumber, externalId: externalWorkerId, reason: 'unsupported_role' });
      return;
    }
    if (status !== 'active') {
      issues.push({ source: 'roster', row: rowNumber, externalId: externalWorkerId, reason: 'inactive_worker' });
      return;
    }
    const seat = {
      externalWorkerId,
      displayName,
      roleKey,
      checklistItems: ACTION_SHIFT_ROLE_PACKS[roleKey],
    };
    seats.push(seat);
    seatByExternalId.set(workerKey, seat);
  });

  const shifts: ActionShiftSetupPlan['shifts'] = [];
  const seenShiftIds = new Set<string>();
  schedule.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const externalShiftId = normalize(row[scheduleColumns.externalShiftId]);
    const externalWorkerId = normalize(row[scheduleColumns.externalWorkerId]);
    const businessDate = normalize(row[scheduleColumns.businessDate]);
    const startsAt = normalize(row[scheduleColumns.startsAt]);
    const endsAt = normalize(row[scheduleColumns.endsAt]);
    if (!externalShiftId || !externalWorkerId || !businessDate || !startsAt || !endsAt) {
      issues.push({ source: 'schedule', row: rowNumber, externalId: externalShiftId, reason: 'missing_required_value' });
      return;
    }
    const shiftKey = externalShiftId.toLowerCase();
    if (seenShiftIds.has(shiftKey)) {
      issues.push({ source: 'schedule', row: rowNumber, externalId: externalShiftId, reason: 'duplicate_external_shift_id' });
      return;
    }
    seenShiftIds.add(shiftKey);
    if (!validDate(businessDate)) {
      issues.push({ source: 'schedule', row: rowNumber, externalId: externalShiftId, reason: 'invalid_business_date' });
      return;
    }
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end <= start) {
      issues.push({ source: 'schedule', row: rowNumber, externalId: externalShiftId, reason: 'invalid_time_window' });
      return;
    }
    const seat = seatByExternalId.get(externalWorkerId.toLowerCase());
    if (!seat) {
      issues.push({ source: 'schedule', row: rowNumber, externalId: externalShiftId, reason: 'worker_not_found' });
      return;
    }
    shifts.push({
      externalShiftId,
      externalWorkerId,
      displayName: seat.displayName,
      roleKey: seat.roleKey,
      businessDate,
      startsAt,
      endsAt,
      checklistItems: seat.checklistItems,
    });
  });

  return {
    ok: true,
    plan: {
      providerKey,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      seats,
      shifts,
      issues,
    },
  };
}
