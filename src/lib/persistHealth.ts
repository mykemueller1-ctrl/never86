/**
 * Neon persist readiness. Boolean presence only.
 * Never return, log, or serialize DATABASE_URL.
 * This is not a live Neon ping and does not enable staff login.
 */

export const DATABASE_URL_ENV = 'DATABASE_URL';
export const STAFF_SEAT_LOGIN_ENABLED_ENV_NAME = 'STAFF_SEAT_LOGIN_ENABLED';

export type PersistHealth = {
  databaseUrlPresent: boolean;
};

export function databaseUrlPresent(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env[DATABASE_URL_ENV]?.trim());
}

export function persistHealth(
  env: Record<string, string | undefined> = process.env,
): PersistHealth {
  return { databaseUrlPresent: databaseUrlPresent(env) };
}

/** Public JSON body. Keys stay exactly { databaseUrlPresent }. */
export function persistHealthBody(
  env: Record<string, string | undefined> = process.env,
): PersistHealth {
  const health = persistHealth(env);
  return { databaseUrlPresent: health.databaseUrlPresent };
}
