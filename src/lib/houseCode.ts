/**
 * CTAP house-code portal — the only Community seat door.
 * Enabled and fail-closed until a hash is issued. Hashes only.
 * No live CTAP codes, PINs, or staff names in git.
 */

import { createHash, timingSafeEqual } from 'node:crypto';

export const HOUSE_CODE_SEAT_DOOR = '/portal' as const;
export const HOUSE_CODE_BRAND_BLUE = '#0066ff';
export const HOUSE_CODE_HASH_ENV = 'HOUSE_CODE_HASH';
export const HOUSE_CODE_OPERATOR_ID_ENV = 'HOUSE_CODE_OPERATOR_ID';
export const HOUSE_CODE_PEPPER_ENV = 'HOUSE_CODE_PEPPER';

/** Public synthetic phrase for tests only. Not a live house code. */
export const SYNTHETIC_HOUSE_CODE = 'N86-SAMPLE-HOUSE';
export const SYNTHETIC_OPERATOR_ID = 1;

export type HouseCodeVerifyInput = {
  code: string;
  expectedHash?: string;
  operatorId?: number;
  pepper?: string;
};

export type HouseCodeSession = {
  operatorId: number;
  seatDoor: typeof HOUSE_CODE_SEAT_DOOR;
  verified: true;
  liveIssuance: 'blocked';
};

export type HouseCodeResult =
  | { ok: true; session: HouseCodeSession }
  | {
      ok: false;
      error: 'code_required' | 'invalid' | 'not_issued';
      status: 401;
      hint: string;
    };

export function normalizeHouseCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '-');
}

export function hashHouseCode(code: string, pepper = ''): string {
  return createHash('sha256').update(`${pepper}:${normalizeHouseCode(code)}`).digest('hex');
}

export const SYNTHETIC_HOUSE_CODE_HASH = hashHouseCode(SYNTHETIC_HOUSE_CODE, 'test');

function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyHouseCode(input: HouseCodeVerifyInput): HouseCodeResult {
  const expected = input.expectedHash?.trim();
  const operatorId = Number(input.operatorId);
  if (!expected || !Number.isInteger(operatorId) || operatorId <= 0) {
    return {
      ok: false,
      error: 'not_issued',
      status: 401,
      hint: 'House-code door is enabled and fail-closed. No live code has been issued.',
    };
  }

  const code = input.code?.trim();
  if (!code) {
    return {
      ok: false,
      error: 'code_required',
      status: 401,
      hint: 'Enter the house code. Never paste a PIN, password, or staff name.',
    };
  }

  const offered = hashHouseCode(code, input.pepper ?? '');
  if (!hashesEqual(offered, expected)) {
    return {
      ok: false,
      error: 'invalid',
      status: 401,
      hint: 'House code did not match. No seat opened. No private store data returned.',
    };
  }

  return {
    ok: true,
    session: {
      operatorId,
      seatDoor: HOUSE_CODE_SEAT_DOOR,
      verified: true,
      liveIssuance: 'blocked',
    },
  };
}

export function verifyHouseCodeFromEnv(
  code: string,
  env: NodeJS.ProcessEnv = process.env,
): HouseCodeResult {
  const operatorId = Number(env[HOUSE_CODE_OPERATOR_ID_ENV] ?? '');
  return verifyHouseCode({
    code,
    expectedHash: env[HOUSE_CODE_HASH_ENV],
    operatorId: Number.isInteger(operatorId) ? operatorId : undefined,
    pepper: env[HOUSE_CODE_PEPPER_ENV] ?? '',
  });
}
