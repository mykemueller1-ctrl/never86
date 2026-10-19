/**
 * Public One Seat door on never86.ai.
 * ChatGPT Sites V28 and app.never86.app are aliases / archive — not onboard doors.
 */

import {
  ONE_DOOR_ALIAS_HOSTS,
  ONE_DOOR_CANONICAL_ORIGIN,
  isOneDoorAliasHost,
} from './oneDoor';

export const ONE_SEAT_ORIGIN = ONE_DOOR_CANONICAL_ORIGIN;

export const ONE_SEAT_PATHS = {
  home: '/',
  try: '/try',
  seat: '/seat',
  chat: '/chat',
  tryLabor: '/try/labor',
  tryRecipes: '/try/recipes',
  tryWatch: '/try/watch',
  checkInvoices: '/check/invoices',
  checkLabor: '/check/labor',
  checkMenu: '/check/menu',
  onboard: '/onboard',
  contact: '/contact',
  login: '/login',
  operator: '/operator',
  trial: '/trial',
} as const;

/** Archived ChatGPT Sites host. Operators do not onboard there. */
export const CHATGPT_SITES_ARCHIVE_URL =
  'https://action-shift-one-seat-v2.never86-d-9722.chatgpt.site';

/** @deprecated Use NEVER86_SEAT_URL — ChatGPT gold is archive-only. */
export const CHATGPT_ONE_SEAT_GOLD_URL =
  'https://action-shift-one-seat-v2.never86-d-9722.chatgpt.site/seat';

export const NEVER86_TRY_URL = `${ONE_SEAT_ORIGIN}/try`;
export const NEVER86_SEAT_URL = `${ONE_SEAT_ORIGIN}/seat`;
export const NEVER86_ONBOARD_URL = `${ONE_SEAT_ORIGIN}/onboard`;

/** Native origin. Kept so older imports resolve on never86.ai, not chatgpt.site. */
export const SELECTED_SITES_BASE_URL = ONE_SEAT_ORIGIN;

export const SELECTED_SITES_CONTACT_URL = ONE_SEAT_PATHS.contact;

export const SELECTED_SITES_CHECK_URLS = {
  invoices: ONE_SEAT_PATHS.checkInvoices,
  labor: ONE_SEAT_PATHS.checkLabor,
  menu: ONE_SEAT_PATHS.checkMenu,
} as const;

export { ONE_DOOR_ALIAS_HOSTS, isOneDoorAliasHost };

export function isChatgptSitesHost(url: string): boolean {
  return /never86-d-9722\.chatgpt\.site/i.test(url) || /(?:^|\.)never86\.app(?::|$|\/)/i.test(url);
}
