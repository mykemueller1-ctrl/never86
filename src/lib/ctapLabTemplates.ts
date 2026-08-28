import type { ActionShiftRoleKey } from './actionShiftSetup';

export const CTAP_LAB_WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type CtapLabWeekday = (typeof CTAP_LAB_WEEKDAYS)[number];
export type CtapLabShiftPhase = 'open' | 'mid' | 'close' | 'weekly';
export type CtapLabSource =
  | 'manager-expectations'
  | 'waitstaff-mon-sun'
  | 'bar-open-close'
  | 'kitchen-open-close'
  | 'driver-between-runs';

export type CtapLabStep = {
  instruction: string;
  group: string;
  required: boolean;
};

export type CtapLabTemplate = {
  id: string;
  name: string;
  roleKey: ActionShiftRoleKey;
  stationKey: string;
  shiftPhase: CtapLabShiftPhase;
  weekday: CtapLabWeekday | null;
  source: CtapLabSource;
  steps: readonly CtapLabStep[];
};

type StepInput = readonly [instruction: string, group: string];

function steps(rows: readonly StepInput[]): CtapLabStep[] {
  return rows.map(([instruction, group]) => ({ instruction, group, required: true }));
}

function template(input: Omit<CtapLabTemplate, 'steps'> & { steps: readonly StepInput[] }): CtapLabTemplate {
  return { ...input, steps: steps(input.steps) };
}

const AM_WAITSTAFF: StepInput[] = [
  ['Silverware', 'Prep'],
  ['Make sure all tables are completely wiped off', 'Cleaning'],
  ['Trashes/cans', 'Cleaning'],
  ['Help fill coolers/walk in', 'Stocking'],
  ['Restock any items that are low', 'Stocking'],
  ['Explain all table transfers and tabs', 'Handoff'],
];

const AM_BARTENDER_BASE: StepInput[] = [
  ['Get out all condiments on both sides', 'Setup'],
  ['Get bus tub/silverware tub ready', 'Setup'],
  ['Make pitchers of water', 'Prep'],
  ['Stock coolers/overstock', 'Stocking'],
  ['Fill ice', 'Ice'],
  ['Trashes/Cans', 'Cleaning'],
  ['Fill kids cups/lids/straws/plastic cups', 'Stocking'],
  ['Empty slop bucket in kitchen', 'Cleaning'],
  ['Deposit', 'Cash'],
];

const AM_BARTENDER_MON: StepInput[] = [
  ['Get out all condiments on both sides', 'Setup'],
  ['Get bus tub/silverware tub ready', 'Setup'],
  ['Make pitchers of water', 'Prep'],
  ['Stock walk in', 'Stocking'],
  ['Stock coolers/overstock', 'Stocking'],
  ['Fill ice', 'Ice'],
  ['Trashes/Cans', 'Cleaning'],
  ['Fill kids cups/lids/straws/plastic cups', 'Stocking'],
  ['Empty slop bucket in kitchen', 'Cleaning'],
  ['Deposit', 'Cash'],
];

const AM_BARTENDER_BEER_DAY: StepInput[] = [
  ['Get out all condiments on both sides', 'Setup'],
  ['Get bus tub/silverware tub ready', 'Setup'],
  ['Make pitchers of water', 'Prep'],
  ['Stock walk in (Beer comes today)', 'Stocking'],
  ['Stock coolers/overstock', 'Stocking'],
  ['Fill ice', 'Ice'],
  ['Trashes/Cans', 'Cleaning'],
  ['Fill kids cups/lids/straws/plastic cups', 'Stocking'],
  ['Empty slop bucket in kitchen', 'Cleaning'],
  ['Deposit', 'Cash'],
];

const AM_BARTENDER_FRI: StepInput[] = [
  ['Get out all condiments on both sides', 'Setup'],
  ['Get bus tub/silverware tub ready', 'Setup'],
  ['Make pitchers of water', 'Prep'],
  ['Stock walk in (Beer comes today)', 'Stocking'],
  ['Cut fruit/extra for weekend', 'Prep'],
  ['Stock coolers/overstock', 'Stocking'],
  ['Fill ice', 'Ice'],
  ['Trashes/Cans', 'Cleaning'],
  ['Get extra mixers for barside', 'Stocking'],
  ['Fill kids cups/lids/straws/plastic cups', 'Stocking'],
  ['Empty slop bucket in kitchen', 'Cleaning'],
  ['Deposit', 'Cash'],
];

const AM_BARTENDER_WEEKEND: StepInput[] = [
  ['Get out all condiments on both sides', 'Setup'],
  ['Get bus tub/silverware tub ready', 'Setup'],
  ['Make pitchers of water', 'Prep'],
  ['Stock coolers/overstock', 'Stocking'],
  ['Fill ice', 'Ice'],
  ['Trashes/Cans', 'Cleaning'],
  ['Empty slop bucket in kitchen', 'Cleaning'],
  ['Deposit', 'Cash'],
];

const PM_BARTENDER: StepInput[] = [
  ['Wash & clean under all mats', 'Bar Cleaning'],
  ['Wash waitress only and yuengling mats', 'Bar Cleaning'],
  ['Clean tops of wells and underneath liquor bottles', 'Bar Cleaning'],
  ['Stock coolers', 'Stocking'],
  ['Stock pop', 'Stocking'],
  ['Stock walk in', 'Stocking'],
  ['Dump Slop bucket & wash', 'Cleaning'],
  ['Fill ice', 'Ice'],
  ['Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)', 'Bathrooms'],
  ['Take out trashes behind bar & waitress/refill liners/cans', 'Trash'],
  ['Lock all doors', 'Security'],
  ['Close out all computers', 'Closing'],
  ['Turn off tvs/speaker down', 'Closing'],
  ['Deposit/A.M. & P.M. kitchen tips', 'Cash'],
  ['Make sure all doors are locked, air is right, set alarm', 'Security'],
];

const PM_BARTENDER_MON: StepInput[] = [
  ['Wash & clean under all mats', 'Bar Cleaning'],
  ['Wash waitress only and yuengling mats', 'Bar Cleaning'],
  ['Clean tops of wells and underneath liquor bottles', 'Bar Cleaning'],
  ['Stock coolers', 'Stocking'],
  ['Stock pop', 'Stocking'],
  ['Stock walk in', 'Stocking'],
  ['Dump Slop bucket & wash', 'Cleaning'],
  ['Fill ice', 'Ice'],
  ['Fill ice in kitchen', 'Ice'],
  ['Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)', 'Bathrooms'],
  ['Take out trashes behind bar & waitress/refill liners/cans', 'Trash'],
  ['Lock all doors', 'Security'],
  ['Close out all computers', 'Closing'],
  ['Turn off tvs/speaker down', 'Closing'],
  ['Deposit/A.M. & P.M. kitchen tips', 'Cash'],
  ['Make sure all doors are locked, air is right, set alarm', 'Security'],
];

const PM_WAITSTAFF_DEFAULT: StepInput[] = [
  ['Fill & clean BBQ sauce caddies', 'Condiments'],
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Fill parmesan containers', 'Condiments'],
  ['Fill napkin holders', 'Stocking'],
  ['Silverware', 'Prep'],
  ['Fill ice', 'Ice'],
  ['Wipe off pop machine and make sure cups and straws are stocked', 'Stocking'],
  ['Check all fountain pop and replace all empty/almost empty', 'Stocking'],
  ['Windex doors/turn off tvs/tables all wiped down', 'Cleaning'],
  ['Sweep', 'Floors'],
  ['Mop', 'Floors'],
  ['Checkout', 'Cash'],
];

const PM_WAITSTAFF_MON: StepInput[] = [
  ['Fill & clean BBQ sauce caddies', 'Condiments'],
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Fill parmesan containers', 'Condiments'],
  ['Silverware', 'Prep'],
  ['Fill ice', 'Ice'],
  ['Wipe off pop machine and make sure cups and straws are stocked', 'Stocking'],
  ['Check all fountain pop and replace all empty/almost empty', 'Stocking'],
  ['Windex doors/turn off tvs/tables all wiped down', 'Cleaning'],
  ['Sweep', 'Floors'],
  ['Mop', 'Floors'],
  ['Checkout', 'Cash'],
];

const PM_WAITSTAFF_BUFF: StepInput[] = [
  ['Fill & clean BBQ sauce caddies', 'Condiments'],
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Fill parmesan containers', 'Condiments'],
  ['Fill napkin holders', 'Stocking'],
  ['Silverware', 'Prep'],
  ['Fill large & small togo boxes', 'Stocking'],
  ['Clean coffee machine, refill bags, sugar & sugar packets, extra water pitchers', 'Coffee Station'],
  ['Wipe off bus tub cart', 'Cleaning'],
  ['Put up chairs & sweep', 'Floors'],
  ['Mop and put stools down once dry', 'Floors'],
  ['Buff floors', 'Floors'],
];

const PM_WAITSTAFF_FRI: StepInput[] = [
  ['Fill & clean BBQ sauce caddies', 'Condiments'],
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Fill parmesan containers', 'Condiments'],
  ['Fill napkin holders', 'Stocking'],
  ['Silverware', 'Prep'],
  ['Fill large & small togo boxes', 'Stocking'],
  ['Clean coffee machine, refill bags, sugar & sugar packets, extra water pitchers', 'Coffee Station'],
  ['Wipe off bus tub cart', 'Cleaning'],
  ['Put up chairs & sweep', 'Floors'],
  ['Mop and put stools down once dry', 'Floors'],
];

const PM_WAITSTAFF_SAT: StepInput[] = [
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Fill Parmesan containers', 'Condiments'],
  ['Fill red pepperflake containers', 'Condiments'],
  ['Fill napkin holders', 'Stocking'],
  ['Silverware', 'Prep'],
  ['Wipe off bus tub cart', 'Cleaning'],
  ['Clean coffee machine, refill bags, sugar & sugar packets, extra water pitchers', 'Coffee Station'],
  ['Windex doors/turn off tvs/tables all wiped down', 'Cleaning'],
  ['Put up chairs & sweep', 'Floors'],
  ['Mop and put stools down once dry', 'Floors'],
];

const PM_WAITSTAFF_SUN: StepInput[] = [
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Empty, clean, and refill parmesan containers', 'Condiments'],
  ['Silverware', 'Prep'],
  ['Wipe off bus tub cart', 'Cleaning'],
  ['Put up chairs & sweep', 'Floors'],
  ['Mop', 'Floors'],
  ['Buff floors & put down stools', 'Floors'],
];

const PIZZA_SIDE_AM: StepInput[] = [
  ['Fill ice', 'Ice'],
  ['Silverware', 'Prep'],
  ['Check fountain pop', 'Stocking'],
  ['Fill any depleted items', 'Stocking'],
];

const PIZZA_SIDE_PM_DEFAULT: StepInput[] = PM_WAITSTAFF_DEFAULT;

const PIZZA_SIDE_PM_FRI: StepInput[] = [
  ['Fill & clean BBQ sauce caddies', 'Condiments'],
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Fill parmesan containers', 'Condiments'],
  ['Fill napkin holders', 'Stocking'],
  ['Fill large & small togo boxes', 'Stocking'],
  ['Silverware', 'Prep'],
  ['Fill ice', 'Ice'],
  ['Wipe off pop machine and make sure cups and straws are stocked', 'Stocking'],
  ['Windex doors/turn off tvs/tables all wiped down', 'Cleaning'],
  ['Sweep', 'Floors'],
  ['Mop', 'Floors'],
  ['Checkout', 'Cash'],
];

const PIZZA_SIDE_PM_SAT: StepInput[] = [
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Fill parmesan containers', 'Condiments'],
  ['Fill red pepperflake containers', 'Condiments'],
  ['Fill napkin holders', 'Stocking'],
  ['Take apart pop machine, run through dishwasher, & soak tabs', 'Deep Clean'],
  ['Silverware', 'Prep'],
  ['Fill ice', 'Ice'],
  ['Make sure cups and straws are stocked', 'Stocking'],
  ['Sweep', 'Floors'],
  ['Mop', 'Floors'],
  ['Checkout', 'Cash'],
];

const PIZZA_SIDE_PM_SUN: StepInput[] = [
  ['Marry all ketchup & mustard', 'Condiments'],
  ['Empty & clean parmesan containers (Start old Parm)', 'Condiments'],
  ['Silverware', 'Prep'],
  ['Wipe off pop machine and make sure cups and straws are stocked', 'Stocking'],
  ['Check all fountain pop and replace all empty/almost empty', 'Stocking'],
  ['Windex doors/turn off tvs/tables all wiped down', 'Cleaning'],
  ['Sweep', 'Floors'],
  ['Mop', 'Floors'],
  ['Checkout', 'Cash'],
];

const AM_BARTENDER_BY_DAY: Record<CtapLabWeekday, StepInput[]> = {
  Monday: AM_BARTENDER_MON,
  Tuesday: AM_BARTENDER_BEER_DAY,
  Wednesday: AM_BARTENDER_BASE,
  Thursday: AM_BARTENDER_BASE,
  Friday: AM_BARTENDER_FRI,
  Saturday: AM_BARTENDER_WEEKEND,
  Sunday: AM_BARTENDER_WEEKEND,
};

const PM_BARTENDER_BY_DAY: Record<CtapLabWeekday, StepInput[]> = {
  Monday: PM_BARTENDER_MON,
  Tuesday: PM_BARTENDER,
  Wednesday: PM_BARTENDER,
  Thursday: PM_BARTENDER,
  Friday: PM_BARTENDER,
  Saturday: PM_BARTENDER,
  Sunday: PM_BARTENDER,
};

const PM_WAITSTAFF_BY_DAY: Record<CtapLabWeekday, StepInput[]> = {
  Monday: PM_WAITSTAFF_MON,
  Tuesday: PM_WAITSTAFF_DEFAULT,
  Wednesday: PM_WAITSTAFF_BUFF,
  Thursday: PM_WAITSTAFF_DEFAULT,
  Friday: PM_WAITSTAFF_FRI,
  Saturday: PM_WAITSTAFF_SAT,
  Sunday: PM_WAITSTAFF_SUN,
};

const PIZZA_SIDE_PM_BY_DAY: Partial<Record<CtapLabWeekday, StepInput[]>> = {
  Tuesday: PIZZA_SIDE_PM_DEFAULT,
  Wednesday: PIZZA_SIDE_PM_DEFAULT,
  Thursday: PIZZA_SIDE_PM_DEFAULT,
  Friday: PIZZA_SIDE_PM_FRI,
  Saturday: PIZZA_SIDE_PM_SAT,
  Sunday: PIZZA_SIDE_PM_SUN,
};

function dayTemplates(): CtapLabTemplate[] {
  const out: CtapLabTemplate[] = [];
  for (const weekday of CTAP_LAB_WEEKDAYS) {
    const short = weekday.slice(0, 3);
    out.push(
      template({
        id: `bar-open-${weekday.toLowerCase()}`,
        name: `Bar — ${short} AM Bartender`,
        roleKey: 'bartender',
        stationKey: 'bar',
        shiftPhase: 'open',
        weekday,
        source: 'bar-open-close',
        steps: AM_BARTENDER_BY_DAY[weekday],
      }),
      template({
        id: `bar-close-${weekday.toLowerCase()}`,
        name: `Bar — ${short} PM Bartender`,
        roleKey: 'bartender',
        stationKey: 'bar',
        shiftPhase: 'close',
        weekday,
        source: 'bar-open-close',
        steps: PM_BARTENDER_BY_DAY[weekday],
      }),
      template({
        id: `waitstaff-open-${weekday.toLowerCase()}`,
        name: `Bar — ${short} AM Waitstaff`,
        roleKey: 'server',
        stationKey: 'dining',
        shiftPhase: 'open',
        weekday,
        source: 'waitstaff-mon-sun',
        steps: AM_WAITSTAFF,
      }),
      template({
        id: `waitstaff-close-${weekday.toLowerCase()}`,
        name: weekday === 'Wednesday' || weekday === 'Sunday'
          ? `Bar — ${short} PM Waitstaff (Buff Night)`
          : `Bar — ${short} PM Waitstaff`,
        roleKey: 'server',
        stationKey: 'dining',
        shiftPhase: 'close',
        weekday,
        source: 'waitstaff-mon-sun',
        steps: PM_WAITSTAFF_BY_DAY[weekday],
      }),
    );
    if (weekday === 'Saturday' || weekday === 'Sunday') {
      out.push(template({
        id: `foh-pizza-open-${weekday.toLowerCase()}`,
        name: `FOH Pizza Side — ${short} AM Opening`,
        roleKey: 'manager',
        stationKey: 'pizza_side',
        shiftPhase: 'open',
        weekday,
        source: 'waitstaff-mon-sun',
        steps: PIZZA_SIDE_AM,
      }));
    }
    const pizzaClose = PIZZA_SIDE_PM_BY_DAY[weekday];
    if (pizzaClose) {
      out.push(template({
        id: `foh-pizza-close-${weekday.toLowerCase()}`,
        name: `FOH Pizza Side — ${short} PM Closing`,
        roleKey: 'manager',
        stationKey: 'pizza_side',
        shiftPhase: 'close',
        weekday,
        source: 'waitstaff-mon-sun',
        steps: pizzaClose,
      }));
    }
  }
  return out;
}

export const CTAP_LAB_TEMPLATES: readonly CtapLabTemplate[] = [
  template({
    id: 'owner-open',
    name: 'Owner — morning approve',
    roleKey: 'owner',
    stationKey: 'owner_desk',
    shiftPhase: 'open',
    weekday: null,
    source: 'manager-expectations',
    steps: [
      ['Approve the ranked actions, owners, targets, and evidence boundary', 'Approve'],
      ['Confirm FOH Manager and Kitchen Manager station coverage', 'Stations'],
      ['Review COGS against policy constants only — food 28-30 / beer 22-25 / liquor 18-20. No live weekly dollars', 'Policy'],
      ['Confirm vendor cadence owners for today (schedule rules, not live POs)', 'Vendors'],
    ],
  }),
  template({
    id: 'owner-close',
    name: 'Owner — night exceptions',
    roleKey: 'owner',
    stationKey: 'owner_desk',
    shiftPhase: 'close',
    weekday: null,
    source: 'manager-expectations',
    steps: [
      ['Review exceptions, missing evidence, and tomorrow owner', 'Night'],
      ['Do not close the week from an incomplete night or a verbal yes', 'Truth gate'],
    ],
  }),
  template({
    id: 'foh-manager-open',
    name: 'FOH Manager — open',
    roleKey: 'manager',
    stationKey: 'bar_side',
    shiftPhase: 'open',
    weekday: null,
    source: 'manager-expectations',
    steps: [
      ['Review FOH staffing, callouts, and posted station assignments', 'Open'],
      ['Confirm beer, liquor, and pop order/receive owners for the weekday cadence', 'Vendors'],
      ['Confirm FOH training and ServeSafe coverage on the manager station', 'Training'],
      ['Walk dining and bar stations before first ticket', 'Stations'],
    ],
  }),
  template({
    id: 'foh-manager-close',
    name: 'FOH Manager — closing expectations',
    roleKey: 'manager',
    stationKey: 'bar_side',
    shiftPhase: 'close',
    weekday: null,
    source: 'manager-expectations',
    steps: [
      ['Be the LAST one to punch out at end of night', 'Protocol'],
      ['Walk through and check all closers before they leave', 'Verification'],
      ['Walk through again before you leave for the night', 'Verification'],
      ['Make sure no one else is in the building', 'Security'],
      ['Arm the alarm (except Sun & Wed when FOH buffs floors)', 'Security'],
      ['Verify all doors are locked before leaving', 'Security'],
    ],
  }),
  template({
    id: 'foh-manager-weekly',
    name: 'FOH Manager — weekly station duties',
    roleKey: 'manager',
    stationKey: 'bar_side',
    shiftPhase: 'weekly',
    weekday: null,
    source: 'manager-expectations',
    steps: [
      ['Post the FOH schedule and station assignments', 'Schedule'],
      ['Complete monthly liquor, beer, wine, and pop inventories', 'Inventory'],
      ['Keep drink specials current and book at least one live band per month', 'Programming'],
      ['Complete FOH new-hire W-2 / W-4 packet (forms only — no employee files in Git)', 'Hiring'],
      ['Collect FOH training and ServeSafe proof on the manager station', 'Training'],
      ['Give input on specials, promotions, and marketing — do not auto-post', 'Marketing'],
    ],
  }),
  template({
    id: 'kitchen-manager-open',
    name: 'Kitchen Manager — open',
    roleKey: 'kitchen_manager',
    stationKey: 'kitchen',
    shiftPhase: 'open',
    weekday: null,
    source: 'manager-expectations',
    steps: [
      ['Temperatures, prep plan, pars, and vendor exceptions', 'Open'],
      ['Communicate job expectations and station assignments', 'Staff'],
      ['Confirm product rotation on the line and in storage', 'Rotation'],
      ['Confirm prep procedures match the morning pizza prep list', 'Prep'],
    ],
  }),
  template({
    id: 'kitchen-manager-close',
    name: 'Kitchen — nightly close (initialed)',
    roleKey: 'kitchen_manager',
    stationKey: 'kitchen',
    shiftPhase: 'close',
    weekday: null,
    source: 'kitchen-open-close',
    steps: [
      ['Put dough away', 'Dough'],
      ['Clean Dough roller', 'Equipment'],
      ['Wipe out inside of cold table', 'Cleaning'],
      ['Wipe down lids, doors and cold table', 'Cleaning'],
      ['Stainless steel the dough wall', 'Cleaning'],
      ['Stainless steel the prep table', 'Cleaning'],
      ['Cover all dough', 'Dough'],
      ['Take all utensils back to dish area', 'Dishes'],
      ['Wipe down pizza table', 'Cleaning'],
      ['Turn pizza ovens off', 'Equipment'],
      ['Put cheese away', 'Food Storage'],
      ['Windex both pepsi coolers', 'Cleaning'],
      ['Shut hoods off', 'Equipment'],
      ['Sweep and mop pizza side and store room', 'Floors'],
      ['Fill pepsi cooler with cheese', 'Stocking'],
      ['Bleach and scrub the sides of the trash can', 'Cleaning'],
      ['Fill all sauce bottles (Ranch, BBQ, WOW, 1000, Buffalo, SC)', 'Stocking'],
      ['Fill pepsi cooler with beef and sausage', 'Stocking'],
      ['Make sure pizza line is fully stocked up top', 'Stocking'],
      ['Pull out the pizza line and swipe behind it', 'Cleaning'],
      ['Wipe down shelves', 'Cleaning'],
      ['Put handhelds back on charger', 'Closing'],
      ['Clean computer screens and counter', 'Closing'],
    ],
  }),
  template({
    id: 'kitchen-manager-weekly',
    name: 'Kitchen Manager — weekly station duties',
    roleKey: 'kitchen_manager',
    stationKey: 'kitchen',
    shiftPhase: 'weekly',
    weekday: null,
    source: 'manager-expectations',
    steps: [
      ['Weekly product order from the cadence — schedule rule, not a live PO', 'Vendors'],
      ['Maintain labor plan and kitchen schedule without pasting payroll files', 'Labor'],
      ['Oversee new-hire kitchen training and retraining on new procedures', 'Training'],
      ['Maintain small wares, plates, utensils, and scheduled equipment maintenance', 'Equipment'],
      ['Hold food-cost and portion-control coaching to policy constants, not live weekly dollars', 'Policy'],
      ['Sunday: Change foil on stove', 'Deep Clean'],
      ['Monday: Deep freezer and dry storage', 'Deep Clean'],
      ['Tuesday: Deep clean steak fridge and BBQ fridge', 'Deep Clean'],
      ['Wednesday: Bleach wall behind steam table', 'Deep Clean'],
      ['Thursday: Run stove tops thru dishwasher', 'Deep Clean'],
      ['Friday: Clean up around smoker — dump bucket, sweep, clean the shelf and front', 'Deep Clean'],
      ['Saturday: Clean out bus tubs under charbroiler and seasoning shelf', 'Deep Clean'],
    ],
  }),
  template({
    id: 'prep-open',
    name: 'Kitchen — morning pizza prep',
    roleKey: 'prep_cook',
    stationKey: 'prep',
    shiftPhase: 'open',
    weekday: null,
    source: 'kitchen-open-close',
    steps: [
      ['Chopped onion (only half pan during week days)', 'Prep'],
      ['Chopped green peppers (only half pan week days)', 'Prep'],
      ['Sauce — 4 buckets all time is par', 'Prep'],
      ['Black olives', 'Prep'],
      ['Green olives', 'Prep'],
      ['Pineapple', 'Prep'],
      ['Sauerkraut', 'Prep'],
      ['Chopped pickles', 'Prep'],
      ['To go pickles portioned (6)', 'Prep'],
      ['Crab base', 'Prep'],
      ['Parm cheese (25 cups)', 'Condiments'],
      ['Red peppers (25 cups)', 'Condiments'],
      ['Taco sauce (25 cups)', 'Condiments'],
      ['Make sure to go boxes are filled', 'Stocking'],
      ['Fill sauce bottle', 'Stocking'],
      ['Dough must be all rolled before you leave', 'Dough'],
      ['Full taco sauce', 'Prep'],
      ['Fill taco chips', 'Prep'],
      ['Put dough away by 3pm', 'Dough'],
      ['Check dough before clocking out', 'Dough'],
      ['Clean pepsi cooler where dough goes', 'Cleaning'],
      ['Windex the glass', 'Cleaning'],
    ],
  }),
  template({
    id: 'driver-between-runs',
    name: 'Driver — between-runs dishes',
    roleKey: 'driver',
    stationKey: 'delivery',
    shiftPhase: 'mid',
    weekday: null,
    source: 'driver-between-runs',
    steps: [
      ['Between runs, dishes are the side work — not scrolling, not standing out back', 'Dishes'],
      ['Bring delivery dishes in, rinse, and put them in the dish pit', 'Dishes'],
      ['Do not leave dishes in the car, on the counter, or dumped and walked away from', 'Dishes'],
      ['Fill the driver sheet every shift if a cash reimbursement is expected. No sheet = no reimbursement', 'Proof'],
      ['Return inside immediately after a run and help the dish pit until the next ticket', 'Station'],
    ],
  }),
  ...dayTemplates(),
];
