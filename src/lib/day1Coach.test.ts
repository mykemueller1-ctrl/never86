import { describe, expect, it } from 'vitest';
import {
  DAY1_COACH_ID,
  DAY1_FOLDER_COACH,
  DAY1_FRONT_PICKS,
  DAY1_HELP_ENERGY,
  DAY1_HOOK_PLATE_ID,
  DAY1_IDENTITY_LINE,
  DAY1_INVOICE_PATH_ASK,
  DAY1_INVOICE_PLATE_ID,
  DAY1_MISSING_EMPTY,
  DAY1_MISSING_SPINE,
  DAY1_OPEN_ASK,
  DAY1_OPEN_ENERGY,
  DAY1_PREVIEW_CONTRACT,
  DAY1_PROMISE_LINE,
  DAY1_STORE_NAME_FALLBACK,
  DAY1_SUBLINE,
  DAY1_WEIRD_ASK,
  day1CoachById,
  day1FrontCopyBlob,
  day1FrontNeedsPhoto,
  day1FrontVoiceIsClean,
  day1HookCoach,
  day1HookPlate,
  day1LeadIsConversationFirst,
  day1MissingSpineCopy,
  firstPhotoWinLine,
  looksLikeDay1BartenderAsk,
  looksLikeDay1VendorAsk,
} from './day1Coach';

describe('day-1 operator-first WOW coach', () => {
  it('opens adult — not soft problem, not the stiff truck / invoice CTA', () => {
    expect(DAY1_COACH_ID).toBe('day1-coach-operator-wow');
    expect(DAY1_OPEN_ASK).toBe(
      "You're not crazy. The stack is. I'm here to get that weight off you so you can run your shop again — and win.",
    );
    expect(DAY1_SUBLINE).toBe('Your prime coach is finally here. No back-office homework.');
    expect(DAY1_OPEN_ENERGY).toBe(DAY1_SUBLINE);
    expect(DAY1_WEIRD_ASK).toBe('What got weird at the shop?');
    expect(DAY1_HELP_ENERGY).toBe('How can we help you?');
    expect(DAY1_STORE_NAME_FALLBACK).toBe('Community Tap');
    expect(DAY1_IDENTITY_LINE).toMatch(/built by Myke Mueller/);
    expect(DAY1_IDENTITY_LINE).toMatch(/operator first/);
    expect(DAY1_IDENTITY_LINE).toMatch(/was you/);
    expect(DAY1_PROMISE_LINE).toMatch(/Find the leak/);
    expect(DAY1_PREVIEW_CONTRACT).toMatch(/Nothing sends without you/);
    expect(DAY1_OPEN_ASK).not.toMatch(/what's your problem/i);
    expect(DAY1_OPEN_ASK).not.toMatch(/got a truck ticket or invoice/i);
    expect(DAY1_SUBLINE).not.toMatch(/got a truck ticket or invoice/i);
    expect(DAY1_INVOICE_PATH_ASK.toLowerCase()).not.toMatch(/order guide/);
    expect(DAY1_HOOK_PLATE_ID).toBe('invoice-truck');
    expect(DAY1_INVOICE_PLATE_ID).toBe('invoice-truck');
    expect(day1HookPlate(new Set()).id).toBe('invoice-truck');
    expect(day1HookCoach(new Set()).chip).toMatch(/invoice|truck/i);
    expect(day1HookCoach(new Set()).chip).not.toMatch(/order guide/i);
    expect(day1LeadIsConversationFirst()).toBe(true);
    expect(DAY1_FOLDER_COACH.map((row) => row.id)).toEqual([
      'schedule',
      'labor-cards',
      'menu',
      'invoice-truck',
    ]);
  });

  it('keeps the Missing honesty spine — no fake dollars', () => {
    expect(DAY1_MISSING_SPINE.map((row) => row.label)).toEqual([
      'Schedules',
      'Food',
      'Drinks/Pop',
      'Beer',
      'Liquor',
    ]);
    expect(DAY1_MISSING_EMPTY).toBe('Missing / bring a paper');
    for (const row of DAY1_MISSING_SPINE) {
      expect(day1MissingSpineCopy(row.id, new Set())).toBe('Missing / bring a paper');
    }
    expect(day1MissingSpineCopy('schedules', new Set(['schedule']))).toBe('Paper in');
    expect(day1MissingSpineCopy('food', new Set(['invoice-truck']))).toBe('Paper in');
    expect(day1MissingSpineCopy('beer', new Set(['invoice-truck']))).toBe('Missing / bring a paper');
    expect(JSON.stringify(DAY1_MISSING_SPINE)).not.toMatch(/\$\d/);
  });

  it('keeps branches as floor nouns — conversation first, invoice when they choose it', () => {
    expect(DAY1_FRONT_PICKS.map((row) => row.chip)).toEqual([
      'Bartender leak',
      'Behind on books',
      'Too many hats',
      'Invoice / truck',
    ]);
    expect(DAY1_FRONT_PICKS.map((row) => row.action)).toEqual(['ask', 'ask', 'ask', 'photo']);
    expect(DAY1_FRONT_PICKS.find((row) => row.id === 'bartender-leak')?.ask).toMatch(/name/i);
    expect(DAY1_FRONT_PICKS.find((row) => row.id === 'behind-on-books')?.ask).toMatch(/30-60-90|P&L/i);
    expect(DAY1_FRONT_PICKS.find((row) => row.id === 'too-many-hats')?.ask).toMatch(/that's why we're here/i);
    expect(day1FrontNeedsPhoto('bartender-leak')).toBe(false);
    expect(day1FrontNeedsPhoto('invoice-truck')).toBe(true);
    const blob = DAY1_FRONT_PICKS.map((row) => `${row.chip} ${row.ask}`).join(' ').toLowerCase();
    expect(blob).not.toMatch(/module|dashboard|prime cost|sitemap|tour|all-in-one/);
  });

  it('after the ticket lands, next ask is schedule — not a module tour', () => {
    expect(day1HookPlate(new Set(['invoice-truck'])).id).toBe('schedule');
    expect(day1HookPlate(new Set(['order-guide'])).id).toBe('schedule');
    expect(day1HookPlate(new Set(['invoice-truck', 'schedule'])).id).toBe('labor-cards');
  });

  it('speaks weight, hats, missing — not suite voice or invented dollars', () => {
    const text = day1FrontCopyBlob();
    expect(text).toMatch(/you're not crazy\. the stack is/i);
    expect(text).toMatch(/prime coach is finally here/i);
    expect(text).toMatch(/no back-office homework/i);
    expect(text).toMatch(/community tap/i);
    expect(text).toMatch(/missing \/ bring a paper/i);
    expect(text).toMatch(/how can we help you/i);
    expect(text).toMatch(/bartender/i);
    expect(text).toMatch(/drawer/i);
    expect(text).toMatch(/30-60-90|P&L/);
    expect(text).toMatch(/hats/);
    expect(text.toLowerCase()).not.toMatch(/got a truck ticket or invoice\?\s*snap it/);
    expect(text.toLowerCase()).not.toMatch(/snap this week.?s order guide/);
    expect(text.toLowerCase()).not.toMatch(/snap the order guide/);
    expect(text.toLowerCase()).not.toMatch(/prime cost coach/);
    expect(text.toLowerCase()).not.toMatch(/all-in-one dashboard/);
    expect(day1FrontVoiceIsClean(text)).toBe(true);
    expect(JSON.stringify(DAY1_FOLDER_COACH)).not.toMatch(/\$\d/);
    expect(firstPhotoWinLine('invoice-truck')).toMatch(/ticket is on this seat/i);
    expect(firstPhotoWinLine('order-guide')).toMatch(/ticket is on this seat/i);
    expect(day1CoachById('menu')?.ask).toMatch(/picture of the menu/i);
  });

  it('only opens vendor babysit when they asked about a truck', () => {
    expect(looksLikeDay1VendorAsk('Why did labor feel wrong last night?')).toBe(false);
    expect(looksLikeDay1VendorAsk('Usually Sysco Tue/Fri — forget to snap?')).toBe(true);
    expect(looksLikeDay1VendorAsk('Humes invoice')).toBe(true);
    expect(looksLikeDay1BartenderAsk('bartender leak')).toBe(true);
    expect(looksLikeDay1BartenderAsk('behind on books')).toBe(false);
  });
});
