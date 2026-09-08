import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DAY1_FRONT_PICKS, DAY1_OPEN_ASK, DAY1_OPEN_ENERGY, day1LeadIsConversationFirst } from './day1Coach';
import { projectFoldersFromKinds } from './operatorV2';
import {
  WOW_ACCENT,
  WOW_CHARCOAL,
  WOW_DESK_ID,
  WOW_HERO,
  WOW_INK,
  WOW_MISSING_LINE,
  WOW_PAPER_LINE,
  WOW_RAIL_CATEGORIES,
  WOW_RAIL_TITLE,
  WOW_STORE_FALLBACK,
  WOW_SUBLINE,
  WOW_WATERMARK,
  wowDeskIsHonest,
  wowFrontLeadBlob,
  wowHeroIsLocked,
  wowRailFromFolders,
  wowVisualIsInkNotToyBlue,
} from './wowDesk';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('WOW desk locks', () => {
  it('locks the open hero and prime-coach subline', () => {
    expect(WOW_DESK_ID).toBe('wow-desk-rail');
    expect(WOW_HERO).toBe(
      "You're not crazy. The stack is. I'm here to get that weight off you so you can run your shop again — and win.",
    );
    expect(WOW_SUBLINE).toBe('Your prime coach is finally here. No back-office homework.');
    expect(wowHeroIsLocked()).toBe(true);
    expect(WOW_SUBLINE.toLowerCase()).not.toContain('prime cost coach');
    expect(WOW_SUBLINE.toLowerCase()).toContain('prime coach');
    expect(WOW_SUBLINE.toLowerCase()).toContain('no back-office homework');
  });

  it('keeps an honesty Missing rail — never invent dollars', () => {
    expect(WOW_RAIL_TITLE).toBe('Missing');
    expect(WOW_RAIL_CATEGORIES.map((row) => row.label)).toEqual([
      'Schedules',
      'Food',
      'Drinks/Pop',
      'Beer',
      'Liquor',
    ]);
    const empty = wowRailFromFolders([]);
    expect(empty.every((row) => row.state === 'NEED')).toBe(true);
    expect(empty.every((row) => row.line === WOW_MISSING_LINE)).toBe(true);
    expect(empty.every((row) => row.dollars === 'none')).toBe(true);
    expect(JSON.stringify(empty)).not.toMatch(/\$\d/);

    const withMenu = wowRailFromFolders(projectFoldersFromKinds(new Set(['menu'])));
    expect(withMenu.find((row) => row.id === 'food')?.state).toBe('READY');
    expect(withMenu.find((row) => row.id === 'food')?.line).toBe(WOW_PAPER_LINE);
    expect(withMenu.filter((row) => row.id !== 'food').every((row) => row.state === 'NEED')).toBe(true);

    const invoiceOnly = wowRailFromFolders(projectFoldersFromKinds(new Set(['invoice-truck'])));
    expect(invoiceOnly.every((row) => row.state === 'NEED')).toBe(true);
  });

  it('does not reopen Option C truck-first or the stiff Snap CTA', () => {
    const blob = wowFrontLeadBlob();
    expect(wowDeskIsHonest(blob)).toBe(true);
    expect(blob.toLowerCase()).not.toMatch(/got a truck ticket or invoice\?\s*snap it/);
    expect(blob.toLowerCase()).not.toMatch(/this gets your mess/);
    expect(blob.toLowerCase()).not.toMatch(/paper invoices\.\s*one photo/);
    expect(day1LeadIsConversationFirst()).toBe(true);
    expect(DAY1_FRONT_PICKS.map((row) => row.chip)).toEqual([
      'Bartender leak',
      'Behind on books',
      'Too many hats',
      'Invoice / truck',
    ]);
  });

  it('paints ink / charcoal with one amber accent and a quiet watermark', () => {
    expect(WOW_INK).toBe('#0B0D10');
    expect(WOW_CHARCOAL).toBe('#1A1F26');
    expect(WOW_ACCENT).toBe('#C9A36A');
    expect(WOW_WATERMARK).toBe('Never86');
    const css = read('src/app/globals.css');
    expect(wowVisualIsInkNotToyBlue(css)).toBe(true);
    expect(css).not.toMatch(/\.owner-desk-page[\s\S]{0,400}#0066ff/);
  });

  it('wires first paint — store name, WOW hero, then conversation branches', () => {
    const page = read('src/app/operator/page.tsx');
    const ui = read('src/components/FreeOperatorPhone.tsx');
    expect(page).toContain('SimpleOwnerDemo');
    expect(page).toContain('ctapSeat1Restaurant');
    expect(ui).toContain('WOW_HERO');
    expect(ui).toContain('WOW_SUBLINE');
    expect(ui).toContain('wowRailFromFolders');
    expect(ui).toContain('DAY1_FRONT_PICKS');
    expect(ui).toContain('DAY1_OPEN_ASK');
    expect(ui).toContain('DAY1_OPEN_ENERGY');
    expect(ui).toMatch(/storeName/);
    expect(ui).toContain('owner-desk-rail');
    expect(ui).toContain(WOW_STORE_FALLBACK === 'Community Tap' ? 'storeName' : 'Community Tap');
    expect(ui).not.toContain('Prime Cost Coach');
    expect(ui).not.toMatch(/Got a truck ticket or invoice\? Snap it/);
    expect(ui).not.toMatch(/This gets your mess/);
    expect(ui.indexOf('WOW_HERO')).toBeLessThan(ui.indexOf('DAY1_FRONT_PICKS.map'));
    expect(DAY1_OPEN_ASK).toBe("What's the problem today?");
    expect(DAY1_OPEN_ENERGY).toBe("What's going on?");
  });
});
