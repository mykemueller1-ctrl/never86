import { describe, expect, it } from 'vitest';
import {
  DAY1_COACH_ID,
  DAY1_FOLDER_COACH,
  DAY1_FRONT_PICKS,
  DAY1_HOOK_PLATE_ID,
  DAY1_OPEN_ASK,
  DAY1_SOFT_DEFAULT,
  day1CoachById,
  day1FrontCopyBlob,
  day1FrontVoiceIsClean,
  day1HookCoach,
  day1HookPlate,
  firstPhotoWinLine,
  looksLikeDay1VendorAsk,
} from './day1Coach';

describe('day-1 Option C hybrid', () => {
  it('opens with floor voice plus a soft invoice / truck default — not order-guide ownership', () => {
    expect(DAY1_COACH_ID).toBe('day1-coach-option-c');
    expect(DAY1_OPEN_ASK).toBe('How can we help you?');
    expect(DAY1_SOFT_DEFAULT).toBe('Got a truck ticket or invoice? Snap it.');
    expect(DAY1_HOOK_PLATE_ID).toBe('order-guide');
    expect(day1HookPlate(new Set()).id).toBe('order-guide');
    expect(day1HookCoach(new Set()).ask).toBe(DAY1_SOFT_DEFAULT);
    expect(day1HookCoach(new Set()).chip).toMatch(/invoice|truck/i);
    expect(day1HookCoach(new Set()).chip).not.toMatch(/order guide/i);
    expect(DAY1_SOFT_DEFAULT.toLowerCase()).not.toMatch(/order guide/);
    expect(DAY1_OPEN_ASK.toLowerCase()).not.toMatch(/order guide/);
    expect(DAY1_FOLDER_COACH.map((row) => row.id)).toEqual([
      'schedule',
      'labor-cards',
      'menu',
      'order-guide',
    ]);
  });

  it('keeps secondaries as floor nouns — one pick, one action, no sitemap', () => {
    expect(DAY1_FRONT_PICKS.map((row) => row.chip)).toEqual([
      'DoorDash statement',
      'Fee line',
      "What's 86'd",
    ]);
    expect(DAY1_FRONT_PICKS).toHaveLength(3);
    expect(DAY1_FRONT_PICKS.map((row) => row.action)).toEqual(['photo', 'ask', 'ask']);
    expect(DAY1_FRONT_PICKS.every((row) => row.ask.length > 8)).toBe(true);
    const blob = DAY1_FRONT_PICKS.map((row) => `${row.chip} ${row.ask}`).join(' ').toLowerCase();
    expect(blob).not.toMatch(/module|dashboard|prime cost|sitemap|tour/);
  });

  it('after the ticket lands, next ask is schedule — not a module tour', () => {
    expect(day1HookPlate(new Set(['order-guide'])).id).toBe('schedule');
    expect(day1HookPlate(new Set(['order-guide', 'schedule'])).id).toBe('labor-cards');
  });

  it('speaks invoice, truck, short, 86 — not suite voice or invented dollars', () => {
    const text = day1FrontCopyBlob();
    expect(text).toMatch(/how can we help you/i);
    expect(text).toMatch(/truck ticket or invoice/i);
    expect(text).toMatch(/doordash/i);
    expect(text).toMatch(/86/);
    expect(text.toLowerCase()).not.toMatch(/snap this week.?s order guide/);
    expect(text.toLowerCase()).not.toMatch(/snap the order guide/);
    expect(day1FrontVoiceIsClean(text)).toBe(true);
    expect(text.toLowerCase()).not.toMatch(
      /\b(layer|spine|unlock|insight|orchestration|empower|leverage|holistic|flywheel|north star|ecosystem)\b/,
    );
    expect(JSON.stringify(DAY1_FOLDER_COACH)).not.toMatch(/\$\d/);
    expect(firstPhotoWinLine('order-guide')).toMatch(/ticket is on this seat/i);
    expect(day1CoachById('menu')?.ask).toMatch(/picture of the menu/i);
  });

  it('only opens vendor babysit when they asked about a truck', () => {
    expect(looksLikeDay1VendorAsk('Why did labor feel wrong last night?')).toBe(false);
    expect(looksLikeDay1VendorAsk('Usually Sysco Tue/Fri — forget to snap?')).toBe(true);
    expect(looksLikeDay1VendorAsk('Humes invoice')).toBe(true);
  });
});
