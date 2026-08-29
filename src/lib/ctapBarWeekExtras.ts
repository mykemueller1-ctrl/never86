import type { CtapLabWeekday } from './ctapLabPack';
import type { StationSeatKey } from './staffSeatAuth';

/**
 * CTap bar-week day extras for the Schedule board.
 * Station slots only — never roster names. Not live payroll, POs, or mail.
 */
export const CTAP_BAR_WEEK_PACK_ID = 'ctap-bar-week-v1';
export const CTAP_BAR_WEEK_PACK_STATUS = 'drafted' as const;

export type CtapBarWeekStationSlot = 'bartender' | 'server' | 'pizza' | 'foh_manager';

export type CtapBarWeekExtra = {
  id: string;
  weekday: CtapLabWeekday;
  stationSlot: CtapBarWeekStationSlot;
  slotLabel: string;
  item: string;
  namedPerson: false;
  audience: readonly StationSeatKey[];
};

export const CTAP_BAR_WEEK_SHORT_LABEL: Record<CtapLabWeekday, string> = {
  Monday: 'pop/ice',
  Tuesday: 'beer-in + fruit',
  Wednesday: 'buff + no alarm',
  Thursday: 'towels/bloody/fountain',
  Friday: 'extra fruit/mixers/kids cups + BBQ',
  Saturday: 'pop machine soak',
  Sunday: 'parm + buff',
};

const SLOT_LABEL: Record<CtapBarWeekStationSlot, string> = {
  bartender: 'Bartender station slot',
  server: 'Server station slot',
  pizza: 'Pizza station slot',
  foh_manager: 'FOH lead desk slot',
};

const HOUSE_FOH: readonly StationSeatKey[] = ['owner', 'foh_manager', 'bartender', 'server'];

function extra(
  weekday: CtapLabWeekday,
  stationSlot: CtapBarWeekStationSlot,
  slug: string,
  item: string,
  audience: readonly StationSeatKey[] = HOUSE_FOH,
): CtapBarWeekExtra {
  return {
    id: `bar-week-${weekday.toLowerCase()}-${stationSlot}-${slug}`,
    weekday,
    stationSlot,
    slotLabel: SLOT_LABEL[stationSlot],
    item,
    namedPerson: false,
    audience,
  };
}

export const CTAP_BAR_WEEK_EXTRAS: readonly CtapBarWeekExtra[] = [
  extra('Monday', 'bartender', 'pop', 'Stock pop'),
  extra('Monday', 'bartender', 'ice', 'Fill ice at the bar and in kitchen'),
  extra(
    'Tuesday',
    'bartender',
    'beer-in',
    'Beer comes in — stock the walk-in. Schedule rule only, not a live purchase order.',
  ),
  extra('Tuesday', 'bartender', 'fruit', 'Cut fruit'),
  extra('Wednesday', 'server', 'buff', 'Buff floors'),
  extra(
    'Wednesday',
    'foh_manager',
    'no-alarm',
    'Do not arm the alarm — FOH front slot buffs floors.',
  ),
  extra('Thursday', 'bartender', 'towels', 'Restock bar towels'),
  extra(
    'Thursday',
    'bartender',
    'bloody',
    'Make Bloody Mary mix from the posted bar card. This desk does not invent a recipe.',
  ),
  extra('Thursday', 'server', 'fountain', 'Check fountain pop and replace empty/almost empty'),
  extra('Friday', 'bartender', 'fruit', 'Cut extra fruit for the weekend'),
  extra('Friday', 'bartender', 'mixers', 'Get extra mixers for barside'),
  extra('Friday', 'bartender', 'kids-cups', 'Fill kids cups, lids, straws, and plastic cups'),
  extra('Friday', 'server', 'bbq', 'Fill and clean BBQ sauce caddies'),
  extra(
    'Saturday',
    'pizza',
    'pop-soak',
    'Take apart pop machine, run through dishwasher, and soak tabs',
    ['owner', 'foh_manager', 'pizza', 'server'],
  ),
  extra('Sunday', 'server', 'parm', 'Empty, clean, and refill parmesan containers'),
  extra('Sunday', 'server', 'buff', 'Buff floors and put down stools'),
];

export function barWeekShortLabel(weekday: CtapLabWeekday): string {
  return CTAP_BAR_WEEK_SHORT_LABEL[weekday];
}

export function barWeekExtrasForWeekday(weekday: CtapLabWeekday): CtapBarWeekExtra[] {
  return CTAP_BAR_WEEK_EXTRAS.filter((row) => row.weekday === weekday);
}

export function barWeekExtrasForSeat(seatKey: StationSeatKey, weekday: CtapLabWeekday): CtapBarWeekExtra[] {
  return barWeekExtrasForWeekday(weekday).filter((row) => row.audience.includes(seatKey));
}
