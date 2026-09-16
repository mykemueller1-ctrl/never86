/**
 * Public One Seat door on never86.ai.
 * ChatGPT Sites V28 is archived. Operators do not onboard there.
 */

export const ONE_SEAT_ORIGIN = 'https://www.never86.ai';

export const ONE_SEAT_PATHS = {
  home: '/',
  try: '/try',
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

/** Archived ChatGPT Sites host. Do not send the public core win here. */
export const CHATGPT_SITES_ARCHIVE_URL =
  'https://action-shift-one-seat-v2.never86-d-9722.chatgpt.site';

/** Native origin. Kept so older imports resolve on never86.ai, not chatgpt.site. */
export const SELECTED_SITES_BASE_URL = ONE_SEAT_ORIGIN;

export const SELECTED_SITES_CONTACT_URL = ONE_SEAT_PATHS.contact;

export const SELECTED_SITES_CHECK_URLS = {
  invoices: ONE_SEAT_PATHS.checkInvoices,
  labor: ONE_SEAT_PATHS.checkLabor,
  menu: ONE_SEAT_PATHS.checkMenu,
} as const;

export function isChatgptSitesHost(url: string): boolean {
  return /never86-d-9722\.chatgpt\.site/i.test(url);
}
