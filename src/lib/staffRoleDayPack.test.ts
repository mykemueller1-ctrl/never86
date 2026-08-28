import { describe, expect, it } from 'vitest';
import { CTAP_LAB_WEEKDAYS } from './ctapLabPack';
import { STATION_SEAT_KEYS } from './staffSeatAuth';
import {
  ORDER_PATH_FULL,
  ORDER_PATH_LINE,
  STAFF_ROLE_DAY_PACK_STATUS,
  STAFF_ROLE_DAY_POLICIES,
  STAFF_STATION_COMMS,
  buildAllStaffRoleDayDesks,
  buildStaffRoleDayDesk,
  findStaffRoleDayPrivacyHits,
  staffDeskContainsActionShiftJargon,
  storeWeekdayToday,
} from './staffRoleDayPack';

function instructions(desk: ReturnType<typeof buildStaffRoleDayDesk>): string {
  return [
    ...desk.checklist.flatMap((template) => template.steps.map((step) => step.instruction)),
    ...desk.extras,
    ...desk.policies.flatMap((policy) => policy.rules),
    ...desk.scheduleBoard.flatMap((rule) => rule.rules),
    ...desk.comms.map((comm) => comm.rule),
  ].join('\n');
}

function templateIds(desk: ReturnType<typeof buildStaffRoleDayDesk>): string[] {
  return desk.checklist.map((template) => template.id);
}

describe('staff deep-seat desk pack', () => {
  it('builds a weekday pack for every station seat including pizza, line cook, and dish', () => {
    const monday = buildAllStaffRoleDayDesks('Monday');
    expect(monday.map((desk) => desk.seatKey)).toEqual([...STATION_SEAT_KEYS]);
    expect(STATION_SEAT_KEYS).toEqual(expect.arrayContaining([
      'owner',
      'foh_manager',
      'kitchen_manager',
      'bartender',
      'server',
      'prep',
      'driver',
      'line_cook',
      'pizza',
      'dishwasher',
    ]));
    expect(monday.every((desk) => desk.status === STAFF_ROLE_DAY_PACK_STATUS)).toBe(true);
    expect(monday.every((desk) => desk.boundary.inventedRecipeBook === false)).toBe(true);
    expect(monday.every((desk) => desk.boundary.autoEmail === false)).toBe(true);
  });

  it('keeps Kenzy FOH-only: no kitchen make-time, no driver board, no dispatch', () => {
    const kenzy = buildStaffRoleDayDesk({ seatKey: 'foh_manager', weekday: 'Wednesday' });
    const text = instructions(kenzy);
    expect(kenzy.comms.map((comm) => comm.stationName)).toEqual(['Kenzy']);
    expect(text).toContain('FOH only');
    expect(text).toContain('Not kitchen make-time. Not the driver board.');
    expect(text).toContain('Dining / back room coverage is Tuesday–Sunday. Never Monday.');
    expect(text).not.toContain(ORDER_PATH_FULL);
    expect(text).not.toContain('ask dispatch first');
    expect(text).not.toContain('11:00–13:00');
    expect(text).not.toContain('2 line, 1 pizza');
    expect(text).not.toContain('Deposit before close');
    expect(text).not.toContain('driver late');
    expect(kenzy.scheduleBoard.some((rule) => rule.id === 'weekday-driver-11-1')).toBe(false);
    expect(kenzy.stationLabel).toBe('FOH manager station');
  });

  it('gives FOH manager pour/POS, buckets, cadence, and coverage without drawer or drivers', () => {
    const monday = buildStaffRoleDayDesk({ seatKey: 'foh_manager', weekday: 'Monday' });
    const tuesday = buildStaffRoleDayDesk({ seatKey: 'foh_manager', weekday: 'Tuesday' });
    const text = instructions(monday);
    expect(templateIds(monday)).toEqual(expect.arrayContaining([
      'foh-manager-open',
      'foh-manager-close',
      'foh-manager-weekly',
      'bar-open-monday',
      'bar-close-monday',
      'waitstaff-open-monday',
      'waitstaff-close-monday',
    ]));
    expect(text).toContain('Stock walk in');
    expect(text).not.toMatch(/Beer comes today/);
    expect(text).toContain('Mixed drinks go in the pilsner');
    expect(text).toContain('Hy-Vee');
    expect(instructions(tuesday)).toMatch(/Beer comes today/);
    expect(instructions(tuesday)).toMatch(/Humes/);
  });

  it('gives Tom kitchen + drivers, unnamed 11-1 slot, board counts, and dispatch-first late on Z', () => {
    const desk = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Wednesday' });
    const text = instructions(desk);
    expect(templateIds(desk)).toEqual(expect.arrayContaining([
      'kitchen-manager-open',
      'kitchen-manager-close',
      'kitchen-manager-weekly',
      'prep-open',
      'fry-open',
      'fry-close',
      'kitchen-order-path',
    ]));
    expect(templateIds(desk)).not.toContain('driver-between-runs');
    expect(desk.comms.map((comm) => comm.stationName)).toEqual(['Tom']);
    expect(text).toContain(ORDER_PATH_FULL);
    expect(text).toContain('Late on Z: ask dispatch first.');
    expect(text).toContain('Do not restaff off a missed button.');
    expect(text).toContain('Weekdays 11:00–13:00 driver slot exists. No name on this desk.');
    expect(text).toContain('3 pizza, 2 line, 2 drivers + dish.');
    expect(text).toContain('Put dough away by 3pm');
    expect(text).not.toContain('names the driver');
    expect(text).not.toContain('Promise time');
    expect(text).not.toContain('Between runs, dishes are the side work');
    expect(desk.stationLabel).toBe('Kitchen manager station');
  });

  it('posts Tom board counts by weekday without inventing roster names', () => {
    const monday = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Monday' });
    const thursday = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Thursday' });
    const friday = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Friday' });
    const saturday = buildStaffRoleDayDesk({ seatKey: 'driver', weekday: 'Saturday' });
    const sunday = buildStaffRoleDayDesk({ seatKey: 'driver', weekday: 'Sunday' });
    expect(instructions(monday)).toContain('AM: 2 line, 1 pizza.');
    expect(instructions(monday)).toContain('Night: 3 pizza, 2 line, 2 drivers.');
    expect(instructions(thursday)).toContain('4 pizza, 2 line, dish, 2 drivers.');
    expect(instructions(friday)).toContain('Day: 2 fry/line, 2 pizza, 1 driver.');
    expect(instructions(friday)).toContain('Night: 5 pizza, 3 line, dish, 3 drivers.');
    expect(instructions(saturday)).toContain('Night: 5 pizza, 3 line, dish, 3 drivers.');
    expect(instructions(saturday)).toContain('Friday and Saturday night: 3 drivers.');
    expect(instructions(sunday)).toContain('4 pizza, 2 line, 2 drivers only if good.');
    expect(instructions(sunday)).toContain('Sunday till 6 is open.');
    expect(monday.scheduleBoard.some((rule) => rule.id === 'weekday-driver-11-1')).toBe(true);
    expect(friday.scheduleBoard.some((rule) => rule.id === 'fri-sat-night')).toBe(true);
    expect(sunday.scheduleBoard.some((rule) => rule.id === 'sunday-board')).toBe(true);
  });

  it('gives Myke drawer and bank: deposit before close, unentered not shortage, not driver late', () => {
    const myke = buildStaffRoleDayDesk({ seatKey: 'owner', weekday: 'Friday' });
    const text = instructions(myke);
    expect(myke.comms.map((comm) => comm.stationName)).toEqual(['Myke']);
    expect(text).toContain('Drawer and bank');
    expect(text).toContain('Deposit before close');
    expect(text).toContain('A $0 actual plus a counted drawer is unentered, not a shortage, and not driver late.');
    expect(text).not.toContain('11:00–13:00');
    expect(text).not.toContain('ask dispatch first');
    expect(text).not.toContain(ORDER_PATH_FULL);
    expect(myke.scheduleBoard).toEqual([]);
  });

  it('routes station comms: Kenzy front, Tom back, Myke dollars, in-app only', () => {
    expect(STAFF_STATION_COMMS.map((comm) => `${comm.channel}:${comm.stationName}:${comm.delivery}:${comm.mailSent}`)).toEqual([
      'front:Kenzy:in_app_note:false',
      'back:Tom:in_app_note:false',
      'dollars:Myke:in_app_note:false',
    ]);
    const blob = JSON.stringify(STAFF_STATION_COMMS);
    expect(blob).not.toMatch(/facebook|@|PIN/i);
  });

  it('keeps bartender, server, and prep on their station card without driver board', () => {
    const bartender = buildStaffRoleDayDesk({ seatKey: 'bartender', weekday: 'Friday' });
    const server = buildStaffRoleDayDesk({ seatKey: 'server', weekday: 'Wednesday' });
    const prep = buildStaffRoleDayDesk({ seatKey: 'prep', weekday: 'Monday' });

    expect(templateIds(bartender).every((id) => id.startsWith('bar-'))).toBe(true);
    expect(instructions(bartender)).toMatch(/Cut fruit\/extra for weekend/);
    expect(instructions(bartender)).not.toContain('Turn pizza ovens off');
    expect(instructions(bartender)).not.toContain('Dining / back room coverage');
    expect(instructions(bartender)).not.toContain('ask dispatch first');

    expect(templateIds(server)).toEqual(['waitstaff-open-wednesday', 'waitstaff-close-wednesday']);
    expect(instructions(server)).toMatch(/Buff floors/);
    expect(instructions(server)).not.toContain('Stock walk in (Beer comes today)');

    expect(templateIds(prep)).toEqual(['prep-open']);
    expect(instructions(prep)).toContain('Put dough away by 3pm');
    expect(instructions(prep)).not.toContain('Wash & clean under all mats');
  });

  it('gives driver the ticket-driver-area-dispatch path, not bag-as-cue or between-runs dishes', () => {
    const driver = buildStaffRoleDayDesk({ seatKey: 'driver', weekday: 'Saturday' });
    expect(templateIds(driver)).toEqual(['driver-order-path']);
    expect(instructions(driver)).toContain(ORDER_PATH_FULL);
    expect(instructions(driver)).not.toContain('Between runs, dishes are the side work');
    expect(instructions(driver)).not.toContain('Promise time');
    expect(instructions(driver)).not.toMatch(/Action Shift/i);
  });

  it('gives pizza, line cook, and dishwasher ticket-driver-area copy', () => {
    const pizza = buildStaffRoleDayDesk({ seatKey: 'pizza', weekday: 'Saturday' });
    const line = buildStaffRoleDayDesk({ seatKey: 'line_cook', weekday: 'Thursday' });
    const dish = buildStaffRoleDayDesk({ seatKey: 'dishwasher', weekday: 'Monday' });

    expect(templateIds(pizza)).toEqual(expect.arrayContaining([
      'foh-pizza-open-saturday',
      'pizza-line-open',
      'pizza-line-close',
    ]));
    expect(instructions(pizza)).toContain('Turn pizza ovens off');
    expect(instructions(pizza)).toContain(ORDER_PATH_FULL);
    expect(instructions(pizza)).not.toContain('Wash & clean under all mats');

    expect(templateIds(line)).toEqual(expect.arrayContaining([
      'fry-open',
      'fry-close',
      'line-cook-open',
      'line-cook-close',
    ]));
    expect(instructions(line)).toContain(ORDER_PATH_LINE);
    expect(instructions(line)).toContain('Do not hold the second lunch ticket.');
    expect(instructions(line)).toContain('Confirm fryer oil is at the mark');
    expect(instructions(line)).not.toContain('Stock walk in (Beer comes today)');
    expect(instructions(line)).not.toContain('names the driver');

    expect(templateIds(dish)).toEqual(['dish-open', 'dish-mid', 'dish-close']);
    expect(instructions(dish)).toContain('Dishes between runs');
    expect(instructions(dish)).toContain('Delivery dishes come in. Do not go to the lot.');
    expect(instructions(dish)).toContain('Not the lot.');
    expect(instructions(dish)).not.toContain('ask dispatch first');
    expect(instructions(dish)).not.toContain('Promise time');
  });

  it('splits fry AM and PM and does not invent a recipe book', () => {
    const am = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Thursday', view: 'open' });
    const pm = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Thursday', view: 'close' });
    expect(templateIds(am)).toContain('fry-open');
    expect(templateIds(am)).not.toContain('fry-close');
    expect(templateIds(pm)).toContain('fry-close');
    expect(templateIds(pm)).not.toContain('fry-open');
    const blob = JSON.stringify(buildAllStaffRoleDayDesks('Friday'));
    expect(blob).not.toMatch(/1\/3 lb|8 oz dough|Braveheart|Hormel/i);
    expect(blob).toMatch(/does not invent a recipe book/);
  });

  it('treats cooked food as promo not void and stores cost bands as policy percents', () => {
    const voidPolicy = STAFF_ROLE_DAY_POLICIES.find((policy) => policy.id === 'void-vs-promo');
    const bands = STAFF_ROLE_DAY_POLICIES.find((policy) => policy.id === 'cost-bands');
    expect(voidPolicy?.rules.join('\n')).toMatch(/Cooked food is a promo, not a void/);
    expect(bands?.moneyKind).toBe('percent_band');
    expect(bands?.rules.join('\n')).toMatch(/food: 28–30%/);
    expect(bands?.rules.join('\n')).not.toMatch(/\$\d+\/week/);
  });

  it('defaults the desk weekday to today in the store timezone', () => {
    expect(CTAP_LAB_WEEKDAYS).toContain(storeWeekdayToday(new Date('2026-08-28T18:00:00.000Z')));
  });

  it('keeps fake roster names, emails, PINs, Action Shift jargon, and weekly-dollar bonuses out of staff screens', () => {
    const desks = CTAP_LAB_WEEKDAYS.flatMap((weekday) => buildAllStaffRoleDayDesks(weekday));
    expect(findStaffRoleDayPrivacyHits(desks)).toEqual([]);
    expect(findStaffRoleDayPrivacyHits(STAFF_ROLE_DAY_POLICIES)).toEqual([]);
    expect(staffDeskContainsActionShiftJargon(desks)).toBe(false);
    const blob = JSON.stringify(desks);
    expect(blob).not.toMatch(/karlee|sturtz|ashley|holding/i);
    expect(blob).not.toMatch(/names the driver/);
    expect(blob).not.toMatch(/@/);
    expect(blob).not.toMatch(/\bPIN\b/i);
    expect(blob).not.toMatch(/Action Shift/i);
    expect(blob).toMatch(/Kenzy/);
    expect(blob).toMatch(/Tom/);
    expect(blob).toMatch(/Myke/);
    expect(blob).toMatch(/Ticket out of the printer, bag and tag, driver area/);
  });
});
