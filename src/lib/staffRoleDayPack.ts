import type { ActionShiftRoleKey } from './actionShiftSetup';
import {
  CTAP_COGS_BONUS_POLICY,
  CTAP_LAB_TEMPLATES,
  CTAP_LAB_WEEKDAYS,
  type CtapLabShiftPhase,
  type CtapLabTemplate,
  type CtapLabWeekday,
  vendorCadenceForWeekday,
} from './ctapLabPack';
import type { StationSeatKey } from './staffSeatAuth';
import { STATION_SEAT_KEYS } from './staffSeatAuth';

export const STAFF_ROLE_DAY_PACK_ID = 'staff-role-day-v1';
export const STAFF_ROLE_DAY_PACK_STATUS = 'drafted' as const;

export type StaffRoleDayView = CtapLabShiftPhase | 'today';

export type StaffRoleDayPolicyKind =
  | 'pour'
  | 'bucket'
  | 'void_promo'
  | 'cost_band'
  | 'coverage'
  | 'deposit'
  | 'dough'
  | 'late_delivery'
  | 'fry_rotation'
  | 'order_night';

export type StaffRoleDayPolicy = {
  id: string;
  title: string;
  kind: StaffRoleDayPolicyKind;
  audience: readonly StationSeatKey[];
  rules: readonly string[];
  moneyKind: 'posted_policy' | 'percent_band' | 'none';
};

export type StaffRoleDayDesk = {
  packId: string;
  status: typeof STAFF_ROLE_DAY_PACK_STATUS;
  seatKey: StationSeatKey;
  stationLabel: string;
  weekday: CtapLabWeekday;
  view: StaffRoleDayView;
  checklist: readonly CtapLabTemplate[];
  policies: readonly StaffRoleDayPolicy[];
  extras: readonly string[];
  boundary: {
    livePayroll: false;
    livePurchaseOrders: false;
    liveWeeklyDollars: false;
    inventedRecipeBook: false;
    publicSafe: true;
  };
};

const STATION_LABELS: Record<StationSeatKey, string> = {
  owner: 'Owner desk',
  foh_manager: 'FOH manager station',
  kitchen_manager: 'Kitchen manager station',
  bartender: 'Bartender station',
  server: 'Server station',
  prep: 'Prep station',
  driver: 'Driver station',
};

/** Wall roles this seat may see. Crew stays on its own station card. */
const WALL_ROLES_FOR_SEAT: Record<StationSeatKey, readonly ActionShiftRoleKey[]> = {
  owner: ['owner'],
  foh_manager: ['manager', 'bartender', 'server'],
  kitchen_manager: ['kitchen_manager', 'prep_cook', 'driver'],
  bartender: ['bartender'],
  server: ['server'],
  prep: ['prep_cook'],
  driver: ['driver'],
};

function steps(rows: readonly [instruction: string, group: string][]): CtapLabTemplate['steps'] {
  return rows.map(([instruction, group]) => ({ instruction, group, required: true }));
}

const FRY_OPEN: CtapLabTemplate = {
  id: 'fry-open',
  name: 'Fry — AM rotation',
  roleKey: 'kitchen_manager',
  stationKey: 'fry',
  shiftPhase: 'open',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Confirm fryer oil is at the mark and at temp before the first drop', 'Fry'],
    ['Filter if last night close required it', 'Fry'],
    ['Rotate fry freezer — oldest product forward', 'Fry'],
    ['Clean baskets, skimmers, and the dump station before first ticket', 'Fry'],
  ]),
};

const FRY_CLOSE: CtapLabTemplate = {
  id: 'fry-close',
  name: 'Fry — PM rotation',
  roleKey: 'kitchen_manager',
  stationKey: 'fry',
  shiftPhase: 'close',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Filter oil before close', 'Fry'],
    ['Cover fryers', 'Fry'],
    ['Restock fry freezer pars from the walk-in — oldest forward', 'Fry'],
    ['Sweep and wipe the fryer line; dump crumb trays', 'Fry'],
  ]),
};

export const FRY_ROTATION_TEMPLATES: readonly CtapLabTemplate[] = [FRY_OPEN, FRY_CLOSE];

export const STAFF_ROLE_DAY_POLICIES: readonly StaffRoleDayPolicy[] = [
  {
    id: 'pour-spec',
    title: 'Pour spec + POS ring',
    kind: 'pour',
    audience: ['foh_manager', 'bartender'],
    moneyKind: 'none',
    rules: [
      'Mixed drinks go in the pilsner — not a plastic cup.',
      'Shot is 1.5 oz. Do not fill the 2 oz glass to the top.',
      'Rocks drinks use the short glass packed with ice.',
      'Wine pour is 5 oz. Liquor in a mixed drink is 1.75 oz.',
      'Ring the posted POS button. Doubles, mixers, and take-home pop are separate buttons — not a broad special.',
    ],
  },
  {
    id: 'bucket-prices',
    title: 'Bucket prices (posted policy)',
    kind: 'bucket',
    audience: ['foh_manager', 'bartender'],
    moneyKind: 'posted_policy',
    rules: [
      'White Claw bucket: $25.',
      'Skimmer bucket: $30.',
      'Carbliss bucket: $35.',
      'Standard domestic 6-can bucket: $18.',
      'These are posted house prices, not this week\'s invoice cost.',
    ],
  },
  {
    id: 'void-vs-promo',
    title: 'Void vs promo',
    kind: 'void_promo',
    audience: ['foh_manager', 'kitchen_manager', 'bartender', 'server', 'prep'],
    moneyKind: 'none',
    rules: [
      'A void means the item was rung by mistake and kitchen never started it.',
      'Cooked food is a promo, not a void — burnt, dropped, wrong, or delivery remake is re-rung and promo\'d.',
      'No remake without a ticket. Voids need manager approval.',
    ],
  },
  {
    id: 'cost-bands',
    title: 'Cost bands (policy constants)',
    kind: 'cost_band',
    audience: ['owner', 'foh_manager', 'kitchen_manager'],
    moneyKind: 'percent_band',
    rules: CTAP_COGS_BONUS_POLICY.map(
      (band) => `${band.category}: ${band.targetMinPct}–${band.targetMaxPct}% of category sales. Not this week\'s dollars.`,
    ),
  },
  {
    id: 'coverage',
    title: 'FOH coverage',
    kind: 'coverage',
    audience: ['foh_manager'],
    moneyKind: 'none',
    rules: [
      'Dining / back room coverage is Tuesday–Sunday. Never Monday.',
      'Day Monday–Thursday: one person out front.',
      'Night: two out front + one back room.',
    ],
  },
  {
    id: 'deposit-before-close',
    title: 'Deposit before close',
    kind: 'deposit',
    audience: ['foh_manager', 'bartender'],
    moneyKind: 'none',
    rules: [
      'Run the deposit before close.',
      'Cash proof closes it. A verbal yes does not.',
    ],
  },
  {
    id: 'dough-by-3',
    title: 'Dough by 3',
    kind: 'dough',
    audience: ['kitchen_manager', 'prep'],
    moneyKind: 'none',
    rules: [
      'Dough must be rolled and put away by 3pm.',
      'Check dough before clocking out.',
    ],
  },
  {
    id: 'late-delivery-four',
    title: 'Late-delivery four questions',
    kind: 'late_delivery',
    audience: ['kitchen_manager'],
    moneyKind: 'none',
    rules: [
      'Promise time — was the ticket already late when promised?',
      'Make-line — did kitchen finish on time?',
      'Handoff — was it ready for the driver?',
      'Driver arrival — did the run leave or arrive late?',
      'Save the late-ticket list. A verbal yes does not close it.',
    ],
  },
  {
    id: 'fry-rotation-policy',
    title: 'Fry AM/PM rotation',
    kind: 'fry_rotation',
    audience: ['kitchen_manager'],
    moneyKind: 'none',
    rules: [
      'AM: oil at mark, filter if required, oldest product forward, clean baskets before first drop.',
      'PM: filter, cover, restock freezer pars, sweep the fryer line.',
      'Portion weights stay on the fry card. This desk does not invent a recipe book.',
    ],
  },
];

function phasesForView(view: StaffRoleDayView): readonly CtapLabShiftPhase[] {
  if (view === 'today') return ['open', 'mid', 'close', 'weekly'];
  if (view === 'weekly') return ['weekly'];
  return [view, 'weekly'];
}

function templateFitsView(template: CtapLabTemplate, view: StaffRoleDayView): boolean {
  return phasesForView(view).includes(template.shiftPhase);
}

function templateFitsWeekday(template: CtapLabTemplate, weekday: CtapLabWeekday): boolean {
  return template.weekday == null || template.weekday === weekday;
}

function wallTemplatesForSeat(
  seatKey: StationSeatKey,
  weekday: CtapLabWeekday,
  view: StaffRoleDayView,
): CtapLabTemplate[] {
  const roles = WALL_ROLES_FOR_SEAT[seatKey];
  return CTAP_LAB_TEMPLATES.filter((template) => {
    if (!roles.includes(template.roleKey)) return false;
    if (!templateFitsWeekday(template, weekday)) return false;
    if (!templateFitsView(template, view)) return false;
    return true;
  });
}

function fryTemplatesForView(view: StaffRoleDayView): CtapLabTemplate[] {
  return FRY_ROTATION_TEMPLATES.filter((template) => templateFitsView(template, view));
}

function extrasForSeat(seatKey: StationSeatKey, weekday: CtapLabWeekday, view: StaffRoleDayView): string[] {
  const extras: string[] = [];
  if (seatKey === 'foh_manager') {
    const cadence = vendorCadenceForWeekday(weekday);
    for (const rule of cadence) {
      extras.push(
        `${rule.action === 'order' ? 'Order night' : 'Receive'} ${rule.vendor} ${rule.category.replace('_', '/')} — ${rule.note}`,
      );
    }
    if (view === 'today' || view === 'close') {
      extras.push('Deposit before close — cash proof, not a verbal yes.');
    }
  }
  if (seatKey === 'kitchen_manager' && (view === 'today' || view === 'open' || view === 'mid' || view === 'close')) {
    extras.push('Walk drivers: between-runs dishes are the side work. No sheet = no reimbursement.');
  }
  return extras;
}

export function stationLabelForSeat(seatKey: StationSeatKey): string {
  return STATION_LABELS[seatKey];
}

export function policiesForSeat(seatKey: StationSeatKey): StaffRoleDayPolicy[] {
  return STAFF_ROLE_DAY_POLICIES.filter((policy) => policy.audience.includes(seatKey));
}

export function buildStaffRoleDayDesk(input: {
  seatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  view?: StaffRoleDayView;
}): StaffRoleDayDesk {
  const view = input.view ?? 'today';
  const checklist = wallTemplatesForSeat(input.seatKey, input.weekday, view);
  if (input.seatKey === 'kitchen_manager') {
    checklist.push(...fryTemplatesForView(view));
  }
  return {
    packId: STAFF_ROLE_DAY_PACK_ID,
    status: STAFF_ROLE_DAY_PACK_STATUS,
    seatKey: input.seatKey,
    stationLabel: stationLabelForSeat(input.seatKey),
    weekday: input.weekday,
    view,
    checklist,
    policies: policiesForSeat(input.seatKey),
    extras: extrasForSeat(input.seatKey, input.weekday, view),
    boundary: {
      livePayroll: false,
      livePurchaseOrders: false,
      liveWeeklyDollars: false,
      inventedRecipeBook: false,
      publicSafe: true,
    },
  };
}

export function buildAllStaffRoleDayDesks(weekday: CtapLabWeekday, view: StaffRoleDayView = 'today'): StaffRoleDayDesk[] {
  return STATION_SEAT_KEYS.map((seatKey) => buildStaffRoleDayDesk({ seatKey, weekday, view }));
}

const PRIVATE_HITS: readonly RegExp[] = [
  /\bkarlee\b/i,
  /\bsturtz\b/i,
  /\bashley\b/i,
  /\bholding\b/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(pin|password|ssn|social security)\b/i,
  /\$\s?\d{2,4}\s*\/\s*week/i,
  /\bfacebook\b/i,
];

export function findStaffRoleDayPrivacyHits(value: unknown): string[] {
  const text = JSON.stringify(value);
  return PRIVATE_HITS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

export const STAFF_ROLE_DAY_WEEKDAYS = CTAP_LAB_WEEKDAYS;
