import { describe, expect, it } from 'vitest';
import { CTAP_LAB_WEEKDAYS } from './ctapLabPack';
import { STATION_SEAT_KEYS } from './staffSeatAuth';
import {
  CTAP_BAR_WEEK_EXTRAS,
  CTAP_BAR_WEEK_PACK_ID,
  CTAP_BAR_WEEK_PACK_STATUS,
  CTAP_BAR_WEEK_SHORT_LABEL,
  barWeekExtrasForSeat,
  barWeekExtrasForWeekday,
  barWeekShortLabel,
} from './ctapBarWeekExtras';

describe('CTap bar-week extras', () => {
  it('posts one short label per weekday onto the Schedule strip', () => {
    expect(CTAP_BAR_WEEK_PACK_STATUS).toBe('drafted');
    expect(CTAP_BAR_WEEK_PACK_ID).toBe('ctap-bar-week-v1');
    expect(CTAP_LAB_WEEKDAYS.map((day) => `${day}:${barWeekShortLabel(day)}`)).toEqual([
      'Monday:pop/ice',
      'Tuesday:beer-in + fruit',
      'Wednesday:buff + no alarm',
      'Thursday:towels/bloody/fountain',
      'Friday:extra fruit/mixers/kids cups + BBQ',
      'Saturday:pop machine soak',
      'Sunday:parm + buff',
    ]);
    expect(Object.keys(CTAP_BAR_WEEK_SHORT_LABEL)).toEqual([...CTAP_LAB_WEEKDAYS]);
  });

  it('keeps extras as unnamed station slots, never roster names', () => {
    expect(CTAP_BAR_WEEK_EXTRAS.every((row) => row.namedPerson === false)).toBe(true);
    expect(barWeekExtrasForWeekday('Monday').map((row) => row.item).join('\n')).toMatch(/Stock pop/);
    expect(barWeekExtrasForWeekday('Monday').map((row) => row.item).join('\n')).toMatch(/Fill ice/);
    expect(barWeekExtrasForWeekday('Tuesday').map((row) => row.item).join('\n')).toMatch(/Beer comes in/);
    expect(barWeekExtrasForWeekday('Tuesday').map((row) => row.item).join('\n')).toMatch(/Cut fruit/);
    expect(barWeekExtrasForWeekday('Wednesday').map((row) => row.item).join('\n')).toMatch(/Buff floors/);
    expect(barWeekExtrasForWeekday('Wednesday').map((row) => row.item).join('\n')).toMatch(/Do not arm the alarm/);
    expect(barWeekExtrasForWeekday('Thursday').map((row) => row.item).join('\n')).toMatch(/bar towels/);
    expect(barWeekExtrasForWeekday('Thursday').map((row) => row.item).join('\n')).toMatch(/Bloody Mary/);
    expect(barWeekExtrasForWeekday('Thursday').map((row) => row.item).join('\n')).toMatch(/fountain pop/);
    expect(barWeekExtrasForWeekday('Friday').map((row) => row.item).join('\n')).toMatch(/extra fruit/);
    expect(barWeekExtrasForWeekday('Friday').map((row) => row.item).join('\n')).toMatch(/extra mixers/);
    expect(barWeekExtrasForWeekday('Friday').map((row) => row.item).join('\n')).toMatch(/kids cups/);
    expect(barWeekExtrasForWeekday('Friday').map((row) => row.item).join('\n')).toMatch(/BBQ sauce/);
    expect(barWeekExtrasForWeekday('Saturday').map((row) => row.item).join('\n')).toMatch(/soak tabs/);
    expect(barWeekExtrasForWeekday('Sunday').map((row) => row.item).join('\n')).toMatch(/parmesan/);
    expect(barWeekExtrasForWeekday('Sunday').map((row) => row.item).join('\n')).toMatch(/Buff floors/);
    expect(CTAP_BAR_WEEK_EXTRAS.every((row) => /slot/i.test(row.slotLabel))).toBe(true);
  });

  it('shows Saturday soak on the pizza slot and keeps BOH crew off bartender extras', () => {
    expect(barWeekExtrasForSeat('pizza', 'Saturday').map((row) => row.item).join('\n')).toMatch(/soak tabs/);
    expect(barWeekExtrasForSeat('prep', 'Monday')).toEqual([]);
    expect(barWeekExtrasForSeat('driver', 'Friday')).toEqual([]);
    expect(barWeekExtrasForSeat('dishwasher', 'Thursday')).toEqual([]);
    expect(barWeekExtrasForSeat('line_cook', 'Wednesday')).toEqual([]);
    expect(barWeekExtrasForSeat('kitchen_manager', 'Tuesday')).toEqual([]);
    expect(barWeekExtrasForSeat('bartender', 'Monday').length).toBeGreaterThan(0);
    expect(barWeekExtrasForSeat('owner', 'Wednesday').some((row) => /alarm/i.test(row.item))).toBe(true);
  });

  it('does not put Ashley, Karlee, credentials, or mail into the pack', () => {
    const blob = JSON.stringify({ extras: CTAP_BAR_WEEK_EXTRAS, seats: STATION_SEAT_KEYS });
    expect(blob).not.toMatch(/karlee|sturtz|ashley|holding/i);
    expect(blob).not.toMatch(/@/);
    expect(blob).not.toMatch(/\bPIN\b|password/i);
    expect(blob).not.toMatch(/facebook/i);
    expect(blob).not.toMatch(/mailSent.:true/);
  });
});
