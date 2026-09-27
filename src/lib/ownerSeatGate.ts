import { isCtapRestaurantName, isNagRestaurantName, NAG_SEAT_RESTAURANT_NAME } from './seatIsolation';

/** Signed-in owner seat. Not the public sample answers under /operator/answers. */
export const OWNER_SEAT_PATH = '/operator' as const;

/** Signed-out visitors land here, then come back to the seat after sign-in. */
export const OWNER_SEAT_LOGIN_HREF = '/login?returnTo=/operator' as const;

export const OWNER_SEAT_SIGNOUT = {
  endpoint: '/api/operator/logout',
  method: 'POST',
  next: '/login',
} as const;

const PUBLIC_PATHS = ['/', '/story', '/portal', '/onboard', '/activate', '/login'] as const;

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

/** Only the owner seat itself. Public sample answers stay on /operator/answers. */
export function isOwnerSeatPath(pathname: string): boolean {
  return normalizePath(pathname) === OWNER_SEAT_PATH;
}

/**
 * Where an unsigned request for the owner seat should go.
 * Null means this path is not the owner seat (public pages stay put).
 */
export function ownerSeatUnauthenticatedRedirect(pathname: string): string | null {
  if (!isOwnerSeatPath(pathname)) return null;
  return OWNER_SEAT_LOGIN_HREF;
}

export function ownerSeatPublicPathsStayOpen(pathname: string): boolean {
  const path = normalizePath(pathname);
  return (PUBLIC_PATHS as readonly string[]).includes(path);
}

/** Only /operator is a safe post-login return. Blocks open redirects. */
export function safeOwnerReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value !== OWNER_SEAT_PATH && value !== `${OWNER_SEAT_PATH}/`) return null;
  return OWNER_SEAT_PATH;
}

/**
 * Restaurant name safe to paint on the owner seat.
 * Community Tap only for that store's signed-in owner. Everyone else gets null.
 */
export function restaurantNameForOwnerSeat(input: {
  signedIn: boolean;
  ctapOwner: boolean;
  restaurantName?: string | null;
}): string | null {
  if (!input.signedIn) return null;
  const named = input.restaurantName?.trim().replace(/\s+/g, ' ') ?? '';
  if (!named) return null;
  if (isCtapRestaurantName(named) && !input.ctapOwner) return null;
  if (isNagRestaurantName(named)) return NAG_SEAT_RESTAURANT_NAME;
  return named;
}

/** Header label. Never the Community Tap fallback unless this session owns that store. */
export function ownerSeatHeaderLabel(input: {
  signedIn: boolean;
  ctapOwner: boolean;
  restaurantName?: string | null;
}): string {
  return restaurantNameForOwnerSeat(input) ?? 'Owner seat';
}
