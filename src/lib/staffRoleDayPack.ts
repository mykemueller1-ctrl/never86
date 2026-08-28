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

export const STAFF_ROLE_DAY_PACK_ID = 'staff-deep-seats-v1';
export const STAFF_ROLE_DAY_PACK_STATUS = 'drafted' as const;
export const STAFF_ROLE_DAY_TIMEZONE = 'America/Chicago';

export const ORDER_PATH_LINE =
  'Ticket out of the printer, bag and tag, driver area.';
export const ORDER_PATH_FULL =
  'Ticket out of the printer, bag and tag, driver area, grab, hit dispatch, leave, come back. The bag is not the cue.';

export type StaffRoleDayView = CtapLabShiftPhase | 'today';

export type StaffRoleDayPolicyKind =
  | 'pour'
  | 'bucket'
  | 'void_promo'
  | 'cost_band'
  | 'coverage'
  | 'deposit'
  | 'drawer'
  | 'dough'
  | 'late_z'
  | 'fry_rotation'
  | 'order_night'
  | 'order_path'
  | 'driver_window'
  | 'weekend_drivers';

export type StaffRoleDayPolicy = {
  id: string;
  title: string;
  kind: StaffRoleDayPolicyKind;
  audience: readonly StationSeatKey[];
  rules: readonly string[];
  moneyKind: 'posted_policy' | 'percent_band' | 'none';
};

export type StaffScheduleBoardRule = {
  id: string;
  title: string;
  audience: readonly StationSeatKey[];
  weekdays: readonly CtapLabWeekday[] | 'all';
  rules: readonly string[];
};

export type StaffStationCommChannel = 'front' | 'back' | 'dollars';

export type StaffStationComm = {
  id: string;
  channel: StaffStationCommChannel;
  roleTitle: string;
  stationName: string;
  rule: string;
  delivery: 'in_app_note';
  mailSent: false;
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
  scheduleBoard: readonly StaffScheduleBoardRule[];
  comms: readonly StaffStationComm[];
  extras: readonly string[];
  boundary: {
    livePayroll: false;
    livePurchaseOrders: false;
    liveWeeklyDollars: false;
    inventedRecipeBook: false;
    autoEmail: false;
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
  line_cook: 'Line cook station',
  pizza: 'Pizza station',
  dishwasher: 'Dishwasher station',
};

/** Wall roles this seat may see. Crew stays on its own station card. */
const WALL_ROLES_FOR_SEAT: Record<StationSeatKey, readonly ActionShiftRoleKey[]> = {
  owner: ['owner'],
  foh_manager: ['manager', 'bartender', 'server'],
  kitchen_manager: ['kitchen_manager', 'prep_cook'],
  bartender: ['bartender'],
  server: ['server'],
  prep: ['prep_cook'],
  driver: ['driver'],
  line_cook: ['line_cook'],
  pizza: ['cook'],
  dishwasher: ['dishwasher'],
};

function steps(rows: readonly [instruction: string, group: string][]): CtapLabTemplate['steps'] {
  return rows.map(([instruction, group]) => ({ instruction, group, required: true }));
}

const FRY_OPEN: CtapLabTemplate = {
  id: 'fry-open',
  name: 'Fry — AM rotation',
  roleKey: 'line_cook',
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
  roleKey: 'line_cook',
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

const LINE_COOK_OPEN: CtapLabTemplate = {
  id: 'line-cook-open',
  name: 'Line cook — open',
  roleKey: 'line_cook',
  stationKey: 'line',
  shiftPhase: 'open',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Open: station setup, temperatures, tools, and pars', 'Open'],
  ]),
};

const LINE_COOK_MID: CtapLabTemplate = {
  id: 'line-cook-mid',
  name: 'Line cook — shift',
  roleKey: 'line_cook',
  stationKey: 'line',
  shiftPhase: 'mid',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    [ORDER_PATH_LINE, 'Order path'],
    ['Do not hold the second lunch ticket.', 'Lunch'],
    ['Remakes are re-rung and promoed — voids only if food never started', 'Shift'],
  ]),
};

const LINE_COOK_CLOSE: CtapLabTemplate = {
  id: 'line-cook-close',
  name: 'Line cook — close',
  roleKey: 'line_cook',
  stationKey: 'line',
  shiftPhase: 'close',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Close: cool, label, clean, restock, and sign station handoff', 'Close'],
  ]),
};

export const LINE_COOK_TEMPLATES: readonly CtapLabTemplate[] = [LINE_COOK_OPEN, LINE_COOK_MID, LINE_COOK_CLOSE];

const PIZZA_LINE_OPEN: CtapLabTemplate = {
  id: 'pizza-line-open',
  name: 'Pizza line — open',
  roleKey: 'cook',
  stationKey: 'pizza_line',
  shiftPhase: 'open',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Confirm prep procedures match the morning pizza prep list', 'Prep'],
    ['Make sure pizza line is fully stocked up top', 'Stocking'],
  ]),
};

const PIZZA_LINE_CLOSE: CtapLabTemplate = {
  id: 'pizza-line-close',
  name: 'Pizza line — close',
  roleKey: 'cook',
  stationKey: 'pizza_line',
  shiftPhase: 'close',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Wipe down pizza table', 'Cleaning'],
    ['Turn pizza ovens off', 'Equipment'],
    ['Pull out the pizza line and swipe behind it', 'Cleaning'],
    ['Sweep and mop pizza side and store room', 'Floors'],
  ]),
};

export const PIZZA_LINE_TEMPLATES: readonly CtapLabTemplate[] = [PIZZA_LINE_OPEN, PIZZA_LINE_CLOSE];

const DISH_OPEN: CtapLabTemplate = {
  id: 'dish-open',
  name: 'Dish — start',
  roleKey: 'dishwasher',
  stationKey: 'dish',
  shiftPhase: 'open',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Start: fill and heat the machine; verify wash 150-160F, rinse 180F minimum, detergent, sanitizer, and clear drain screens', 'Open'],
  ]),
};

const DISH_MID: CtapLabTemplate = {
  id: 'dish-mid',
  name: 'Dish — shift',
  roleKey: 'dishwasher',
  stationKey: 'dish',
  shiftPhase: 'mid',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Dishes between runs. Scrape before load, do not overload, check rinse arms, replace dirty water', 'Shift'],
    ['Delivery dishes come in. Do not go to the lot.', 'Drivers'],
  ]),
};

const DISH_CLOSE: CtapLabTemplate = {
  id: 'dish-close',
  name: 'Dish — close',
  roleKey: 'dishwasher',
  stationKey: 'dish',
  shiftPhase: 'close',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    ['Close: drain, clean arms/screens/trays/curtains, sanitize interior, wipe exterior, leave door open, and log completion', 'Close'],
  ]),
};

export const DISH_TEMPLATES: readonly CtapLabTemplate[] = [DISH_OPEN, DISH_MID, DISH_CLOSE];

const DRIVER_ORDER_PATH: CtapLabTemplate = {
  id: 'driver-order-path',
  name: 'Driver — order path',
  roleKey: 'driver',
  stationKey: 'delivery',
  shiftPhase: 'mid',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    [ORDER_PATH_FULL, 'Order path'],
  ]),
};

const KITCHEN_ORDER_PATH: CtapLabTemplate = {
  id: 'kitchen-order-path',
  name: 'Kitchen — ticket to driver area',
  roleKey: 'kitchen_manager',
  stationKey: 'kitchen',
  shiftPhase: 'mid',
  weekday: null,
  source: 'kitchen-open-close',
  steps: steps([
    [ORDER_PATH_FULL, 'Order path'],
  ]),
};

export const ORDER_PATH_TEMPLATES: readonly CtapLabTemplate[] = [DRIVER_ORDER_PATH, KITCHEN_ORDER_PATH];

/** Station-role titles Myke authorized 2026-08-28. First names only; no roster, emails, or PINs. */
export const STAFF_STATION_COMMS: readonly StaffStationComm[] = [
  {
    id: 'front',
    channel: 'front',
    roleTitle: 'FOH lead',
    stationName: 'Kenzy',
    rule: 'FOH only. Front questions go to Kenzy as an in-app station note. Not kitchen make-time. Not the driver board. This desk does not send mail.',
    delivery: 'in_app_note',
    mailSent: false,
  },
  {
    id: 'back',
    channel: 'back',
    roleTitle: 'Kitchen lead',
    stationName: 'Tom',
    rule: 'Kitchen and drivers go to Tom as an in-app station note. Ticket out of the printer, bag and tag, driver area, grab, hit dispatch. This desk does not send mail.',
    delivery: 'in_app_note',
    mailSent: false,
  },
  {
    id: 'dollars',
    channel: 'dollars',
    roleTitle: 'Owner',
    stationName: 'Myke',
    rule: 'Drawer and bank go to Myke as an in-app station note. Deposit before close. A $0 actual with a counted drawer is unentered, not a shortage, and not driver late. This desk does not send mail.',
    delivery: 'in_app_note',
    mailSent: false,
  },
];

const COMMS_FOR_SEAT: Record<StationSeatKey, readonly StaffStationCommChannel[]> = {
  owner: ['dollars'],
  foh_manager: ['front'],
  bartender: ['front'],
  server: ['front'],
  kitchen_manager: ['back'],
  prep: ['back'],
  driver: ['back'],
  line_cook: ['back'],
  pizza: ['back'],
  dishwasher: ['back'],
};

const WEEKDAYS_MON_THU: readonly CtapLabWeekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const WEEKDAYS_FRI_SAT: readonly CtapLabWeekday[] = ['Friday', 'Saturday'];
const WEEKDAYS_SUNDAY: readonly CtapLabWeekday[] = ['Sunday'];
const KITCHEN_BOARD_AUDIENCE: readonly StationSeatKey[] = ['kitchen_manager', 'line_cook', 'pizza', 'dishwasher', 'driver'];
const DRIVER_BOARD_AUDIENCE: readonly StationSeatKey[] = ['kitchen_manager', 'driver'];

export const STAFF_SCHEDULE_BOARD: readonly StaffScheduleBoardRule[] = [
  {
    id: 'foh-coverage',
    title: 'FOH coverage',
    audience: ['foh_manager'],
    weekdays: 'all',
    rules: [
      'Dining / back room coverage is Tuesday–Sunday. Never Monday.',
      'Day Monday–Thursday: one person out front.',
      'Night: two out front + one back room.',
    ],
  },
  {
    id: 'weekday-driver-11-1',
    title: 'Weekday 11–1 driver slot',
    audience: DRIVER_BOARD_AUDIENCE,
    weekdays: WEEKDAYS_MON_THU,
    rules: [
      'Weekdays 11:00–13:00 driver slot exists. No name on this desk.',
    ],
  },
  {
    id: 'mon-thu-am',
    title: 'Mon–Thu AM board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: WEEKDAYS_MON_THU,
    rules: [
      'AM: 2 line, 1 pizza.',
    ],
  },
  {
    id: 'mon-night',
    title: 'Monday night board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: ['Monday'],
    rules: [
      'Night: 3 pizza, 2 line, 2 drivers.',
    ],
  },
  {
    id: 'tue-board',
    title: 'Tuesday board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: ['Tuesday'],
    rules: [
      '3 pizza, 2–3 line, 2 drivers + dish.',
    ],
  },
  {
    id: 'wed-board',
    title: 'Wednesday board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: ['Wednesday'],
    rules: [
      '3 pizza, 2 line, 2 drivers + dish.',
    ],
  },
  {
    id: 'thu-board',
    title: 'Thursday board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: ['Thursday'],
    rules: [
      '4 pizza, 2 line, dish, 2 drivers.',
    ],
  },
  {
    id: 'fri-day',
    title: 'Friday day board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: ['Friday'],
    rules: [
      'Day: 2 fry/line, 2 pizza, 1 driver.',
    ],
  },
  {
    id: 'fri-sat-night',
    title: 'Friday / Saturday night board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: WEEKDAYS_FRI_SAT,
    rules: [
      'Night: 5 pizza, 3 line, dish, 3 drivers.',
    ],
  },
  {
    id: 'sunday-board',
    title: 'Sunday board',
    audience: KITCHEN_BOARD_AUDIENCE,
    weekdays: WEEKDAYS_SUNDAY,
    rules: [
      '4 pizza, 2 line, 2 drivers only if good.',
      'Sunday till 6 is open.',
    ],
  },
];

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
    audience: ['foh_manager', 'kitchen_manager', 'bartender', 'server', 'prep', 'line_cook', 'pizza'],
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
    audience: ['owner', 'kitchen_manager'],
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
    audience: ['owner'],
    moneyKind: 'none',
    rules: [
      'Drawer and bank. Run the deposit before close.',
      'A $0 actual with a counted drawer is unentered, not a shortage.',
      'That is not driver late.',
      'Cash proof closes it. A verbal yes does not.',
    ],
  },
  {
    id: 'drawer-bank',
    title: 'Drawer and bank',
    kind: 'drawer',
    audience: ['owner'],
    moneyKind: 'none',
    rules: [
      'Myke owns the drawer and the bank.',
      'Deposit before close.',
      'A $0 actual plus a counted drawer is unentered, not a shortage, and not driver late.',
    ],
  },
  {
    id: 'dough-by-3',
    title: 'Dough by 3',
    kind: 'dough',
    audience: ['kitchen_manager', 'prep', 'pizza'],
    moneyKind: 'none',
    rules: [
      'Dough must be rolled and put away by 3pm.',
      'Check dough before clocking out.',
    ],
  },
  {
    id: 'late-on-z',
    title: 'Late on Z',
    kind: 'late_z',
    audience: ['kitchen_manager', 'driver'],
    moneyKind: 'none',
    rules: [
      'Late on Z: ask dispatch first.',
      'Then check the 11:00–13:00 window.',
      'Do not restaff off a missed button.',
    ],
  },
  {
    id: 'fry-rotation-policy',
    title: 'Fry AM/PM rotation',
    kind: 'fry_rotation',
    audience: ['kitchen_manager', 'line_cook'],
    moneyKind: 'none',
    rules: [
      'AM: oil at mark, filter if required, oldest product forward, clean baskets before first drop.',
      'PM: filter, cover, restock freezer pars, sweep the fryer line.',
      'Portion weights stay on the fry card. This desk does not invent a recipe book.',
    ],
  },
  {
    id: 'order-path',
    title: 'Order path',
    kind: 'order_path',
    audience: ['kitchen_manager', 'line_cook', 'pizza', 'driver'],
    moneyKind: 'none',
    rules: [
      ORDER_PATH_FULL,
      'Line: ticket out, bag and tag, driver area. Do not hold the second lunch ticket.',
    ],
  },
  {
    id: 'dish-path',
    title: 'Dish path',
    kind: 'order_path',
    audience: ['dishwasher', 'kitchen_manager'],
    moneyKind: 'none',
    rules: [
      'Dishes between runs.',
      'Delivery dishes come in. Not the lot.',
    ],
  },
  {
    id: 'weekday-driver-11-1',
    title: 'Weekday 11–1 driver slot',
    kind: 'driver_window',
    audience: DRIVER_BOARD_AUDIENCE,
    moneyKind: 'none',
    rules: [
      'Weekdays 11:00–13:00 driver slot exists. No name on this desk.',
    ],
  },
  {
    id: 'weekend-drivers',
    title: 'Weekend driver coverage',
    kind: 'weekend_drivers',
    audience: DRIVER_BOARD_AUDIENCE,
    moneyKind: 'none',
    rules: [
      'Friday and Saturday night: 3 drivers.',
      'Sunday: 2 drivers only if good.',
      'Sunday till 6 is open.',
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
  const fromWall = CTAP_LAB_TEMPLATES.filter((template) => {
    if (template.id === 'driver-between-runs') return false;
    if (seatKey === 'foh_manager' && /make-time|driver board|dispatch/i.test(template.name)) {
      return false;
    }
    if (seatKey === 'pizza') {
      return template.stationKey === 'pizza_side'
        && templateFitsWeekday(template, weekday)
        && templateFitsView(template, view);
    }
    if (!roles.includes(template.roleKey)) return false;
    if (!templateFitsWeekday(template, weekday)) return false;
    if (!templateFitsView(template, view)) return false;
    return true;
  });
  return fromWall;
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
  }
  if (seatKey === 'owner' && (view === 'today' || view === 'close')) {
    extras.push('Deposit before close. A $0 actual with a counted drawer is unentered, not a shortage, and not driver late.');
  }
  if (seatKey === 'kitchen_manager') {
    extras.push(ORDER_PATH_FULL);
    extras.push('Late on Z: ask dispatch first. Then the 11:00–13:00 window. Do not restaff off a missed button.');
  }
  if (seatKey === 'line_cook') {
    extras.push(ORDER_PATH_LINE);
    extras.push('Do not hold the second lunch ticket.');
  }
  if (seatKey === 'driver') {
    extras.push(ORDER_PATH_FULL);
  }
  if (seatKey === 'dishwasher') {
    extras.push('Dishes between runs. Delivery dishes come in. Not the lot.');
  }
  if ((seatKey === 'kitchen_manager' || seatKey === 'driver') && WEEKDAYS_MON_THU.includes(weekday)) {
    extras.push('Weekdays 11:00–13:00 driver slot exists. No name on this desk.');
  }
  if ((seatKey === 'kitchen_manager' || seatKey === 'driver') && WEEKDAYS_FRI_SAT.includes(weekday)) {
    extras.push('Friday and Saturday night: 3 drivers.');
  }
  if ((seatKey === 'kitchen_manager' || seatKey === 'driver') && weekday === 'Sunday') {
    extras.push('Sunday: 2 drivers only if good. Sunday till 6 is open.');
  }
  return extras;
}

export function commsForSeat(seatKey: StationSeatKey): StaffStationComm[] {
  const channels = COMMS_FOR_SEAT[seatKey];
  return STAFF_STATION_COMMS.filter((comm) => channels.includes(comm.channel));
}

export function stationLabelForSeat(seatKey: StationSeatKey): string {
  return STATION_LABELS[seatKey];
}

export function policiesForSeat(seatKey: StationSeatKey): StaffRoleDayPolicy[] {
  return STAFF_ROLE_DAY_POLICIES.filter((policy) => policy.audience.includes(seatKey));
}

export function scheduleBoardForSeat(seatKey: StationSeatKey, weekday: CtapLabWeekday): StaffScheduleBoardRule[] {
  return STAFF_SCHEDULE_BOARD.filter((rule) => {
    if (!rule.audience.includes(seatKey)) return false;
    if (rule.weekdays !== 'all' && !rule.weekdays.includes(weekday)) return false;
    return true;
  });
}

export function storeWeekdayToday(now: Date = new Date()): CtapLabWeekday {
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: STAFF_ROLE_DAY_TIMEZONE,
  }).format(now);
  if ((CTAP_LAB_WEEKDAYS as readonly string[]).includes(day)) return day as CtapLabWeekday;
  return 'Monday';
}

export function buildStaffRoleDayDesk(input: {
  seatKey: StationSeatKey;
  weekday: CtapLabWeekday;
  view?: StaffRoleDayView;
}): StaffRoleDayDesk {
  const view = input.view ?? 'today';
  const checklist = wallTemplatesForSeat(input.seatKey, input.weekday, view);
  if (input.seatKey === 'kitchen_manager' || input.seatKey === 'line_cook') {
    checklist.push(...fryTemplatesForView(view));
  }
  if (input.seatKey === 'line_cook') {
    checklist.push(...LINE_COOK_TEMPLATES.filter((template) => templateFitsView(template, view)));
  }
  if (input.seatKey === 'pizza') {
    checklist.push(...PIZZA_LINE_TEMPLATES.filter((template) => templateFitsView(template, view)));
  }
  if (input.seatKey === 'dishwasher') {
    checklist.push(...DISH_TEMPLATES.filter((template) => templateFitsView(template, view)));
  }
  if (input.seatKey === 'kitchen_manager') {
    checklist.push(...ORDER_PATH_TEMPLATES.filter((template) => template.roleKey === 'kitchen_manager' && templateFitsView(template, view)));
  }
  if (input.seatKey === 'driver') {
    checklist.push(...ORDER_PATH_TEMPLATES.filter((template) => template.roleKey === 'driver' && templateFitsView(template, view)));
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
    scheduleBoard: scheduleBoardForSeat(input.seatKey, input.weekday),
    comms: commsForSeat(input.seatKey),
    extras: extrasForSeat(input.seatKey, input.weekday, view),
    boundary: {
      livePayroll: false,
      livePurchaseOrders: false,
      liveWeeklyDollars: false,
      inventedRecipeBook: false,
      autoEmail: false,
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

export function staffDeskContainsActionShiftJargon(value: unknown): boolean {
  return /action\s*shift/i.test(JSON.stringify(value));
}

export const STAFF_ROLE_DAY_WEEKDAYS = CTAP_LAB_WEEKDAYS;
