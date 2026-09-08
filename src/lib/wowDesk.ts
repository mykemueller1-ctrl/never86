import { CTAP_SEAT1_RESTAURANT_DEFAULT } from './ctapSeat1';
import type { OperatorV2FolderState } from './operatorV2';

/**
 * WOW desk locks — /operator first paint on top of conversation-first.
 * Packet intent only. Do not reintroduce Option C truck-first.
 */
export const WOW_DESK_ID = 'wow-desk-rail';

export const WOW_HERO =
  "You're not crazy. The stack is. I'm here to get that weight off you so you can run your shop again — and win.";

export const WOW_SUBLINE = 'Your prime coach is finally here. No back-office homework.';

export const WOW_MISSING_LINE = 'Missing / bring a paper';
export const WOW_PAPER_LINE = 'Paper on this seat. No dollars invented.';
export const WOW_RAIL_TITLE = 'Missing';
export const WOW_WATERMARK = 'Never86';
export const WOW_STORE_FALLBACK = CTAP_SEAT1_RESTAURANT_DEFAULT;

export const WOW_INK = '#0B0D10';
export const WOW_CHARCOAL = '#1A1F26';
/** The one accent — amber on ink. Not Void Hunter toy blue. */
export const WOW_ACCENT = '#C9A36A';

export type WowRailId = 'schedules' | 'food' | 'drinks-pop' | 'beer' | 'liquor';

export type WowRailCategory = {
  id: WowRailId;
  label: string;
  folderIds: readonly string[];
};

export const WOW_RAIL_CATEGORIES: readonly WowRailCategory[] = [
  { id: 'schedules', label: 'Schedules', folderIds: ['schedule'] },
  { id: 'food', label: 'Food', folderIds: ['menu'] },
  { id: 'drinks-pop', label: 'Drinks/Pop', folderIds: [] },
  { id: 'beer', label: 'Beer', folderIds: [] },
  { id: 'liquor', label: 'Liquor', folderIds: [] },
] as const;

export type WowRailRow = {
  id: WowRailId;
  label: string;
  state: 'NEED' | 'READY';
  line: string;
  dollars: 'none';
};

const STIFF_TRUCK_LEAD = /got a truck ticket or invoice\?\s*snap it/i;
const OPTION_C_TRUCK_HOME = /this gets your mess|paper invoices\.\s*one photo|got a truck ticket/i;
const TOY_BLUE = /#0066ff|#003bb5/i;
const INVENTED_DOLLARS = /\$\d/;

export function wowRailFromFolders(folders: readonly OperatorV2FolderState[] = []): WowRailRow[] {
  return WOW_RAIL_CATEGORIES.map((category) => {
    const ready = category.folderIds.some((id) =>
      folders.some((folder) => folder.id === id && folder.state === 'READY'),
    );
    return {
      id: category.id,
      label: category.label,
      state: ready ? 'READY' : 'NEED',
      line: ready ? WOW_PAPER_LINE : WOW_MISSING_LINE,
      dollars: 'none',
    };
  });
}

export function wowFrontLeadBlob(): string {
  return [WOW_HERO, WOW_SUBLINE, WOW_MISSING_LINE, WOW_PAPER_LINE].join(' ');
}

export function wowDeskIsHonest(text = wowFrontLeadBlob()): boolean {
  return !INVENTED_DOLLARS.test(text) && !STIFF_TRUCK_LEAD.test(text) && !OPTION_C_TRUCK_HOME.test(text);
}

export function wowVisualIsInkNotToyBlue(css: string): boolean {
  const page = css.includes('.owner-desk-page') ? css.slice(css.indexOf('.owner-desk-page')) : css;
  return (
    page.includes(WOW_INK) &&
    page.includes(WOW_CHARCOAL) &&
    page.includes(WOW_ACCENT) &&
    page.includes(WOW_WATERMARK) &&
    !TOY_BLUE.test(page)
  );
}

export function wowHeroIsLocked(text = WOW_HERO): boolean {
  return (
    text === WOW_HERO &&
    /you're not crazy/i.test(text) &&
    /the stack is/i.test(text) &&
    /run your shop again/i.test(text) &&
    !STIFF_TRUCK_LEAD.test(text)
  );
}
