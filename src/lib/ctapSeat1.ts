/**
 * Community Tap is the canary 1-seat on never86.ai.
 * Public shop email only. No store codes, staff names, or private dollars in git.
 */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const CTAP_SEAT1_EMAIL_ENV = 'CTAP_SEAT1_EMAIL';
export const CTAP_SEAT1_RESTAURANT_ENV = 'CTAP_SEAT1_RESTAURANT';

export const CTAP_SEAT1_EMAIL_DEFAULT = 'communitypizza2026@gmail.com';
export const CTAP_SEAT1_RESTAURANT_DEFAULT = 'Community Tap';
export const CTAP_SEAT1_PUBLIC_LABEL = 'Community Tap · first store · seat 1';
/** Same floor as operatorActivation.FREE_SEAT_ID_FLOOR — first free-seat id. */
export const CTAP_SEAT1_OPERATOR_ID = 1_000_000;

export function ctapSeat1Email(env: NodeJS.ProcessEnv = process.env): string {
  return normalizeEmail(env[CTAP_SEAT1_EMAIL_ENV] || CTAP_SEAT1_EMAIL_DEFAULT);
}

export function ctapSeat1Restaurant(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env[CTAP_SEAT1_RESTAURANT_ENV]?.trim();
  return raw || CTAP_SEAT1_RESTAURANT_DEFAULT;
}

export function isCtapSeat1Email(email: string, env: NodeJS.ProcessEnv = process.env): boolean {
  return normalizeEmail(email) === ctapSeat1Email(env);
}

export function restaurantNameForSeatClaim(
  email: string,
  requestedName: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (isCtapSeat1Email(email, env)) return ctapSeat1Restaurant(env);
  const trimmed = requestedName?.trim().replace(/\s+/g, ' ');
  return trimmed || 'My restaurant';
}
