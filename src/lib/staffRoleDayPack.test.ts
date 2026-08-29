import { describe, expect, it } from 'vitest';
import { CTAP_LAB_WEEKDAYS } from './ctapLabPack';
import { STATION_SEAT_KEYS } from './staffSeatAuth';
import {
  STAFF_ROLE_DAY_PACK_STATUS,
  STAFF_ROLE_DAY_POLICIES,
  STAFF_STATION_COMMS,
  buildAllStaffRoleDayDesks,
  buildStaffRoleDayDesk,
  findStaffRoleDayPrivacyHits,
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

describe('staff role-day desk pack', () => {
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
    expect(monday.every((desk) => desk.comms.map((comm) => comm.id).join(',') === 'front,back,dollars')).toBe(true);
  });

  it('gives FOH manager the bar whip, FOH Mon-Sun extras, pour/POS, deposit, order nights, and coverage', () => {
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
    expect(text).toContain('Deposit before close');
    expect(text).toContain('Dining / back room coverage is Tuesday–Sunday. Never Monday.');
    expect(text).toContain('Day Monday–Thursday: one person out front.');
    expect(text).toContain('Night: two out front + one back room.');
    expect(text).toContain('Mixed drinks go in the pilsner');
    expect(text).toContain('Hy-Vee');
    expect(instructions(tuesday)).toMatch(/Beer comes today/);
    expect(instructions(tuesday)).toMatch(/Humes/);
    expect(monday.stationLabel).toBe('FOH manager station');
  });

  it('gives kitchen manager the kitchen whip, fry AM/PM, dough-by-3, late-delivery questions, and drivers', () => {
    const desk = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Wednesday' });
    const text = instructions(desk);
    expect(templateIds(desk)).toEqual(expect.arrayContaining([
      'kitchen-manager-open',
      'kitchen-manager-close',
      'kitchen-manager-weekly',
      'prep-open',
      'driver-between-runs',
      'fry-open',
      'fry-close',
    ]));
    expect(text).toContain('Put dough away by 3pm');
    expect(text).toContain('Promise time — was the ticket already late when promised?');
    expect(text).toContain('Make-line — did kitchen finish on time?');
    expect(text).toContain('Handoff — was it ready for the driver?');
    expect(text).toContain('Driver arrival — did the run leave or arrive late?');
    expect(text).toContain('Between runs, dishes are the side work');
    expect(text).toContain('Confirm fryer oil is at the mark');
    expect(text).toContain('Filter oil before close');
    expect(text).toContain('Portion weights stay on the fry card');
    expect(text).toContain('Weekdays 11:00–13:00: kitchen lead (Tom) names the driver on that window.');
    expect(text).toContain('Ticket out of the printer. Driver area. Dispatch.');
    expect(desk.stationLabel).toBe('Kitchen manager station');
  });

  it('posts Tom 11-1 weekday driver naming and Fri/Sat three / Sunday two good drivers', () => {
    const wednesday = buildStaffRoleDayDesk({ seatKey: 'driver', weekday: 'Wednesday' });
    const friday = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Friday' });
    const sunday = buildStaffRoleDayDesk({ seatKey: 'driver', weekday: 'Sunday' });
    expect(instructions(wednesday)).toContain('Weekdays 11:00–13:00: kitchen lead (Tom) names the driver on that window.');
    expect(instructions(friday)).toContain('Friday and Saturday: three drivers.');
    expect(instructions(sunday)).toContain('Sunday: two good drivers.');
    expect(wednesday.scheduleBoard.some((rule) => rule.id === 'weekday-driver-11-1')).toBe(true);
    expect(friday.scheduleBoard.some((rule) => rule.id === 'weekend-three-drivers')).toBe(true);
    expect(sunday.scheduleBoard.some((rule) => rule.id === 'sunday-two-drivers')).toBe(true);
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

  it('keeps bartender, server, prep, and driver on their station card plus day extras only', () => {
    const bartender = buildStaffRoleDayDesk({ seatKey: 'bartender', weekday: 'Friday' });
    const server = buildStaffRoleDayDesk({ seatKey: 'server', weekday: 'Wednesday' });
    const prep = buildStaffRoleDayDesk({ seatKey: 'prep', weekday: 'Monday' });
    const driver = buildStaffRoleDayDesk({ seatKey: 'driver', weekday: 'Saturday' });

    expect(templateIds(bartender).every((id) => id.startsWith('bar-'))).toBe(true);
    expect(instructions(bartender)).toMatch(/Cut fruit\/extra for weekend/);
    expect(bartender.extras.join('\n')).toMatch(/extra fruit/);
    expect(bartender.extras.join('\n')).toMatch(/extra mixers/);
    expect(bartender.extras.join('\n')).toMatch(/kids cups/);
    expect(instructions(bartender)).not.toContain('Turn pizza ovens off');
    expect(instructions(bartender)).not.toContain('Dining / back room coverage');

    expect(templateIds(server)).toEqual(['waitstaff-open-wednesday', 'waitstaff-close-wednesday']);
    expect(instructions(server)).toMatch(/Buff floors/);
    expect(server.extras.join('\n')).toMatch(/Buff floors/);
    expect(server.extras.join('\n')).toMatch(/Do not arm the alarm/);
    expect(instructions(server)).not.toContain('Stock walk in (Beer comes today)');

    expect(templateIds(prep)).toEqual(['prep-open']);
    expect(instructions(prep)).toContain('Put dough away by 3pm');
    expect(instructions(prep)).not.toContain('Wash & clean under all mats');

    expect(templateIds(driver)).toEqual(['driver-between-runs']);
    expect(instructions(driver)).toContain('Between runs, dishes are the side work');
    expect(instructions(driver)).not.toContain('Promise time');
  });

  it('gives pizza, line cook, and dishwasher their own station cards', () => {
    const pizza = buildStaffRoleDayDesk({ seatKey: 'pizza', weekday: 'Saturday' });
    const line = buildStaffRoleDayDesk({ seatKey: 'line_cook', weekday: 'Thursday' });
    const dish = buildStaffRoleDayDesk({ seatKey: 'dishwasher', weekday: 'Monday' });

    expect(templateIds(pizza)).toEqual(expect.arrayContaining([
      'foh-pizza-open-saturday',
      'pizza-line-open',
      'pizza-line-close',
    ]));
    expect(instructions(pizza)).toContain('Turn pizza ovens off');
    expect(pizza.extras.join('\n')).toMatch(/soak tabs/);
    expect(instructions(pizza)).not.toContain('Wash & clean under all mats');

    expect(templateIds(line)).toEqual(expect.arrayContaining([
      'fry-open',
      'fry-close',
      'line-cook-open',
      'line-cook-close',
    ]));
    expect(instructions(line)).toContain('Confirm fryer oil is at the mark');
    expect(instructions(line)).not.toContain('Stock walk in (Beer comes today)');

    expect(templateIds(dish)).toEqual(['dish-open', 'dish-mid', 'dish-close']);
    expect(instructions(dish)).toContain('verify wash 150-160F');
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

  it('keeps Karlee, Ashley, emails, PINs, passwords, and weekly-dollar bonuses out of the pack', () => {
    const desks = CTAP_LAB_WEEKDAYS.flatMap((weekday) => buildAllStaffRoleDayDesks(weekday));
    expect(findStaffRoleDayPrivacyHits(desks)).toEqual([]);
    expect(findStaffRoleDayPrivacyHits(STAFF_ROLE_DAY_POLICIES)).toEqual([]);
    const blob = JSON.stringify(desks);
    expect(blob).not.toMatch(/karlee|sturtz|ashley|holding/i);
    expect(blob).not.toMatch(/@/);
    expect(blob).not.toMatch(/\bPIN\b/i);
    expect(blob).toMatch(/Kenzy/);
    expect(blob).toMatch(/Tom/);
    expect(blob).toMatch(/Myke/);
    expect(blob).toMatch(/Stock pop/);
    expect(blob).toMatch(/Cut fruit/);
    expect(blob).toMatch(/Do not arm the alarm/);
  });
});
