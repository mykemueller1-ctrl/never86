import { describe, expect, it } from 'vitest';
import {
  DAY1_FOLDER_COACH,
  DAY1_HOOK_PLATE_ID,
  day1CoachById,
  day1HookCoach,
  day1HookPlate,
  firstPhotoWinLine,
  looksLikeDay1VendorAsk,
} from './day1Coach';

describe('day-1 10-minute hook', () => {
  it('prefers order guide as the first photo win', () => {
    expect(DAY1_HOOK_PLATE_ID).toBe('order-guide');
    expect(day1HookPlate(new Set()).id).toBe('order-guide');
    expect(day1HookCoach(new Set()).chip).toMatch(/order guide/i);
    expect(DAY1_FOLDER_COACH.map((row) => row.id)).toEqual([
      'schedule',
      'labor-cards',
      'menu',
      'order-guide',
    ]);
  });

  it('after order guide lands, next ask is schedule — not a module tour', () => {
    expect(day1HookPlate(new Set(['order-guide'])).id).toBe('schedule');
    expect(day1HookPlate(new Set(['order-guide', 'schedule'])).id).toBe('labor-cards');
  });

  it('speaks operator snaps, not SaaS setup', () => {
    const text = DAY1_FOLDER_COACH.map((row) => `${row.ask} ${row.winning}`).join(' ');
    expect(text).toMatch(/snap/i);
    expect(text).toMatch(/you’re winning/i);
    expect(text.toLowerCase()).not.toMatch(/unlock|dashboard|module|integration|portal password/);
    expect(JSON.stringify(DAY1_FOLDER_COACH)).not.toMatch(/\$\d/);
    expect(firstPhotoWinLine('order-guide')).toMatch(/you’re winning/i);
    expect(day1CoachById('menu')?.ask).toMatch(/picture of the menu/i);
  });

  it('only opens vendor babysit when they asked about a truck', () => {
    expect(looksLikeDay1VendorAsk('Why did labor feel wrong last night?')).toBe(false);
    expect(looksLikeDay1VendorAsk('Usually Sysco Tue/Fri — forget to snap?')).toBe(true);
    expect(looksLikeDay1VendorAsk('Humes invoice')).toBe(true);
  });
});
